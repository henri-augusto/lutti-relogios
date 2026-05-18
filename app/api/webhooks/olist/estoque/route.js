import { NextResponse } from "next/server";
import { logOlistWebhookObservation, LOG_PREFIX } from "@/lib/integrations/olist-webhook-log";

export const dynamic = "force-dynamic";

const WEBHOOK_PATH = "/api/webhooks/olist/estoque";

/**
 * Webhook Olist/Tiny — movimentacoes de estoque (fase observacao).
 * URL: POST /api/webhooks/olist/estoque
 *
 * Recebe notificacoes do ERP, registra headers e corpo nos logs.
 * Proximas fases: validar assinatura, atualizar estoqueAtual no Supabase.
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();

    logOlistWebhookObservation({ request, rawBody });

    return NextResponse.json(
      { received: true, at: new Date().toISOString() },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    console.error(LOG_PREFIX, "erro ao processar webhook:", err);
    return NextResponse.json(
      { error: "Falha ao processar webhook." },
      { status: 500 },
    );
  }
}

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const webhookUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}${WEBHOOK_PATH}` : null;

  return NextResponse.json(
    {
      message: "Use POST com o JSON enviado pela Olist/Tiny (movimentacao de estoque).",
      path: WEBHOOK_PATH,
      ...(webhookUrl ? { webhookUrl } : {}),
    },
    { status: 405, headers: { Allow: "POST, OPTIONS" } },
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Cache-Control": "no-store",
    },
  });
}
