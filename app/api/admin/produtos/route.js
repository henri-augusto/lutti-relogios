import { NextResponse } from "next/server";
<<<<<<< HEAD
import { AdminProductsError, listAdminProductsLocal } from "@/lib/admin-products";

export async function GET(request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const pageSize = Number(url.searchParams.get("pageSize") || "20");
  const q = String(url.searchParams.get("q") || "");
  const modeRaw = String(url.searchParams.get("mode") || url.searchParams.get("searchMode") || "descricao");
  const searchMode = modeRaw === "sku" ? "sku" : "descricao";
=======
import { handleRouteError } from "@/lib/api/api-route";
import { AdminProductsError, listAdminProductsLocal } from "@/lib/domain/admin-products";
import { parsePageSearchParamsFromRequest } from "@/lib/api/pagination-query";

export async function GET(request) {
  const { page, pageSize, q, searchMode } = parsePageSearchParamsFromRequest(request, {
    defaultPageSize: 20,
    includeSearchMode: true,
  });
>>>>>>> main

  try {
    const result = await listAdminProductsLocal({ page, pageSize, q, searchMode });
    return NextResponse.json(result);
  } catch (error) {
<<<<<<< HEAD
    if (error instanceof AdminProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao listar produtos locais:", error);
    return NextResponse.json({ error: "Nao foi possivel listar produtos." }, { status: 500 });
=======
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao listar produtos locais:",
      publicMessage: "Não foi possivel listar produtos.",
    });
>>>>>>> main
  }
}
