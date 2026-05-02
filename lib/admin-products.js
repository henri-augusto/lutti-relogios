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
    "Tabela 'produtos' nao existe no Supabase. Execute o SQL de produtos no editor SQL do projeto.",
    { status: 503 },
  );
}

function throwProdutosSchemaMismatch() {
  throw new AdminProductsError(
    "A tabela 'produtos' existe mas faltam colunas que o app usa (ex.: data_criacao, precos, seo, is_featured). No Supabase, SQL Editor: rode o arquivo `produtos-migration.sql` na raiz do repo (ou recrie com `produtos.sql`).",
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

export async function listAdminProductsLocal({ page = 1, pageSize = 20, q = "" } = {}) {
  const supabase = getSupabaseOrThrow();
  const safePage = normalizePageValue(page, 1);
  const safePageSize = Math.min(100, normalizePageValue(pageSize, 20));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const search = String(q || "").trim();

  let query = supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT, { count: "exact" })
    .eq("situacao", "A")
    .order("descricao", { ascending: true })
    .range(from, to);

  if (search) {
    query = query.ilike("descricao", `%${search}%`);
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

export async function getAdminProductById(productId) {
  const supabase = getSupabaseOrThrow();
  const safeId = String(productId || "").trim();
  if (!safeId) {
    throw new AdminProductsError("ID do produto nao informado.", { status: 400 });
  }

  const parsedId = Number(safeId);
  const lookupValue = Number.isFinite(parsedId) ? parsedId : safeId;
  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT)
    .eq("olist_id", lookupValue)
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
      const { error: upsertError } = await supabase.from(PRODUTOS_TABLE).upsert(row, { onConflict: "olist_id" });
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
