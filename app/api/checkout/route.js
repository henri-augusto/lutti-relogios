import { NextResponse } from "next/server";
import { resolvePublicBaseUrl } from "@/lib/app-url";
import { normalizeCheckoutQuantity } from "@/lib/checkout-quantity";
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
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const nomeProdutoRaw = body?.nomeProduto ?? body?.productName ?? body?.nome;
    const nomeProduto =
      typeof nomeProdutoRaw === "string" ? nomeProdutoRaw.trim() : String(nomeProdutoRaw ?? "").trim();

    const precoCentavos = normalizePrecoCentavos(body?.preco ?? body?.price);
    const quantidade = normalizeCheckoutQuantity(body?.quantity ?? body?.quantidade);
    const customerEmail = body?.customerEmail ?? body?.email;
    const nomeCliente = body?.nomeCliente ?? body?.nome;
    const telefone = body?.telefone;
    const endereco = body?.endereco;

    if (!slug) {
      return NextResponse.json({ error: "Slug do produto obrigatorio." }, { status: 400 });
    }

    if (!nomeProduto) {
      return NextResponse.json({ error: "Nome do produto obrigatorio." }, { status: 400 });
    }

    if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) {
      return NextResponse.json({ error: "Preco invalido." }, { status: 400 });
    }

    const baseUrl = resolvePublicBaseUrl(request);

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Defina NEXT_PUBLIC_BASE_URL ou acesse via origem valida (Origin/Host)." },
        { status: 400 },
      );
    }

    const { url } = await createStripeCheckoutSession({
      slug,
      nomeProduto,
      precoCentavos,
      quantidade,
      customerEmail,
      nomeCliente,
      telefone,
      endereco,
      baseUrl,
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
