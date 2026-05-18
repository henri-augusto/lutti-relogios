import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import { FeaturedProductsError, getFeaturedProducts, saveFeaturedProducts } from "@/lib/domain/featured-products";
import { safeJson } from "@/lib/api/request-json";

export async function GET() {
  try {
    const items = await getFeaturedProducts();
    return NextResponse.json({ items });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: FeaturedProductsError,
      logLabel: "Erro ao buscar destaques:",
      publicMessage: "Nao foi possivel buscar destaques.",
    });
  }
}

export async function PUT(request) {
  try {
    const body = await safeJson(request);
    const saved = await saveFeaturedProducts(body?.items ?? []);
    return NextResponse.json({ items: saved });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: FeaturedProductsError,
      logLabel: "Erro ao salvar destaques:",
      publicMessage: "Nao foi possivel salvar destaques.",
    });
  }
}
