import { NextResponse } from "next/server";
<<<<<<< HEAD
import { OlistApiError, listOlistProducts } from "@/lib/olist-api";

export async function GET(request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Number(url.searchParams.get("pageSize") || "20");
  const q = String(url.searchParams.get("q") || "");
=======
import { handleRouteError } from "@/lib/api/api-route";
import { OlistApiError, listOlistProducts } from "@/lib/integrations/olist-api";
import { parsePageSearchParamsFromRequest } from "@/lib/api/pagination-query";

export async function GET(request) {
  const { page, pageSize, q } = parsePageSearchParamsFromRequest(request, {
    defaultPageSize: 20,
  });
>>>>>>> main

  try {
    const result = await listOlistProducts({ page, pageSize, keyword: q });
    return NextResponse.json(result);
  } catch (error) {
<<<<<<< HEAD
    if (error instanceof OlistApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao listar produtos Olist:", error);
    return NextResponse.json({ error: "Nao foi possivel listar produtos do Olist." }, { status: 500 });
=======
    return handleRouteError(error, {
      DomainErrorClass: OlistApiError,
      logLabel: "Erro ao listar produtos Olist:",
      publicMessage: "Nao foi possivel listar produtos do Olist.",
    });
>>>>>>> main
  }
}
