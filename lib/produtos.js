import { createClient } from "@supabase/supabase-js";

/** Tabela `public.produtos` (schema em produtos.sql). */
export const PRODUTOS_TABLE = "produtos";

export class ProductsFetchError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "ProductsFetchError";
    if (opts.cause !== undefined) {
      this.cause = opts.cause;
    }
  }
}

/**
 * Cliente Supabase para leitura do catálogo (somente servidor).
 * Prefira NEXT_PUBLIC_SUPABASE_ANON_KEY + RLS; em último caso usa SERVICE_ROLE_KEY.
 */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const key = anon || publishable || service;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function slugify(value) {
  const clean = String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || "produto";
}

/**
 * Slug de vitrine alinhado ao admin / Olist (descricao + id).
 * @param {string} descricao
 * @param {string | number} olistId
 */
export function buildCatalogSlug(descricao, olistId) {
  return `${slugify(descricao)}-${olistId}`;
}

/**
 * @param {Record<string, unknown>} row
 */
function extractPrecoCentavos(row) {
  const precos = row.precos;
  if (precos && typeof precos === "object" && precos.preco != null) {
    const n = Number(precos.preco);
    if (Number.isFinite(n)) {
      return Math.round(n);
    }
  }
  const legacy = row.price ?? row.preco;
  const n = Number(legacy);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * @param {Record<string, unknown>} row
 */
function extractEstoque(row) {
  const est = row.estoque;
  if (est && typeof est === "object" && est.quantidade != null) {
    const n = Number(est.quantidade);
    if (Number.isFinite(n)) {
      return Math.max(0, Math.floor(n));
    }
  }
  const stockRaw = row.stock ?? row.estoque;
  if (stockRaw === undefined || stockRaw === null) {
    return 0;
  }
  return Math.max(0, Math.floor(Number(stockRaw)));
}

/**
 * @param {Record<string, unknown>} row
 */
function firstImagemUrl(row) {
  const direct = row.image_url ?? row.imagem_url;
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }
  const anexos = row.anexos;
  if (!Array.isArray(anexos) || anexos.length === 0) {
    return "";
  }
  const u = anexos[0]?.url;
  return typeof u === "string" ? u.trim() : "";
}

/**
 * @param {Record<string, unknown>} row
 */
function extractSlug(row) {
  const flat = row.slug;
  if (typeof flat === "string" && flat.trim()) {
    return flat.trim();
  }
  const seo = row.seo;
  if (seo && typeof seo === "object" && typeof seo.slug === "string" && seo.slug.trim()) {
    return seo.slug.trim();
  }
  const olistId = row.olist_id;
  const descricao = row.descricao ?? row.name ?? row.nome;
  if (olistId != null && descricao) {
    return buildCatalogSlug(String(descricao), olistId);
  }
  return "";
}

/**
 * Monta linha `produtos` a partir do payload do admin (destaque), em centavos de BRL.
 * @param {{ id: string, descricao: string, preco?: number, estoque?: number, imagem_url?: string }} item
 */
export function buildProdutoUpsertFromHighlightItem(item) {
  const olistId = Number(item?.id);
  if (!Number.isFinite(olistId)) {
    return null;
  }
  const descricao = String(item?.descricao || "").trim();
  if (!descricao) {
    return null;
  }
  const preco = Number(item?.preco || 0);
  const estoque = Math.max(0, Math.floor(Number(item?.estoque) || 0));
  const imagemUrl = String(item?.imagem_url || "").trim();
  const slug = buildCatalogSlug(descricao, item.id);

  return {
    olist_id: olistId,
    descricao,
    situacao: "A",
    precos: { preco: Number.isFinite(preco) ? Math.max(0, Math.round(preco)) : 0 },
    estoque: { quantidade: estoque },
    anexos: imagemUrl ? [{ url: imagemUrl, externo: true }] : [],
    seo: { slug },
    is_featured: true,
  };
}

