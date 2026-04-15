import Stripe from "stripe";

/**
 * Valida assinatura do webhook Stripe.
 * Requer STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET (sem exigir publishable key).
 */
export function constructStripeWebhookEvent(rawBody, signatureHeader) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY nao configurada.");
  }
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET nao configurada.");
  }
  if (!signatureHeader) {
    throw new Error("Cabecalho stripe-signature ausente.");
  }

  const stripe = new Stripe(secretKey);
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
}
