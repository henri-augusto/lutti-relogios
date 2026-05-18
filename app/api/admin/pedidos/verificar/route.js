import { NextResponse } from "next/server";
import { AdminPedidosError, verificarPedidosStripe } from "@/lib/admin-pedidos";

export async function POST(request) {
  let days = 30;
  let limit = 100;

  try {
    const body = await request.json();
    if (body && typeof body === "object") {
      if (body.days !== undefined) {
        days = Number(body.days);
      }
      if (body.limit !== undefined) {
        limit = Number(body.limit);
      }
    }
  } catch {
    // corpo vazio — usa defaults
  }

  try {
    const summary = await verificarPedidosStripe({ days, limit });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    if (error instanceof AdminPedidosError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao verificar pedidos no Stripe:", error);
    return NextResponse.json({ error: "Nao foi possivel verificar pedidos." }, { status: 500 });
  }
}
