import { NextResponse } from "next/server";
<<<<<<< HEAD
import { getOlistProductById, OlistApiError } from "@/lib/olist-api";

/** Monta o payload do modal a partir do produto normalizado (GET /produtos/{id}). */
function buildOlistModalItem(normalized) {
  if (!normalized) {
    return null;
  }

  const raw =
    normalized.raw && typeof normalized.raw === "object"
      ? /** @type {Record<string, unknown>} */ (normalized.raw)
      : {};
  const nested =
    raw.produto && typeof raw.produto === "object"
      ? /** @type {Record<string, unknown>} */ (raw.produto)
      : {};
  const src = { ...raw, ...nested };

  const fornecedores = Array.isArray(src.fornecedores) ? src.fornecedores : [];
  const fornecedorNomes = fornecedores
    .map((f) =>
      f && typeof f === "object" && f.nome != null
        ? String(/** @type {{ nome?: unknown }} */ (f).nome).trim()
        : "",
    )
    .filter(Boolean);

  return {
    foto: normalized.imagem_url || "",
    id: normalized.id,
    sku: normalized.sku || "",
    preco: normalized.preco,
    estoque: normalized.estoque,
    descricaoComplementar: String(src.descricaoComplementar ?? "").trim(),
    fornecedorNome: fornecedorNomes.length > 0 ? fornecedorNomes.join(", ") : "",
  };
}
=======
import { handleRouteError } from "@/lib/api/api-route";
import {
  AdminProductsError,
  deleteAdminProduct,
  getAdminProductModalDetails,
} from "@/lib/domain/admin-products";
>>>>>>> main

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
<<<<<<< HEAD
    const normalized = await getOlistProductById(resolvedParams?.id);
    const item = buildOlistModalItem(normalized);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof OlistApiError) {
      const status =
        Number.isFinite(error.status) && error.status >= 400 && error.status < 600 ? error.status : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("Erro ao buscar produto na Olist:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar o produto na Olist." }, { status: 500 });
=======
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
>>>>>>> main
  }
}
