import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import { AdminProductsError, listAdminProductsLocal } from "@/lib/domain/admin-products";
import { parsePageSearchParamsFromRequest } from "@/lib/api/pagination-query";

export async function GET(request) {
  const { page, pageSize, q, searchMode } = parsePageSearchParamsFromRequest(request, {
    defaultPageSize: 20,
    includeSearchMode: true,
  });

  try {
    const result = await listAdminProductsLocal({ page, pageSize, q, searchMode });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao listar produtos locais:",
      publicMessage: "Não foi possivel listar produtos.",
    });
  }
}
