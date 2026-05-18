import Stripe from "stripe";
import { assertStripeEnv } from "@/lib/integrations/stripe-env";

let stripeClient;

/**
 * Cliente Stripe para rotas de API e Server Components (somente servidor).
 *
 * Chave: STRIPE_SECRET_KEY no `.env.local` (valor sk_test_... ou sk_live_...).
 * Nunca exponha essa variavel no cliente.
 */
export function getStripe() {
  assertStripeEnv();
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}
