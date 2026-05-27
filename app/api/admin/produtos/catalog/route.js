import { NextResponse } from "next/server";
<<<<<<< HEAD
=======
import { handleRouteError } from "@/lib/api/api-route";
>>>>>>> main
import {
  AdminProductsError,
  getAdminCatalogOlistIds,
  replaceAdminCatalogSelection,
<<<<<<< HEAD
} from "@/lib/admin-products";
=======
} from "@/lib/domain/admin-products";
import { safeJson } from "@/lib/api/request-json";
>>>>>>> main

export async function GET() {
  try {
    const ids = await getAdminCatalogOlistIds();
    return NextResponse.json({ ids });
  } catch (error) {
<<<<<<< HEAD
    if (error instanceof AdminProductsError) {
      return NextResponse.json(
        { error: error.message },
        { status: Number.isFinite(error.status) ? error.status : 400 },
      );
    }
    console.error("Erro ao listar ids do catalogo:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar o catalogo." }, { status: 500 });
=======
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao listar ids do catalogo:",
      publicMessage: "Não foi possivel carregar o catalogo.",
    });
>>>>>>> main
  }
}

export async function PUT(request) {
  try {
<<<<<<< HEAD
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
=======
    const body = await safeJson(request);
    const ids = await replaceAdminCatalogSelection(body?.ids ?? []);
    return NextResponse.json({ ids });
  } catch (error) {
    return handleRouteError(error, {
      DomainErrorClass: AdminProductsError,
      logLabel: "Erro ao salvar catalogo:",
      publicMessage: "Não foi possivel salvar o catalogo.",
    });
>>>>>>> main
  }
}
