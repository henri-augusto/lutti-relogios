/** Quantidade maxima por sessao de checkout (Stripe line item). */
export const MAX_CHECKOUT_QUANTITY = 99;

/** Quantidade minima total de unidades no carrinho (soma de todas as linhas) para iniciar checkout. */
export const MIN_CHECKOUT_TOTAL_ITEMS = 6;

export const MIN_CHECKOUT_TOTAL_ITEMS_ERROR_MESSAGE =
  "Pedido mínimo de 6 itens para concluir a compra.";

/**
 * Normaliza quantidade para inteiro entre 1 e MAX_CHECKOUT_QUANTITY.
 * Aceita `quantity`, strings numericas, NaN/invalido → 1.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeCheckoutQuantity(value) {
  if (value === undefined || value === null || value === "") {
    return 1;
  }

  const n = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(n)) {
    return 1;
  }

  const int = Math.floor(Math.abs(n));
  if (int < 1) {
    return 1;
  }
  if (int > MAX_CHECKOUT_QUANTITY) {
    return MAX_CHECKOUT_QUANTITY;
  }
  return int;
}
