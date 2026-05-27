import { createDomainErrorClass } from "@/lib/domain/domain-error";
import { OlistApiError, getOlistProductById } from "@/lib/integrations/olist-api";
import { normalizePageValue } from "@/lib/api/pagination-query";
import { resolveProductLookupId } from "@/lib/domain/produto-lookup";
import {
  PRODUTOS_CATALOG_SELECT,
  PRODUTOS_TABLE,
  buildCatalogSlug,
  mapNormalizedOlistToProdutosRow,
  mapProdutosRowToAdminList,
} from "@/lib/domain/produtos";
import { isMissingTableError, isSchemaMismatchError } from "@/lib/integrations/supabase-errors";
import { createSupabaseDomainAccess } from "@/lib/integrations/supabase-domain-access";

export const AdminProductsError = createDomainErrorClass("AdminProductsError");

const {
  getSupabaseOrThrow,
  rethrowSupabaseError: rethrowProdutosError,
} = createSupabaseDomainAccess(AdminProductsError, {
  tableMissing:
    "Tabela 'produto' nao existe no Supabase. Execute o SQL de produtos no editor SQL do projeto.",
  schemaMismatch:
    "A tabela 'produto' existe mas faltam colunas que o app usa (ex.: id, nome, preco, seo, in_catalog, is_featured). Rode `supabase/PRODUTO_create_table.sql` e a migracao `20260514203000_produto_in_catalog_featured.sql` no SQL Editor.",
});

function mapRowToAdminItem(row) {
  return mapProdutosRowToAdminList(row);
}

/** @param {Record<string, unknown>} row */
function buildAdminModalItemFromRow(row) {
  const list = mapRowToAdminItem(row);
  if (!list) {
    return null;
  }

  let fornecedorNome = "";
  const marca = row.marca;
  if (typeof marca === "string" && marca.trim()) {
    fornecedorNome = marca.trim();
  } else if (marca && typeof marca === "object" && marca.nome != null) {
    fornecedorNome = String(/** @type {{ nome?: unknown }} */ (marca).nome).trim();
  } else if (row.idFornecedor != null && String(row.idFornecedor).trim()) {
    fornecedorNome = `ID ${String(row.idFornecedor).trim()}`;
  }

  return {
    foto: list.imagem_url || "",
    id: list.id,
    sku: list.sku,
    preco: list.preco,
    estoque: list.estoque,
    descricaoComplementar: String(row.descricaoComplementar ?? "").trim(),
    fornecedorNome,
  };
}

function buildUpsertRowFromOlist(item) {
  return mapNormalizedOlistToProdutosRow(item);
}

/** @typedef {"descricao" | "sku"} AdminProductSearchMode */

