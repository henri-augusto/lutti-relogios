import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import { AdminPedidosError, verificarPedidosStripe } from "@/lib/domain/admin-pedidos";
import { safeJson } from "@/lib/api/request-json";

export async function POST(request) {
  let days = 30;
  let limit = 100;

  const body = await safeJson(request);
  if (body && typeof body === "object") {
    if (body.days !== undefined) {
      days = Number(body.days);
    }
    if (body.limit !== undefined) {
      limit = Number(body.limit);
    }
  }

  try {
    const summary = await verificarPedidosStripe({ days, limit });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminPedidosError,
      logLabel: "Erro ao verificar pedidos no Stripe:",
      publicMessage: "Nao foi possivel verificar pedidos.",
    });
  }
}
