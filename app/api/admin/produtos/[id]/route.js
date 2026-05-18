import { NextResponse } from "next/server";
import {
  AdminProductsError,
  deleteAdminProduct,
  getAdminProductModalDetails,
} from "@/lib/admin-products";

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const item = await getAdminProductModalDetails(resolvedParams?.id);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof AdminProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao buscar detalhes do produto:", error);
    return NextResponse.json({ error: "Não foi possível carregar o produto." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const resolvedParams = await params;
    const result = await deleteAdminProduct(resolvedParams?.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AdminProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json({ error: "Não foi possível excluir o produto." }, { status: 500 });
  }
}
