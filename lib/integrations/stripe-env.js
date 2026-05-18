/**
 * Garante que as variaveis do Stripe estao definidas antes de chamar a API do Stripe.
 *
 * Onde preencher as chaves: `.env.local` na raiz (bloco de comentarios no inicio do arquivo).
 *
 * - STRIPE_SECRET_KEY → servidor (lib/stripe.js)
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → frontend (lib/stripe-public.js); tambem checada aqui
 */
export function assertStripeEnv() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!secret?.trim()) {
    throw new Error("STRIPE_SECRET_KEY nao configurada.");
  }

  if (!publishable?.trim()) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY nao configurada.");
  }
}
