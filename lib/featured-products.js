import { getOlistProductById, OlistApiError } from "@/lib/olist-api";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isMissingTableError, isSchemaMismatchError } from "@/lib/supabase-errors";
import {
  PRODUTOS_CATALOG_SELECT,
  PRODUTOS_TABLE,
  mapNormalizedOlistToProdutosRow,
  mapProdutosRowToFeaturedGrid,
} from "@/lib/produtos";

export const MAX_FEATURED_PRODUCTS = 3;

export class FeaturedProductsError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "FeaturedProductsError";
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
    throw new FeaturedProductsError("Supabase admin nao configurado.", { status: 503 });
  }
  return supabase;
}

function throwProdutosTableMissing() {
  throw new FeaturedProductsError(
    "Tabela 'produto' não existe no Supabase. Execute o SQL em produtos.sql no editor SQL do projeto.",
    { status: 503 },
  );
}

function throwProdutosSchemaMismatch() {
  throw new FeaturedProductsError(
    "A tabela 'produto' existe mas faltam colunas esperadas (ex.: id, nome, preco, seo, is_featured). Rode `supabase/PRODUTO_create_table.sql` e migracoes em `supabase/migrations/`.",
    { status: 503 },
  );
}

/**
 * @param {Record<string, unknown>} row
 * @param {number} index
 */
function mapRowToFeaturedAdminShape(row, index) {
  const p = mapProdutosRowToFeaturedGrid(row);
  if (!p) {
    return null;
  }
  return {
    id: String(row.id ?? row.olist_id ?? p.id),
    descricao: p.nome,
    nome: p.nome,
    preco: p.preco,
    estoque: p.estoque,
    imagem_url: p.imagem_url,
    slug: p.slug,
    situacao: String(row.situacao || "A"),
    position: index + 1,
  };
}

export async function getFeaturedProducts() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT)
    .eq("is_featured", true)
    .order("nome", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      throwProdutosTableMissing();
    }
    if (isSchemaMismatchError(error)) {
      throwProdutosSchemaMismatch();
    }
    throw new FeaturedProductsError("Não foi possível carregar produtos em destaque.", {
      status: 500,
      cause: error,
    });
  }

  return (data ?? []).map(mapRowToFeaturedAdminShape).filter(Boolean);
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} olistId
 */
async function loadProdutoRowByOlistId(supabase, olistId) {
  const parsedId = Number(olistId);
  const lookupId = Number.isFinite(parsedId) && String(parsedId) === olistId ? parsedId : olistId;
  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select("id")
    .eq("id", lookupId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      throwProdutosTableMissing();
    }
    if (isSchemaMismatchError(error)) {
      throwProdutosSchemaMismatch();
    }
    throw new FeaturedProductsError("Nao foi possivel buscar produto local.", { status: 500, cause: error });
  }

  return data;
}

/**
 * Marca destaque usando dados ja sincronizados no Supabase; so consulta a Olist se o produto
 * ainda nao existir localmente (ex.: nunca sincronizado).
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} olistId
 */
async function ensureProdutoExistsForFeatured(supabase, olistId) {
  const existing = await loadProdutoRowByOlistId(supabase, olistId);
  if (existing) {
    return;
  }

  try {
    const fresh = await getOlistProductById(olistId);
    const row = mapNormalizedOlistToProdutosRow(fresh);
    if (!row) {
      throw new FeaturedProductsError(`Produto ${olistId} nao pode ser salvo (dados incompletos).`, {
        status: 400,
      });
    }
    const { error: upsertError } = await supabase.from(PRODUTOS_TABLE).upsert(row, { onConflict: "id" });
    if (upsertError) {
      if (isMissingTableError(upsertError)) {
        throwProdutosTableMissing();
      }
      if (isSchemaMismatchError(upsertError)) {
        throwProdutosSchemaMismatch();
      }
      throw new FeaturedProductsError("Nao foi possivel salvar produto antes de marcar destaque.", {
        status: 500,
        cause: upsertError,
      });
    }
  } catch (error) {
    if (error instanceof FeaturedProductsError) {
      throw error;
    }
    if (error instanceof OlistApiError) {
      const status =
        Number.isFinite(error.status) && error.status >= 400 && error.status < 600 ? error.status : 502;
      const hint =
        error.status === 401
          ? " Token Olist invalido ou expirado. Renove em /olist/oauth ou sincronize o produto antes de marcar destaque."
          : "";
      throw new FeaturedProductsError(
        (error.message || "Falha ao buscar produto na Olist.") + hint,
        { status, cause: error },
      );
    }
    throw error;
  }
}

export async function saveFeaturedProducts(items) {
  if (!Array.isArray(items)) {
    throw new FeaturedProductsError("Payload inválido para salvar destaque.", { status: 400 });
  }
  if (items.length > MAX_FEATURED_PRODUCTS) {
    throw new FeaturedProductsError(`Você pode selecionar no máximo ${MAX_FEATURED_PRODUCTS} produtos.`, {
      status: 400,
    });
  }

  /** @type {string[]} */
  const olistIds = [];
  for (const item of items) {
    const olistId = Number(item?.id);
    if (!Number.isFinite(olistId)) {
      throw new FeaturedProductsError("Todos os produtos precisam de id valido da Olist.", { status: 400 });
    }
    olistIds.push(String(item.id));
  }

  const supabase = getSupabaseOrThrow();

  for (const olistId of olistIds) {
    await ensureProdutoExistsForFeatured(supabase, olistId);
  }

  const { error: clearError } = await supabase.from(PRODUTOS_TABLE).update({ is_featured: false }).eq("is_featured", true);

  if (clearError) {
    if (isMissingTableError(clearError)) {
      throwProdutosTableMissing();
    }
    if (isSchemaMismatchError(clearError)) {
      throwProdutosSchemaMismatch();
    }
    throw new FeaturedProductsError("Não foi possível atualizar os destaques atuais.", {
      status: 500,
      cause: clearError,
    });
  }

  for (const olistId of olistIds) {
    const parsedId = Number(olistId);
    const lookupId = Number.isFinite(parsedId) && String(parsedId) === olistId ? parsedId : olistId;
    const { error: markError } = await supabase
      .from(PRODUTOS_TABLE)
      .update({ is_featured: true })
      .eq("id", lookupId);

    if (markError) {
      if (isMissingTableError(markError)) {
        throwProdutosTableMissing();
      }
      if (isSchemaMismatchError(markError)) {
        throwProdutosSchemaMismatch();
      }
      throw new FeaturedProductsError("Não foi possível salvar os produtos em destaque.", {
        status: 500,
        cause: markError,
      });
    }
  }

  return getFeaturedProducts();
}
