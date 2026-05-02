import { NextResponse } from "next/server";
import {
  AdminProductsError,
  getAdminCatalogOlistIds,
  replaceAdminCatalogSelection,
} from "@/lib/admin-products";

export async function GET() {
  try {
    const ids = await getAdminCatalogOlistIds();
    return NextResponse.json({ ids });
  } catch (error) {
    if (error instanceof AdminProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao listar ids do catalogo:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar o catalogo." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const ids = await replaceAdminCatalogSelection(body?.ids ?? []);
    return NextResponse.json({ ids });
  } catch (error) {
    if (error instanceof AdminProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao salvar catalogo:", error);
    return NextResponse.json({ error: "Nao foi possivel salvar o catalogo." }, { status: 500 });
  }
}
