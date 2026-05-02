import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isMissingTableError, isSchemaMismatchError } from "@/lib/supabase-errors";
import {
  PRODUTOS_CATALOG_SELECT,
  PRODUTOS_TABLE,
  buildProdutoUpsertFromHighlightItem,
  mapProdutosRowToCatalog,
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
    "Tabela 'produtos' não existe no Supabase. Execute o SQL em produtos.sql no editor SQL do projeto.",
    { status: 503 },
  );
}

function throwProdutosSchemaMismatch() {
  throw new FeaturedProductsError(
    "A tabela 'produtos' existe mas falta colunas esperadas (ex.: olist_id, precos). Rode `produtos.sql` no SQL Editor do projeto Supabase usado no .env.local.",
    { status: 503 },
  );
}

/**
 * @param {Record<string, unknown>} row
 * @param {number} index
 */
function mapRowToFeaturedAdminShape(row, index) {
  const p = mapProdutosRowToCatalog(row);
  if (!p) {
    return null;
  }
  return {
    id: String(row.olist_id ?? p.id),
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
    .order("descricao", { ascending: true });

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

  const rows = items.map(buildProdutoUpsertFromHighlightItem).filter(Boolean);
  if (rows.length !== items.length) {
    throw new FeaturedProductsError("Todos os produtos precisam de id e descrição.", { status: 400 });
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
    const { data: existing, error: selError } = await supabase
      .from(PRODUTOS_TABLE)
      .select("olist_id")
      .eq("olist_id", row.olist_id)
      .maybeSingle();

    if (selError) {
      if (isMissingTableError(selError)) {
        throwProdutosTableMissing();
      }
      if (isSchemaMismatchError(selError)) {
        throwProdutosSchemaMismatch();
      }
      throw new FeaturedProductsError("Não foi possível verificar produto no destaque.", {
        status: 500,
        cause: selError,
      });
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from(PRODUTOS_TABLE)
        .update({
          descricao: row.descricao,
          situacao: row.situacao,
          precos: row.precos,
          estoque: row.estoque,
          anexos: row.anexos,
          seo: row.seo,
          is_featured: true,
        })
        .eq("olist_id", row.olist_id);

      if (updateError) {
        if (isMissingTableError(updateError)) {
          throwProdutosTableMissing();
        }
        if (isSchemaMismatchError(updateError)) {
          throwProdutosSchemaMismatch();
        }
        throw new FeaturedProductsError("Não foi possível salvar os produtos em destaque.", {
          status: 500,
          cause: updateError,
        });
      }
    } else {
      const { error: insertError } = await supabase.from(PRODUTOS_TABLE).insert(row);
      if (insertError) {
        if (isMissingTableError(insertError)) {
          throwProdutosTableMissing();
        }
        if (isSchemaMismatchError(insertError)) {
          throwProdutosSchemaMismatch();
        }
        throw new FeaturedProductsError("Não foi possível salvar os produtos em destaque.", {
          status: 500,
          cause: insertError,
        });
      }
    }
  }

  return getFeaturedProducts();
}
