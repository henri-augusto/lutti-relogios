import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import {
  AdminProductsError,
  getAdminCatalogOlistIds,
  replaceAdminCatalogSelection,
} from "@/lib/domain/admin-products";
import { safeJson } from "@/lib/api/request-json";

export async function GET() {
  try {
    const ids = await getAdminCatalogOlistIds();
    return NextResponse.json({ ids });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao listar ids do catalogo:",
      publicMessage: "Não foi possivel carregar o catalogo.",
    });
  }
}

export async function PUT(request) {
  try {
    const body = await safeJson(request);
    const ids = await replaceAdminCatalogSelection(body?.ids ?? []);
    return NextResponse.json({ ids });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao salvar catalogo:",
      publicMessage: "Não foi possivel salvar o catalogo.",
    });
  }
}
