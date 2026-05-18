import { NextResponse } from "next/server";
import { normalizedProductsFromPayload } from "@/lib/integrations/olist-api";
import {
  mapNormalizedOlistToProdutoWebhookRow,
  persistProdutoWebhookRows,
} from "@/lib/integrations/olist-webhook-produto";
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";

export const dynamic = "force-dynamic";

/** Tabela `public.produto` no Supabase (webhook). */
const PRODUTO_TABLE = "produto";

/**
 * Webhook Olist/Tiny: persiste produto(s) na tabela `produto` e devolve o corpo bruto como recebido.
 * URL: POST /api/webhooks/olist
 */
export async function POST(request) {
  const rawBody = await request.text();

  let parsed;
  try {
    parsed = rawBody.trim() ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json(
      { erro: "JSON invalido no corpo da requisicao." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        erro:
          "Supabase admin nao configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY).",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const normalizedItems = normalizedProductsFromPayload(parsed);
  const rows = normalizedItems
    .map((item) => mapNormalizedOlistToProdutoWebhookRow(item))
    .filter(Boolean);

  if (normalizedItems.length === 0) {
    console.warn(
      "[webhook olist] JSON valido mas nenhum produto extraido — envelope tipico: { dados: { id, nome, ... } } ou objeto com id + nome/descricao.",
    );
  } else if (rows.length === 0) {
    console.warn(
      "[webhook olist] Produtos normalizados mas nenhuma linha para Supabase (falta id ou descricao/nome mapeavel).",
    );
  }

  if (rows.length > 0) {
    const { error } = await persistProdutoWebhookRows(supabase, PRODUTO_TABLE, rows);
    if (error) {
      console.error("[webhook olist] Supabase:", error);
      return NextResponse.json(
        { erro: "Falha ao persistir produto no Supabase.", detalhe: error.message },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const responseHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Olist-Webhook-Normalizados": String(normalizedItems.length),
    "X-Olist-Webhook-Gravados": String(rows.length),
  };

  return new NextResponse(rawBody, {
    status: 200,
    headers: responseHeaders,
  });
}

export function GET() {
  return NextResponse.json(
    {
      message: "Use POST com o JSON enviado pela Olist/Tiny.",
      path: "/api/webhooks/olist",
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
