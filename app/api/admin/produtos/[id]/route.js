import { NextResponse } from "next/server";
import { AdminProductsError, getAdminProductById } from "@/lib/admin-products";

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const item = await getAdminProductById(resolvedParams?.id);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof AdminProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao buscar produto local por ID:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar o produto." }, { status: 500 });
  }
}