/**
 * Mapeia linha de `public.produtos` (JSONB Olist + colunas planas) para o modelo da vitrine.
 * @param {Record<string, unknown>} row
 */
export function mapProdutosRowToCatalog(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const slug = extractSlug(row);
  if (!slug) {
    return null;
  }

  const nomeRaw = row.descricao ?? row.name ?? row.nome;
  if (typeof nomeRaw !== "string" || !nomeRaw.trim()) {
    return null;
  }
  const nome = nomeRaw.trim();

  const preco = extractPrecoCentavos(row);
  if (preco == null || !Number.isFinite(preco) || preco <= 0) {
    return null;
  }

  const imagem_url = firstImagemUrl(row);
  if (!imagem_url) {
    return null;
  }
  const imagemUrlNormalizada = imagem_url;
  const imagemEhRelativa = imagemUrlNormalizada.startsWith("/");
  let imagemEhUrlValida = false;

  if (!imagemEhRelativa) {
    try {
      const parsedUrl = new URL(imagemUrlNormalizada);
      imagemEhUrlValida = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      imagemEhUrlValida = false;
    }
  }

  if (!imagemEhRelativa && !imagemEhUrlValida) {
    return null;
  }

  const longa = row.descricao_complementar ?? row.description;
  const descricao =
    (typeof longa === "string" && longa.trim()) ||
    (typeof row.descricao === "string" && row.descricao.trim()) ||
    "Sem descricao.";

  const estoque = extractEstoque(row);
  const olistId = row.olist_id;

  return {
    id: olistId != null ? String(olistId) : String(row.id ?? slug),
    nome,
    preco,
    estoque: Number.isFinite(estoque) ? estoque : 0,
    imagem_url: imagemUrlNormalizada,
    descricao: String(descricao).trim(),
    slug: slug.trim(),
  };
}

export const PRODUTOS_CATALOG_SELECT =
  "id, olist_id, descricao, descricao_complementar, situacao, precos, estoque, anexos, seo, is_featured";

export async function getProdutos() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ProductsFetchError(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY no servidor) no .env.local.",
    );
  }

  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT)
    .order("descricao", { ascending: true });

  if (error) {
    throw new ProductsFetchError("Nao foi possivel carregar os produtos.", { cause: error });
  }

  return (data ?? []).map(mapProdutosRowToCatalog).filter(Boolean);
}

export async function getProdutoBySlug(slug) {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ProductsFetchError(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY no servidor) no .env.local.",
    );
  }

  const trimmed = slug.trim();

  const { data: bySeoRows, error: seoError } = await supabase
    .from(PRODUTOS_TABLE)
    .select(PRODUTOS_CATALOG_SELECT)
    .contains("seo", { slug: trimmed })
    .limit(1);

  if (seoError) {
    throw new ProductsFetchError("Nao foi possivel carregar o produto.", { cause: seoError });
  }

  const fromSeo = mapProdutosRowToCatalog((bySeoRows ?? [])[0]);
  if (fromSeo) {
    return fromSeo;
  }

  const suffix = trimmed.match(/-(\d+)\s*$/);
  if (suffix) {
    const olistId = Number(suffix[1]);
    if (Number.isFinite(olistId)) {
      const { data: byOlist, error: olistError } = await supabase
        .from(PRODUTOS_TABLE)
        .select(PRODUTOS_CATALOG_SELECT)
        .eq("olist_id", olistId)
        .maybeSingle();

      if (olistError) {
        throw new ProductsFetchError("Nao foi possivel carregar o produto.", { cause: olistError });
      }

      const fromOlist = mapProdutosRowToCatalog(byOlist);
      if (fromOlist && fromOlist.slug === trimmed) {
        return fromOlist;
      }
    }
  }

  return null;
}

export async function getProdutosDestaque(limit = 3) {
  const produtos = await getProdutos();
  return produtos.slice(0, Math.max(0, limit));
}
