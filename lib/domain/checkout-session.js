import { MAX_CHECKOUT_QUANTITY } from "@/lib/domain/checkout-quantity";
import { createDomainErrorClass } from "@/lib/domain/domain-error";
import { getProdutoBySlug } from "@/lib/domain/produtos";
import { getStripe } from "@/lib/integrations/stripe";
import { getCheckoutPaymentMethodParams } from "@/lib/integrations/stripe-checkout-payment-methods";

export const CheckoutError = createDomainErrorClass("CheckoutError");

function sanitizeMetadataValue(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, 500);
}

/**
 * @param {object} input
 * @param {Array<{slug:string,nomeProduto:string,precoCentavos:number,quantidade:number}>} [input.items]
 * @param {string} [input.slug]
 * @param {string} [input.nomeProduto]
 * @param {number} [input.precoCentavos] preço unitário em centavos (BRL), deve bater com o cadastro
 * @param {number} [input.quantidade]
 * @param {string} [input.customerEmail]
 * @param {string} [input.nomeCliente]
 * @param {string} [input.telefone]
 * @param {string} [input.endereco]
 */
export async function createStripeCheckoutSession(input) {
  const { customerEmail, nomeCliente, telefone, endereco } = input;

  const normalizedItems = Array.isArray(input?.items) && input.items.length > 0
    ? input.items
    : [
        {
          slug: input.slug,
          nomeProduto: input.nomeProduto,
          precoCentavos: input.precoCentavos,
          quantidade: input.quantidade,
        },
      ];

  const validated = await Promise.all(
    normalizedItems.map(async (item) => {
      const slug = typeof item?.slug === "string" ? item.slug.trim() : "";
      const nomeProduto = typeof item?.nomeProduto === "string" ? item.nomeProduto.trim() : "";
      const precoCentavos = Math.round(Number(item?.precoCentavos));
      const quantidade = Math.floor(Number(item?.quantidade));

      if (!slug) {
        throw new CheckoutError("Slug do produto invalido.", { status: 400 });
      }
      if (!nomeProduto) {
        throw new CheckoutError("Nome do produto invalido.", { status: 400 });
      }
      if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) {
        throw new CheckoutError("Preco invalido. Use centavos (inteiro positivo).", { status: 400 });
      }
      if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_CHECKOUT_QUANTITY) {
        throw new CheckoutError(`Quantidade deve ser entre 1 e ${MAX_CHECKOUT_QUANTITY}.`, { status: 400 });
      }

      const produto = await getProdutoBySlug(slug);
      if (!produto) {
        throw new CheckoutError("Produto nao encontrado.", { status: 404 });
      }
      if (produto.nome.trim() !== nomeProduto) {
        throw new CheckoutError("Nome do produto nao confere com o cadastro.", { status: 400 });
      }
      if (produto.preco !== precoCentavos) {
        throw new CheckoutError("Preco nao confere com o cadastro.", { status: 400 });
      }

      const estoqueInt = Math.max(0, Math.floor(Number(produto.estoque ?? 0)));
      if (estoqueInt < quantidade) {
        throw new CheckoutError(
          estoqueInt === 0 ? "Produto esgotado." : "Estoque insuficiente para esta quantidade.",
          { status: 400 },
        );
      }
      return { produto, quantidade };
    }),
  );

  const stripe = getStripe();
  const lineItems = validated.map(({ produto, quantidade }) => {
    const images =
      typeof produto.imagem_url === "string" && produto.imagem_url.startsWith("https://")
        ? [produto.imagem_url]
        : undefined;
    return {
      quantity: quantidade,
      price_data: {
        currency: "brl",
        unit_amount: produto.preco,
        product_data: {
          name: produto.nome,
          description: produto.descricao?.slice(0, 500),
          ...(images ? { images } : {}),
        },
      },
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...getCheckoutPaymentMethodParams(),
    line_items: lineItems,
    success_url: `${input.baseUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.baseUrl}/cancelado`,
    ...(customerEmail && typeof customerEmail === "string" && customerEmail.includes("@")
      ? { customer_email: customerEmail.trim() }
      : {}),
    metadata: {
      items_count: String(validated.length),
      items_slug_csv: validated
        .map(({ produto }) => produto.slug)
        .join(",")
        .slice(0, 500),
      ...(sanitizeMetadataValue(nomeCliente) ? { nome_cliente: sanitizeMetadataValue(nomeCliente) } : {}),
      ...(sanitizeMetadataValue(telefone) ? { telefone: sanitizeMetadataValue(telefone) } : {}),
      ...(sanitizeMetadataValue(endereco) ? { endereco: sanitizeMetadataValue(endereco) } : {}),
    },
  });

  if (!session.url) {
    throw new CheckoutError("Stripe nao retornou URL de checkout.", { status: 500 });
  }

  return { url: session.url };
}

