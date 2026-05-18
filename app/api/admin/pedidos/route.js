import { NextResponse } from "next/server";
import { AdminPedidosError, listAdminPedidos } from "@/lib/admin-pedidos";

export async function GET(request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Number(url.searchParams.get("pageSize") || "50");

  try {
    const result = await listAdminPedidos({ page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminPedidosError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao listar pedidos:", error);
    return NextResponse.json({ error: "Nao foi possivel listar pedidos." }, { status: 500 });
  }
}
