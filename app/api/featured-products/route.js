import { NextResponse } from "next/server";
<<<<<<< HEAD
import { FeaturedProductsError, getFeaturedProducts, saveFeaturedProducts } from "@/lib/featured-products";
=======
import { handleRouteError } from "@/lib/api/api-route";
import { FeaturedProductsError, getFeaturedProducts, saveFeaturedProducts } from "@/lib/domain/featured-products";
import { safeJson } from "@/lib/api/request-json";
>>>>>>> main

export async function GET() {
  try {
    const items = await getFeaturedProducts();
    return NextResponse.json({ items });
  } catch (error) {
<<<<<<< HEAD
    if (error instanceof FeaturedProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao buscar destaques:", error);
    return NextResponse.json({ error: "Nao foi possivel buscar destaques." }, { status: 500 });
=======
    return handleRouteError(error, {
      DomainErrorClass: FeaturedProductsError,
      logLabel: "Erro ao buscar destaques:",
      publicMessage: "Nao foi possivel buscar destaques.",
    });
>>>>>>> main
  }
}

export async function PUT(request) {
  try {
<<<<<<< HEAD
    const body = await request.json().catch(() => ({}));
    const saved = await saveFeaturedProducts(body?.items ?? []);
    return NextResponse.json({ items: saved });
  } catch (error) {
    if (error instanceof FeaturedProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao salvar destaques:", error);
    return NextResponse.json({ error: "Nao foi possivel salvar destaques." }, { status: 500 });
=======
    const body = await safeJson(request);
    const saved = await saveFeaturedProducts(body?.items ?? []);
    return NextResponse.json({ items: saved });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: FeaturedProductsError,
      logLabel: "Erro ao salvar destaques:",
      publicMessage: "Nao foi possivel salvar destaques.",
    });
>>>>>>> main
  }
}
