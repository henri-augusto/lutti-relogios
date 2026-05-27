import { NextResponse } from "next/server";
<<<<<<< HEAD
import { getOlistProductById, OlistApiError } from "@/lib/olist-api";
=======
import { handleRouteError } from "@/lib/api/api-route";
import { getOlistProductById, OlistApiError } from "@/lib/integrations/olist-api";
>>>>>>> main

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const product = await getOlistProductById(resolvedParams?.id);
    return NextResponse.json({ item: product });
  } catch (error) {
<<<<<<< HEAD
    if (error instanceof OlistApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao buscar produto Olist por ID:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar o produto." }, { status: 500 });
=======
    return handleRouteError(error, {
      DomainErrorClass: OlistApiError,
      logLabel: "Erro ao buscar produto Olist por ID:",
      publicMessage: "Nao foi possivel carregar o produto.",
    });
>>>>>>> main
  }
}
