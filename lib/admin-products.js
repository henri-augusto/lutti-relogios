import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isMissingTableError, isSchemaMismatchError } from "@/lib/supabase-errors";
import { OlistApiError, getOlistProductById } from "@/lib/olist-api";
import {
  PRODUTOS_CATALOG_SELECT,
  PRODUTOS_TABLE,
  buildCatalogSlug,
  mapNormalizedOlistToProdutosRow,
  mapProdutosRowToAdminList,
} from "@/lib/produtos";

export class AdminProductsError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "AdminProductsError";
    if (opts.status !== undefined) {
      this.status = opts.status;
    }
    if (opts.cause !== undefined) {
      this.cause = opts.cause;
    }
  }
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new AdminProductsError("Supabase admin nao configurado.", { status: 503 });
  }
  return supabase;
}

function throwProdutosTableMissing() {
  throw new AdminProductsError(
    "Tabela 'produto' nao existe no Supabase. Execute o SQL de produtos no editor SQL do projeto.",
    { status: 503 },
  );
}

function throwProdutosSchemaMismatch() {
  throw new AdminProductsError(
    "A tabela 'produto' existe mas faltam colunas que o app usa (ex.: id, nome, preco, seo, in_catalog, is_featured). Rode `supabase/PRODUTO_create_table.sql` e a migracao `20260514203000_produto_in_catalog_featured.sql` no SQL Editor.",
    { status: 503 },
  );
}

function mapRowToAdminItem(row) {
  return mapProdutosRowToAdminList(row);
}

function normalizePageValue(value, fallback) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
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
    if (isMissingTableError(error)) {
      throwProdutosTableMissing();
    }
    if (isSchemaMismatchError(error)) {
      throwProdutosSchemaMismatch();
    }
    throw new AdminProductsError("Nao foi possivel listar produtos locais.", { status: 500, cause: error });
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
    if (isMissingTableError(error)) {
      throwProdutosTableMissing();
    }
    if (isSchemaMismatchError(error)) {
      throwProdutosSchemaMismatch();
    }
    throw new AdminProductsError("Nao foi possivel carregar selecao do catalogo.", { status: 500, cause: error });
  }

  const ids = (data ?? [])
    .map((row) => (row?.id != null ? String(row.id) : ""))
    .filter(Boolean);
  return ids;
}

/**
 * Define quais produtos aparecem no catalogo publico: todos com `in_catalog = false`,
 * depois `true` apenas para os `olist_id` informados.
 * @param {unknown} idsInput
 */
export async function replaceAdminCatalogSelection(idsInput) {
  if (!Array.isArray(idsInput)) {
    throw new AdminProductsError("Envie um array 'ids' com os olist_id do catalogo.", { status: 400 });
  }

  const unique = [...new Set(idsInput.map((id) => String(id ?? "").trim()).filter(Boolean))];
  const numericIds = unique.map((s) => Number(s)).filter((n) => Number.isFinite(n));

  const supabase = getSupabaseOrThrow();

  const { error: clearError } = await supabase
    .from(PRODUTOS_TABLE)
    .update({ in_catalog: false })
    .not("id", "is", null);

  if (clearError) {
    if (isMissingTableError(clearError)) {
      throwProdutosTableMissing();
    }
    if (isSchemaMismatchError(clearError)) {
      throwProdutosSchemaMismatch();
    }
    throw new AdminProductsError("Nao foi possivel atualizar o catalogo.", { status: 500, cause: clearError });
  }

  if (numericIds.length === 0) {
    return [];
  }

  for (const olistId of numericIds) {
    try {
      const fresh = await getOlistProductById(String(olistId));
      const row = buildUpsertRowFromOlist(fresh);
      if (!row) {
        throw new AdminProductsError(`Produto ${olistId} nao pode ser salvo (dados incompletos).`, {
          status: 400,
        });
      }
      const { error: upsertError } = await supabase
        .from(PRODUTOS_TABLE)
        .upsert({ ...row, in_catalog: true }, { onConflict: "id" });

      if (upsertError) {
        if (isMissingTableError(upsertError)) {
          throwProdutosTableMissing();
        }
        if (isSchemaMismatchError(upsertError)) {
          throwProdutosSchemaMismatch();
        }
        throw new AdminProductsError("Nao foi possivel salvar produto do catalogo no Supabase.", {
          status: 500,
          cause: upsertError,
        });
      }
    } catch (error) {
      if (error instanceof AdminProductsError) {
        throw error;
      }
      if (error instanceof OlistApiError) {
        const status =
          Number.isFinite(error.status) && error.status >= 400 && error.status < 600 ? error.status : 502;
        throw new AdminProductsError(error.message || "Falha ao buscar produto na Olist.", {
          status,
          cause: error,
        });
      }
      throw error;
    }
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
    if (isMissingTableError(error)) {
      throwProdutosTableMissing();
    }
    if (isSchemaMismatchError(error)) {
      throwProdutosSchemaMismatch();
    }
    throw new AdminProductsError("Nao foi possivel buscar produto local.", { status: 500, cause: error });
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
    throw new AdminProductsError("Nao foi possivel carregar detalhes do produto.", { status: 500, cause: error });
  }
}
