import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Webhook Olist/Tiny (fase 1): ecoa o corpo exatamente como recebido, sem parse/reformatacao.
 * URL: POST /api/webhooks/olist
 *
 * Proximas fases: validar assinatura/segredo, persistir produtos, etc.
 */
export async function POST(request) {
  const rawBody = await request.text();

  console.log(JSON.parse(rawBody));
  return new NextResponse(rawBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function GET() {
  return NextResponse.json(
    {
      message: 'Use POST com o JSON enviado pela Olist/Tiny.',
      path: '/api/webhooks/olist',
    },
    { status: 405, headers: { Allow: 'POST, OPTIONS' } },
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    },
  });
}
