import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import { AdminPedidosError, listAdminPedidos } from "@/lib/domain/admin-pedidos";
import { parsePageSearchParamsFromRequest } from "@/lib/api/pagination-query";

export async function GET(request) {
  const { page, pageSize } = parsePageSearchParamsFromRequest(request, {
    defaultPageSize: 50,
  });

  try {
    const result = await listAdminPedidos({ page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminPedidosError,
      logLabel: "Erro ao listar pedidos:",
      publicMessage: "Nao foi possivel listar pedidos.",
    });
  }
}
