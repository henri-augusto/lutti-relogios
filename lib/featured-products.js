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

export async function saveFeaturedProducts(items) {
  if (!Array.isArray(items)) {
    throw new FeaturedProductsError("Payload inválido para salvar destaque.", { status: 400 });
  }
  if (items.length > MAX_FEATURED_PRODUCTS) {
    throw new FeaturedProductsError(`Você pode selecionar no máximo ${MAX_FEATURED_PRODUCTS} produtos.`, {
      status: 400,
    });
  }

  /** @type {Record<string, unknown>[]} */
  const rows = [];
  for (const item of items) {
    const olistId = Number(item?.id);
    if (!Number.isFinite(olistId)) {
      throw new FeaturedProductsError("Todos os produtos precisam de id valido da Olist.", { status: 400 });
    }
    try {
      const fresh = await getOlistProductById(String(item.id));
      const row = mapNormalizedOlistToProdutosRow(fresh);
      if (!row) {
        throw new FeaturedProductsError(`Produto ${item.id} nao pode ser salvo (dados incompletos).`, {
          status: 400,
        });
      }
      rows.push({ ...row, is_featured: true });
    } catch (error) {
      if (error instanceof FeaturedProductsError) {
        throw error;
      }
      if (error instanceof OlistApiError) {
        const status =
          Number.isFinite(error.status) && error.status >= 400 && error.status < 600 ? error.status : 502;
        throw new FeaturedProductsError(error.message || "Falha ao buscar produto na Olist.", {
          status,
          cause: error,
        });
      }
      throw error;
    }
  }

  const supabase = getSupabaseOrThrow();

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

  for (const row of rows) {
    const { error: upsertError } = await supabase.from(PRODUTOS_TABLE).upsert(row, { onConflict: "id" });

    if (upsertError) {
      if (isMissingTableError(upsertError)) {
        throwProdutosTableMissing();
      }
      if (isSchemaMismatchError(upsertError)) {
        throwProdutosSchemaMismatch();
      }
      throw new FeaturedProductsError("Não foi possível salvar os produtos em destaque.", {
        status: 500,
        cause: upsertError,
      });
    }
  }

  return getFeaturedProducts();
}
