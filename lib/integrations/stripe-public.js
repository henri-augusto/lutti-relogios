/**
 * Chave publica do Stripe para uso no FRONTEND (browser).
 *
 * Onde configurar: arquivo `.env.local` na raiz do projeto, variavel:
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
 *
 * No Next.js, apenas variaveis com prefixo NEXT_PUBLIC_ ficam disponiveis no cliente.
 * Importe esta funcao em qualquer componente "use client" quando for usar Stripe.js.
 *
 * Fluxo atual: o pagamento via redirect usa so o servidor (STRIPE_SECRET_KEY em lib/stripe.js).
 * Esta chave permanece obrigatoria no projeto (validada em lib/stripe-env.js na API).
 */

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
}
