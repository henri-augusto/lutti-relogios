import { getProdutoBySlug } from "@/lib/produtos";
import { getStripe } from "@/lib/stripe";
import { getCheckoutPaymentMethodParams } from "@/lib/stripe-checkout-payment-methods";
import { MAX_CHECKOUT_QUANTITY } from "@/lib/checkout-quantity";

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
 * @param {string} input.slug
 * @param {string} input.nomeProduto
 * @param {number} input.precoCentavos preço unitário em centavos (BRL), deve bater com o cadastro
 * @param {number} input.quantidade
 * @param {string} [input.customerEmail]
 * @param {string} [input.nomeCliente]
 * @param {string} [input.telefone]
 * @param {string} [input.endereco]
 */
export async function createStripeCheckoutSession(input) {
  const {
    slug,
    nomeProduto,
    precoCentavos,
    quantidade,
    customerEmail,
    nomeCliente,
    telefone,
    endereco,
  } = input;

  if (typeof slug !== "string" || !slug.trim()) {
    throw new CheckoutError("Slug do produto invalido.", 400);
  }

  if (typeof nomeProduto !== "string" || !nomeProduto.trim()) {
    throw new CheckoutError("Nome do produto invalido.", 400);
  }

  if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) {
    throw new CheckoutError("Preco invalido. Use centavos (inteiro positivo).", 400);
  }

  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_CHECKOUT_QUANTITY) {
    throw new CheckoutError(`Quantidade deve ser entre 1 e ${MAX_CHECKOUT_QUANTITY}.`, 400);
  }

  const produto = await getProdutoBySlug(slug.trim());

  if (!produto) {
    throw new CheckoutError("Produto nao encontrado.", 404);
  }

  if (produto.nome.trim() !== nomeProduto.trim()) {
    throw new CheckoutError("Nome do produto nao confere com o cadastro.", 400);
  }

  if (produto.preco !== precoCentavos) {
    throw new CheckoutError("Preco nao confere com o cadastro.", 400);
  }

  const estoque = Number(produto.estoque ?? 0);
  const estoqueInt = Number.isFinite(estoque) ? Math.max(0, Math.floor(estoque)) : 0;

  if (estoqueInt < quantidade) {
    throw new CheckoutError(
      estoqueInt === 0 ? "Produto esgotado." : "Estoque insuficiente para esta quantidade.",
      400,
    );
  }

  const stripe = getStripe();

  const images =
    typeof produto.imagem_url === "string" &&
    produto.imagem_url.startsWith("https://")
      ? [produto.imagem_url]
      : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...getCheckoutPaymentMethodParams(),
    line_items: [
      {
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
      },
    ],
    success_url: `${input.baseUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.baseUrl}/cancelado`,
    ...(customerEmail && typeof customerEmail === "string" && customerEmail.includes("@")
      ? { customer_email: customerEmail.trim() }
      : {}),
    metadata: {
      produto_slug: produto.slug,
      produto_nome: produto.nome.slice(0, 500),
      quantidade: String(quantidade),
      ...(sanitizeMetadataValue(nomeCliente) ? { nome_cliente: sanitizeMetadataValue(nomeCliente) } : {}),
      ...(sanitizeMetadataValue(telefone) ? { telefone: sanitizeMetadataValue(telefone) } : {}),
      ...(sanitizeMetadataValue(endereco) ? { endereco: sanitizeMetadataValue(endereco) } : {}),
    },
  });

  if (!session.url) {
    throw new CheckoutError("Stripe nao retornou URL de checkout.", 500);
  }

  return { url: session.url };
}

export class CheckoutError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   */
  constructor(message, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}
