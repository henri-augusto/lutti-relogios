import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/api-route";
import { getOlistProductById, OlistApiError } from "@/lib/integrations/olist-api";

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const product = await getOlistProductById(resolvedParams?.id);
    return NextResponse.json({ item: product });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: OlistApiError,
      logLabel: "Erro ao buscar produto Olist por ID:",
      publicMessage: "Nao foi possivel carregar o produto.",
    });
  }
}
