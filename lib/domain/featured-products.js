import { createDomainErrorClass } from "@/lib/domain/domain-error";
import { getOlistProductById } from "@/lib/integrations/olist-api";
import { rethrowAsDomainError } from "@/lib/integrations/olist-domain-error";
import {
  PRODUTOS_CATALOG_SELECT,
  PRODUTOS_TABLE,
  getSupabaseClient,
  mapNormalizedOlistToProdutosRow,
  mapProdutosRowToFeaturedGrid,
} from "@/lib/domain/produtos";
import { createSupabaseDomainAccess } from "@/lib/integrations/supabase-domain-access";

export const MAX_FEATURED_PRODUCTS = 3;

export const FeaturedProductsError = createDomainErrorClass("FeaturedProductsError");

const {
  getSupabaseOrThrow,
  rethrowSupabaseError: rethrowProdutosError,
} = createSupabaseDomainAccess(FeaturedProductsError, {
  tableMissing:
    "Tabela 'produto' não existe no Supabase. Execute o SQL em produtos.sql no editor SQL do projeto.",
  schemaMismatch:
    "A tabela 'produto' existe mas faltam colunas esperadas (ex.: id, nome, preco, seo, is_featured). Rode `supabase/PRODUTO_create_table.sql` e migracoes em `supabase/migrations/`.",
});

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
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new FeaturedProductsError(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY no servidor) no .env.local.",
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT)
    .eq("is_featured", true)
    .order("nome", { ascending: true });

  if (error) {
    rethrowProdutosError(error, "Não foi possível carregar produtos em destaque.");
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
    rethrowProdutosError(error, "Nao foi possivel buscar produto local.");
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
      rethrowProdutosError(upsertError, "Nao foi possivel salvar produto antes de marcar destaque.");
    }
  } catch (error) {
    rethrowAsDomainError(FeaturedProductsError, error, { includeTokenHint: true });
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
    rethrowProdutosError(clearError, "Não foi possível atualizar os destaques atuais.");
  }

  for (const olistId of olistIds) {
    const parsedId = Number(olistId);
    const lookupId = Number.isFinite(parsedId) && String(parsedId) === olistId ? parsedId : olistId;
    const { error: markError } = await supabase
      .from(PRODUTOS_TABLE)
      .update({ is_featured: true })
      .eq("id", lookupId);

    if (markError) {
      rethrowProdutosError(markError, "Não foi possível salvar os produtos em destaque.");
    }
  }

  return getFeaturedProducts();
}
