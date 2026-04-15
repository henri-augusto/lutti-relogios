/** Quantidade maxima por sessao de checkout (Stripe line item). */
export const MAX_CHECKOUT_QUANTITY = 99;

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
