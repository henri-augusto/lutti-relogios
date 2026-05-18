import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import {
  AdminProductsError,
  deleteAdminProduct,
  getAdminProductModalDetails,
} from "@/lib/domain/admin-products";

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const item = await getAdminProductModalDetails(resolvedParams?.id);
    return NextResponse.json({ item });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao buscar detalhes do produto:",
      publicMessage: "Não foi possível carregar o produto.",
    });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const resolvedParams = await params;
    const result = await deleteAdminProduct(resolvedParams?.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao excluir produto:",
      publicMessage: "Não foi possível excluir o produto.",
    });
  }
}
