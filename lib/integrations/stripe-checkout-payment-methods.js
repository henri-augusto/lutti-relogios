/**
 * Opções de métodos de pagamento para Stripe Checkout (`checkout.sessions.create`).
 *
 * **Modo padrão (recomendado):** não envia `payment_method_types`.
 * O Stripe aplica *dynamic payment methods* — a mesma ideia de
 * `automatic_payment_methods: { enabled: true }` em PaymentIntents: os métodos
 * vêm do Dashboard e da elegibilidade (moeda, valor, país), sem lista fixa no código.
 * Assim, PIX e outros métodos aparecem quando ativos na conta e aplicáveis ao pedido.
 *
 * @see https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods
 *
 * Variáveis opcionais em `.env.local`:
 *
 * - `STRIPE_PAYMENT_METHOD_CONFIGURATION` — ID `pmc_...` de uma
 *   [Payment Method Configuration](https://docs.stripe.com/payments/payment-method-configurations)
 *   para cenários diferentes (ex.: só e-commerce).
 *
 * - `STRIPE_CHECKOUT_EXCLUDED_PAYMENT_METHOD_TYPES` — lista separada por vírgula
 *   de tipos a excluir nesta sessão (ex.: `affirm,klarna`), mesmo que estejam no Dashboard.
 *
 * - `STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES` — **só se precisar fixar manualmente**
 *   (ex.: `card,pix`). Quando definida, desativa o modo dinâmico para essa lista.
 */

export function getCheckoutPaymentMethodParams() {
  const explicitTypes = process.env.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES?.trim();
  if (explicitTypes) {
    const types = explicitTypes
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (types.length > 0) {
      return { payment_method_types: types };
    }
  }

  /** @type {{ payment_method_configuration?: string; excluded_payment_method_types?: string[] }} */
  const params = {};

  const configurationId = process.env.STRIPE_PAYMENT_METHOD_CONFIGURATION?.trim();
  if (configurationId) {
    params.payment_method_configuration = configurationId;
  }

  const excludedRaw = process.env.STRIPE_CHECKOUT_EXCLUDED_PAYMENT_METHOD_TYPES?.trim();
  if (excludedRaw) {
    const excluded = excludedRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (excluded.length > 0) {
      params.excluded_payment_method_types = excluded;
    }
  }

  return params;
}
