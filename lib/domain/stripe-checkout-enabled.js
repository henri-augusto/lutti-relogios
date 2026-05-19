/**
 * Habilita checkout online (carrinho + Stripe).
 *
 * Defina no .env.local:
 *   NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED=true
 *
 * Padrão (variável ausente ou diferente de "true"): checkout desligado — compra apenas via WhatsApp.
 */
export function isStripeCheckoutEnabled() {
  return process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED === "true";
}
