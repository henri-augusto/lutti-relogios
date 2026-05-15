import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { findUserById, normalizeCep, normalizeEmail } from "@/lib/auth-users";
import { resolvePublicBaseUrl } from "@/lib/app-url";
import { firstCheckoutValidationError } from "@/lib/checkout-validacao";
import {
  MIN_CHECKOUT_TOTAL_ITEMS,
  MIN_CHECKOUT_TOTAL_ITEMS_ERROR_MESSAGE,
  normalizeCheckoutQuantity,
} from "@/lib/checkout-quantity";
import { CheckoutError, createStripeCheckoutSession } from "@/lib/checkout-session";

function normalizePrecoCentavos(raw) {
  if (raw === undefined || raw === null || raw === "") {
    return NaN;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return NaN;
  }
  return Math.round(n);
}

function buildEnderecoCompleto(address) {
  const cep = normalizeCep(address?.cep ?? "");
  const street = typeof address?.street === "string" ? address.street.trim() : "";
  const number = typeof address?.number === "string" ? address.number.trim() : "";
  const complement = typeof address?.complement === "string" ? address.complement.trim() : "";
  const neighborhood = typeof address?.neighborhood === "string" ? address.neighborhood.trim() : "";
  const city = typeof address?.city === "string" ? address.city.trim() : "";
  const state = typeof address?.state === "string" ? address.state.trim() : "";

  return [
    `${street}, ${number}`.replace(/^,|,$/g, "").trim(),
    complement,
    neighborhood,
    `${city} - ${state}`.replace(/^ - | - $/g, "").trim(),
    cep ? `CEP ${cep}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * Cria sessao Stripe Checkout. Exige chaves em `.env.local`:
 * - STRIPE_SECRET_KEY (servidor)
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (validada em lib/stripe-env.js junto com a secret)
 *
 * Metodos de pagamento: dinamicos via Dashboard (lib/stripe-checkout-payment-methods.js).
 * Ative PIX etc. em https://dashboard.stripe.com/settings/payment_methods
 *
 * POST /api/checkout
 * Body JSON:
 * - slug: string (obrigatorio — validado no servidor com o cadastro)
 * - nomeProduto: string (deve ser igual ao nome cadastrado)
 * - preco: number — preco unitario em centavos BRL (deve ser igual ao cadastro)
 * - quantity ou quantidade: inteiro (1–99); padrao 1 se ausente/invalido
 * - customerEmail: string opcional (email valido preenchido no checkout)
 * - document, telefone, nomeCliente, address: { cep, street, number, complement, neighborhood, city, state }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const bodyItems = Array.isArray(body?.items) ? body.items : [];

    const items =
      bodyItems.length > 0
        ? bodyItems.map((item) => ({
            slug: typeof item?.slug === "string" ? item.slug.trim() : "",
            nomeProduto:
              typeof item?.nomeProduto === "string"
                ? item.nomeProduto.trim()
                : String(item?.nomeProduto ?? "").trim(),
            precoCentavos: normalizePrecoCentavos(item?.precoCentavos ?? item?.preco ?? item?.price),
            quantidade: normalizeCheckoutQuantity(item?.quantity ?? item?.quantidade),
          }))
        : [
            {
              slug: typeof body?.slug === "string" ? body.slug.trim() : "",
              nomeProduto:
                typeof (body?.nomeProduto ?? body?.productName ?? body?.nome) === "string"
                  ? (body?.nomeProduto ?? body?.productName ?? body?.nome).trim()
                  : String(body?.nomeProduto ?? body?.productName ?? body?.nome ?? "").trim(),
              precoCentavos: normalizePrecoCentavos(body?.preco ?? body?.price),
              quantidade: normalizeCheckoutQuantity(body?.quantity ?? body?.quantidade),
            },
          ];
    const customerEmail = body?.customerEmail ?? body?.email;
    const nomeCliente = body?.nomeCliente ?? body?.nome;
    const telefone = body?.telefone ?? body?.phone;
    const document = body?.document ?? body?.cpf;

    const addressRaw = body?.address && typeof body.address === "object" ? body.address : body;
    const address = {
      cep: addressRaw?.cep ?? "",
      street: addressRaw?.street ?? "",
      number: addressRaw?.number ?? "",
      complement: addressRaw?.complement ?? "",
      neighborhood: addressRaw?.neighborhood ?? "",
      city: addressRaw?.city ?? "",
      state: addressRaw?.state ?? "",
    };

    if (!items.length) {
      return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
    }

    const totalUnidades = items.reduce((acc, item) => acc + item.quantidade, 0);
    if (totalUnidades < MIN_CHECKOUT_TOTAL_ITEMS) {
      return NextResponse.json({ error: MIN_CHECKOUT_TOTAL_ITEMS_ERROR_MESSAGE }, { status: 400 });
    }

    if (items.some((item) => !item.slug)) {
      return NextResponse.json({ error: "Slug do produto obrigatorio." }, { status: 400 });
    }

    if (items.some((item) => !item.nomeProduto)) {
      return NextResponse.json({ error: "Nome do produto obrigatorio." }, { status: 400 });
    }

    if (items.some((item) => !Number.isInteger(item.precoCentavos) || item.precoCentavos <= 0)) {
      return NextResponse.json({ error: "Preco invalido." }, { status: 400 });
    }

    const baseUrl = resolvePublicBaseUrl(request);

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Defina NEXT_PUBLIC_BASE_URL ou acesse via origem valida (Origin/Host)." },
        { status: 400 },
      );
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    let checkoutUsuarioId = "";

    if (token?.userId) {
      const dbUser = await findUserById(String(token.userId));
      if (!dbUser) {
        return NextResponse.json({ error: "Sessao invalida. Entre novamente." }, { status: 401 });
      }
      if (normalizeEmail(dbUser.email) !== normalizeEmail(customerEmail)) {
        return NextResponse.json(
          { error: "O e-mail da compra deve ser o mesmo do cadastro logado." },
          { status: 400 },
        );
      }
      checkoutUsuarioId = String(dbUser.id);
    }

    const validationMessage = firstCheckoutValidationError({
      fullName: nomeCliente,
      email: customerEmail,
      document,
      phone: telefone,
      address,
    });
    if (validationMessage) {
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const documentDigits = String(document).replace(/\D/g, "").slice(0, 14);
    const endereco = buildEnderecoCompleto(address);

    const { url } = await createStripeCheckoutSession({
      items,
      customerEmail,
      nomeCliente,
      telefone,
      endereco,
      baseUrl,
      checkoutUsuarioId: checkoutUsuarioId || undefined,
      guestCheckout: !checkoutUsuarioId,
      buyer: {
        document: documentDigits,
        phone: typeof telefone === "string" ? telefone.trim() : "",
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      },
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error?.message ||
      "Erro ao criar sessao de pagamento. Verifique as chaves Stripe e tente novamente.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