export async function listAdminProductsLocal({
  page = 1,
  pageSize = 20,
  q = "",
  searchMode = "descricao",
} = {}) {
  const supabase = getSupabaseOrThrow();
  const safePage = normalizePageValue(page, 1);
  const safePageSize = Math.min(100, normalizePageValue(pageSize, 20));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const search = String(q || "").trim();
  const mode = searchMode === "sku" ? "sku" : "descricao";

  let query = supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT, { count: "exact" })
    .or("situacao.eq.A,situacao.eq.Ativo,situacao.eq.a,situacao.is.null")
    .order("is_featured", { ascending: false, nullsFirst: false })
    .order("nome", { ascending: true })
    .range(from, to);

  if (search) {
    query =
      mode === "sku"
        ? query.or(`codigo.ilike.%${search}%,skuMapeamento.ilike.%${search}%`)
        : query.ilike("nome", `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    rethrowProdutosError(error, "Nao foi possivel listar produtos locais.");
  }

  const items = (data ?? []).map(mapRowToAdminItem).filter(Boolean);
  const total = Number.isFinite(count) ? count : 0;
  const hasNext = safePage * safePageSize < total;

  return {
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    hasNext,
  };
}

export async function getAdminCatalogOlistIds() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.from(PRODUTOS_TABLE).select("id").eq("in_catalog", true);

  if (error) {
    rethrowProdutosError(error, "Nao foi possivel carregar selecao do catalogo.");
  }

  const ids = (data ?? [])
    .map((row) => (row?.id != null ? String(row.id) : ""))
    .filter(Boolean);
  return ids;
}

/**
 * Define quais produtos aparecem no catalogo publico: todos com `in_catalog = false`,
 * depois `true` apenas para os IDs informados (produtos ja sincronizados via webhook).
 * @param {unknown} idsInput
 */
export async function replaceAdminCatalogSelection(idsInput) {
  if (!Array.isArray(idsInput)) {
    throw new AdminProductsError("Envie um array 'ids' com os olist_id do catalogo.", { status: 400 });
  }

  const unique = [...new Set(idsInput.map((id) => String(id ?? "").trim()).filter(Boolean))];
  const numericIds = unique.map((s) => Number(s)).filter((n) => Number.isFinite(n));

  const supabase = getSupabaseOrThrow();

  if (numericIds.length === 0) {
    const { error: clearError } = await supabase
      .from(PRODUTOS_TABLE)
      .update({ in_catalog: false })
      .not("id", "is", null);

    if (clearError) {
      rethrowProdutosError(clearError, "Nao foi possivel atualizar o catalogo.");
    }

    return [];
  }

  const { data: existingRows, error: fetchError } = await supabase
    .from(PRODUTOS_TABLE)
    .select("id")
    .in("id", numericIds);

  if (fetchError) {
    rethrowProdutosError(fetchError, "Nao foi possivel verificar produtos do catalogo.");
  }

  const existingIdSet = new Set((existingRows ?? []).map((row) => String(row.id)));
  const missingIds = numericIds.filter((id) => !existingIdSet.has(String(id)));

  if (missingIds.length > 0) {
    const label = missingIds.length === 1 ? `Produto ${missingIds[0]}` : `Produtos ${missingIds.join(", ")}`;
    throw new AdminProductsError(
      `${label} nao encontrado(s) no banco local. Aguarde a sincronizacao via webhook da Olist antes de incluir no catalogo.`,
      { status: 404 },
    );
  }

  const { error: clearError } = await supabase
    .from(PRODUTOS_TABLE)
    .update({ in_catalog: false })
    .not("id", "is", null);

  if (clearError) {
    rethrowProdutosError(clearError, "Nao foi possivel atualizar o catalogo.");
  }

  const { error: markError } = await supabase
    .from(PRODUTOS_TABLE)
    .update({ in_catalog: true })
    .in("id", numericIds);

  if (markError) {
    rethrowProdutosError(markError, "Nao foi possivel salvar produto do catalogo no Supabase.");
  }

  return getAdminCatalogOlistIds();
}

export async function getAdminProductById(productId) {
  const supabase = getSupabaseOrThrow();
  const safeId = String(productId || "").trim();
  if (!safeId) {
    throw new AdminProductsError("ID do produto nao informado.", { status: 400 });
  }

  const parsedId = Number(safeId);
  const lookupId = Number.isFinite(parsedId) && String(parsedId) === safeId ? String(parsedId) : safeId;
  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT)
    .eq("id", lookupId)
    .maybeSingle();

  if (error) {
    rethrowProdutosError(error, "Nao foi possivel buscar produto local.");
  }

  if (data) {
    const item = mapRowToAdminItem(data);
    if (item) {
      return item;
    }
  }

  try {
    const fresh = await getOlistProductById(safeId);
    const row = buildUpsertRowFromOlist(fresh);
    if (row) {
      const { error: upsertError } = await supabase.from(PRODUTOS_TABLE).upsert(row, { onConflict: "id" });
      if (upsertError && !isMissingTableError(upsertError) && !isSchemaMismatchError(upsertError)) {
        console.error("Falha ao salvar produto local apos fallback Olist:", upsertError);
      }
    }

    return {
      id: String(fresh.id),
      sku: fresh.sku || "",
      descricao: fresh.descricao,
      situacao: fresh.situacao || "A",
      preco: fresh.preco,
      estoque: fresh.estoque,
      imagem_url: fresh.imagem_url || "",
      slug: buildCatalogSlug(fresh.descricao, fresh.id),
    };
  } catch (error) {
    if (error instanceof OlistApiError) {
      throw new AdminProductsError(error.message, { status: error.status || 404, cause: error });
    }
    throw new AdminProductsError("Não foi possível carregar detalhes do produto.", {
      status: 500,
      cause: error,
    });
  }
}

/** Detalhes do modal admin — somente Supabase (evita 401 da API Olist). */
export async function getAdminProductModalDetails(productId) {
  const supabase = getSupabaseOrThrow();
  const lookupId = resolveProductLookupId(productId);
  if (lookupId == null) {
    throw new AdminProductsError("ID do produto não informado.", { status: 400 });
  }

  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select(`${PRODUTOS_CATALOG_SELECT}, idFornecedor, codigoFornecedor`)
    .eq("id", lookupId)
    .maybeSingle();

  if (error) {
    rethrowProdutosError(error, "Não foi possível buscar produto.");
  }

  if (!data) {
    throw new AdminProductsError(
      "Produto não encontrado no banco local. Sincronize com a Olist antes de abrir os detalhes.",
      { status: 404 },
    );
  }

  const item = buildAdminModalItemFromRow(data);
  if (!item) {
    throw new AdminProductsError("Dados do produto incompletos no banco local.", { status: 422 });
  }

  return item;
}

const FAVORITES_TABLE = "favoritos";

/** Remove produto do Supabase (e favoritos vinculados). Nao exclui na Olist. */
export async function deleteAdminProduct(productId) {
  const supabase = getSupabaseOrThrow();
  const safeId = String(productId || "").trim();
  const lookupId = resolveProductLookupId(productId);
  if (lookupId == null) {
    throw new AdminProductsError("ID do produto não informado.", { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from(PRODUTOS_TABLE)
    .select("id")
    .eq("id", lookupId)
    .maybeSingle();

  if (fetchError) {
    rethrowProdutosError(fetchError, "Não foi possível verificar o produto.");
  }

  if (!existing) {
    throw new AdminProductsError("Produto não encontrado.", { status: 404 });
  }

  const { error: favError } = await supabase.from(FAVORITES_TABLE).delete().eq("product_id", lookupId);
  if (favError && !isMissingTableError(favError)) {
    console.error("Falha ao remover favoritos do produto:", favError);
  }

  const { error: deleteError } = await supabase.from(PRODUTOS_TABLE).delete().eq("id", lookupId);
  if (deleteError) {
    rethrowProdutosError(deleteError, "Não foi possível excluir o produto.");
  }

  return { id: safeId };
}
