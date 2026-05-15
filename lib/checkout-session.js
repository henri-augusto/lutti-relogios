import { normalizeCep } from "@/lib/auth-users";
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
 * @param {Array<{slug:string,nomeProduto:string,precoCentavos:number,quantidade:number}>} [input.items]
 * @param {string} [input.slug]
 * @param {string} [input.nomeProduto]
 * @param {number} [input.precoCentavos] preço unitário em centavos (BRL), deve bater com o cadastro
 * @param {number} [input.quantidade]
 * @param {string} [input.customerEmail]
 * @param {string} [input.nomeCliente]
 * @param {string} [input.telefone]
 * @param {string} [input.endereco]
 * @param {string} [input.checkoutUsuarioId] id em usuarios quando checkout autenticado
 * @param {boolean} [input.guestCheckout] true se nao houver usuario logado no servidor
 * @param {object} [input.buyer] dados validados para metadata (CPF, endereco, etc.)
 * @param {string} [input.buyer.document] CPF (somente digitos apos validacao)
 * @param {string} [input.buyer.phone]
 * @param {string} [input.buyer.cep]
 * @param {string} [input.buyer.street]
 * @param {string} [input.buyer.number]
 * @param {string} [input.buyer.complement]
 * @param {string} [input.buyer.neighborhood]
 * @param {string} [input.buyer.city]
 * @param {string} [input.buyer.state] UF
 */
export async function createStripeCheckoutSession(input) {
  const { customerEmail, nomeCliente, telefone, endereco } = input;
  const guestCheckout = Boolean(input.guestCheckout);
  const checkoutUsuarioId =
    typeof input.checkoutUsuarioId === "string" && input.checkoutUsuarioId.trim()
      ? input.checkoutUsuarioId.trim().slice(0, 200)
      : "";
  const buyer = input.buyer && typeof input.buyer === "object" ? input.buyer : null;

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
        throw new CheckoutError("Slug do produto invalido.", 400);
      }
      if (!nomeProduto) {
        throw new CheckoutError("Nome do produto invalido.", 400);
      }
      if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) {
        throw new CheckoutError("Preco invalido. Use centavos (inteiro positivo).", 400);
      }
      if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > MAX_CHECKOUT_QUANTITY) {
        throw new CheckoutError(`Quantidade deve ser entre 1 e ${MAX_CHECKOUT_QUANTITY}.`, 400);
      }

      const produto = await getProdutoBySlug(slug);
      if (!produto) {
        throw new CheckoutError("Produto nao encontrado.", 404);
      }
      if (produto.nome.trim() !== nomeProduto) {
        throw new CheckoutError("Nome do produto nao confere com o cadastro.", 400);
      }
      if (produto.preco !== precoCentavos) {
        throw new CheckoutError("Preco nao confere com o cadastro.", 400);
      }

      const estoqueInt = Math.max(0, Math.floor(Number(produto.estoque ?? 0)));
      if (estoqueInt < quantidade) {
        throw new CheckoutError(
          estoqueInt === 0 ? "Produto esgotado." : "Estoque insuficiente para esta quantidade.",
          400,
        );
      }
      return { produto, quantidade };
    }),
  );

  const stripe = getStripe();
  const multi = validated.length > 1;
  const first = validated[0];
  const produtoNomeMeta = multi
    ? validated
        .map(({ produto, quantidade: q }) => `${produto.nome} x${q}`)
        .join(" | ")
        .slice(0, 500)
    : first.produto.nome.slice(0, 500);
  const quantidadeMeta = multi
    ? String(validated.reduce((acc, { quantidade: q }) => acc + q, 0))
    : String(first.quantidade);
  const produtoSlugMeta = first.produto.slug.trim().slice(0, 500);

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
      multi_cart: multi ? "1" : "0",
      produto_slug: produtoSlugMeta,
      produto_nome: produtoNomeMeta,
      quantidade: quantidadeMeta,
      guest_checkout: guestCheckout ? "1" : "0",
      ...(checkoutUsuarioId ? { checkout_usuario_id: checkoutUsuarioId } : {}),
      ...(sanitizeMetadataValue(nomeCliente) ? { nome_cliente: sanitizeMetadataValue(nomeCliente) } : {}),
      ...(sanitizeMetadataValue(telefone) ? { telefone: sanitizeMetadataValue(telefone) } : {}),
      ...(sanitizeMetadataValue(endereco) ? { endereco: sanitizeMetadataValue(endereco) } : {}),
      ...(buyer?.document
        ? { doc: String(buyer.document).replace(/\D/g, "").slice(0, 14) }
        : {}),
      ...(buyer?.cep ? { cep: normalizeCep(buyer.cep) } : {}),
      ...(sanitizeMetadataValue(buyer?.street) ? { street: sanitizeMetadataValue(buyer.street) } : {}),
      ...(sanitizeMetadataValue(buyer?.number) ? { number: sanitizeMetadataValue(buyer.number) } : {}),
      ...(sanitizeMetadataValue(buyer?.complement) ? { complement: sanitizeMetadataValue(buyer.complement) } : {}),
      ...(sanitizeMetadataValue(buyer?.neighborhood)
        ? { neighborhood: sanitizeMetadataValue(buyer.neighborhood) }
        : {}),
      ...(sanitizeMetadataValue(buyer?.city) ? { city: sanitizeMetadataValue(buyer.city) } : {}),
      ...(sanitizeMetadataValue(buyer?.state)
        ? { state: sanitizeMetadataValue(buyer.state).toUpperCase().slice(0, 2) }
        : {}),
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
