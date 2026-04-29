import { NextResponse } from "next/server";
import { FeaturedProductsError, getFeaturedProducts, saveFeaturedProducts } from "@/lib/featured-products";

export async function GET() {
  try {
    const items = await getFeaturedProducts();
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof FeaturedProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao buscar destaques:", error);
    return NextResponse.json({ error: "Nao foi possivel buscar destaques." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
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
  }
}
