import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import { OlistApiError, listOlistProducts } from "@/lib/integrations/olist-api";
import { parsePageSearchParamsFromRequest } from "@/lib/api/pagination-query";

export async function GET(request) {
  const { page, pageSize, q } = parsePageSearchParamsFromRequest(request, {
    defaultPageSize: 20,
  });

  try {
    const result = await listOlistProducts({ page, pageSize, keyword: q });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: OlistApiError,
      logLabel: "Erro ao listar produtos Olist:",
      publicMessage: "Nao foi possivel listar produtos do Olist.",
    });
  }
}
