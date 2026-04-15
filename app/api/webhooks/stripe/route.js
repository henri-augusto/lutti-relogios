import { NextResponse } from "next/server";
import { persistPedidoPagoFromCheckoutSession } from "@/lib/pedidos-db";
import { constructStripeWebhookEvent } from "@/lib/stripe-webhook";

export const dynamic = "force-dynamic";

/**
 * Webhook Stripe — configure em:
 * https://dashboard.stripe.com/webhooks
 *
 * Eventos:
 * - checkout.session.completed (cartão: geralmente já payment_status = paid)
 * - checkout.session.async_payment_succeeded (PIX e outros métodos assíncronos)
 *
 * Env: STRIPE_WEBHOOK_SECRET (signing secret do endpoint)
 *
 * O corpo deve ser validado com raw body (request.text()), nunca JSON parseado antes.
 */
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    event = constructStripeWebhookEvent(rawBody, signature);
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Assinatura do webhook invalida." },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;

      const result = await persistPedidoPagoFromCheckoutSession(session);

      if (!result.ok && result.reason === "not_paid" && event.type === "checkout.session.completed") {
        // PIX/Boleto: primeiro completed pode vir unpaid; aguardamos async_payment_succeeded.
        return NextResponse.json({ received: true, skipped: result.reason });
      }

      if (!result.ok) {
        return NextResponse.json({ received: true, skipped: result.reason });
      }

      return NextResponse.json({ received: true, inserted: result.inserted });
    }

    return NextResponse.json({ received: true, ignored: event.type });
  } catch (err) {
    console.error("[stripe-webhook]", err);
    return NextResponse.json(
      { error: err?.message || "Erro ao processar webhook." },
      { status: 500 },
    );
  }
}
