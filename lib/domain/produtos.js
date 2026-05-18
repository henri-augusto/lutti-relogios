import { createClient } from "@supabase/supabase-js";
import { slugify, buildCatalogSlug } from "@/lib/domain/catalog-slug";
import { mapNormalizedOlistToProdutoWebhookRow } from "@/lib/integrations/olist-webhook-produto";

/** Tabela `public.produto` (payload Tiny/Olist em camelCase). */
export const PRODUTOS_TABLE = "produto";

export { slugify, buildCatalogSlug };

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
 * No servidor, se existir `SUPABASE_SERVICE_ROLE_KEY`, usa ela antes do anon:
 * o painel admin enxerga tudo com service role, mas RLS costuma bloquear o anon
 * na tabela `produto` — aí o catálogo público ficava vazio mesmo com `in_catalog`.
 * No cliente (bundle) a service role não existe; cai no anon/publishable.
 */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const isServer = typeof window === "undefined";
  const key =
    isServer && service ? service : anon || publishable || service;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Mesmo shape que `mapNormalizedOlistToProdutoWebhookRow` (colunas camelCase da tabela `produto`).
 * @param {Record<string, unknown> | null | undefined} normalized
 * @returns {Record<string, unknown> | null}
 */
export function mapNormalizedOlistToProdutosRow(normalized) {
  return mapNormalizedOlistToProdutoWebhookRow(normalized);
}

/**
 * Coluna `preco` em texto (reais) → centavos; aceita formato BR ou com ponto decimal.
 * @param {unknown} value
 */
function parseReaisTextToCentavos(value) {
  if (value == null || value === "") {
    return null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  let s = raw;
  if (/,/.test(s) && /\./.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/,/.test(s) && !/\./.test(s)) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.round(n * 100);
}

/**
 * @param {Record<string, unknown>} row
 */
function extractPrecoCentavos(row) {
  const precos = row.precos;
  if (precos && typeof precos === "object" && precos.preco != null) {
    const n = Number(precos.preco);
    if (Number.isFinite(n)) {
      /** Legado: `precos.preco` já em centavos. */
      return Math.round(n);
    }
  }
  const fromText = parseReaisTextToCentavos(row.preco ?? row.precoPromocional);
  if (fromText != null) {
    return fromText;
  }
  const legacy = row.price ?? row.preco;
  if (legacy == null || legacy === "") {
    return null;
  }
  const n = Number(legacy);
  if (!Number.isFinite(n)) {
    return null;
  }
  // `public.produto.preco` vem em reais (ex.: "380.00"); legado em centavos no JSONB `precos`.
  if (row.nome != null || row.estoqueAtual != null) {
    return Math.round(n * 100);
  }
  return Math.round(n);
}

/**
 * @param {Record<string, unknown>} row
 */
function extractEstoque(row) {
  if (row.estoqueAtual != null && row.estoqueAtual !== "") {
    const n = Number(row.estoqueAtual);
    if (Number.isFinite(n)) {
      return Math.max(0, Math.floor(n));
    }
  }
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
 * Extrai e normaliza todas as URLs de imagem disponíveis no produto.
 * @param {Record<string, unknown>} row
 */
function extractAllImagemUrls(row) {
  const seen = new Set();
  /** @type {string[]} */
  const imagens = [];

  const direct = normalizeImagemUrlForFeaturedGrid(firstImagemUrl(row));
  if (direct && !seen.has(direct)) {
    seen.add(direct);
    imagens.push(direct);
  }

  const anexos = Array.isArray(row.anexos) ? row.anexos : [];
  for (const anexo of anexos) {
    if (!anexo || typeof anexo !== "object") {
      continue;
    }
    const rawUrl = typeof anexo.url === "string" ? anexo.url : "";
    const normalized = normalizeImagemUrlForFeaturedGrid(rawUrl);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    imagens.push(normalized);
  }

  return imagens;
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
  const catalogId = row.olist_id ?? row.id;
  const descricao = row.nome ?? row.descricao ?? row.name;
  if (catalogId != null && descricao) {
    return buildCatalogSlug(String(descricao), catalogId);
  }
  return "";
}

/**
 * Remove tags HTML para obter texto legível em contexts que exigem string pura.
 * @param {unknown} html
 */
function plainTextFromHtml(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Monta linha `produto` a partir do payload do admin (destaque). `preco` no item = centavos (modelo vitrine).
 * @param {{ id: string, descricao: string, preco?: number, estoque?: number, imagem_url?: string }} item
 */
export function buildProdutoUpsertFromHighlightItem(item) {
  const idStr = String(item?.id ?? "").trim();
  if (!idStr) {
    return null;
  }
  const nome = String(item?.descricao || "").trim();
  if (!nome) {
    return null;
  }
  const precoCent = Number(item?.preco || 0);
  const precoText = Number.isFinite(precoCent)
    ? (Math.max(0, Math.round(precoCent)) / 100).toFixed(2)
    : "0.00";
  const estoque = Math.max(0, Math.floor(Number(item?.estoque) || 0));
  const imagemUrl = String(item?.imagem_url || "").trim();
  const slug = buildCatalogSlug(nome, idStr);

  return {
    id: idStr,
    nome,
    situacao: "A",
    preco: precoText,
    estoqueAtual: estoque,
    anexos: imagemUrl ? [{ url: imagemUrl, externo: true }] : [],
    seo: { slug },
    is_featured: true,
  };
}

/**
 * Mapeia linha de `public.produto` para o modelo da vitrine.
 * @param {Record<string, unknown>} row
 */
export function mapProdutosRowToCatalog(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const nomeRaw = row.nome ?? row.descricao ?? row.name;
  if (typeof nomeRaw !== "string" || !nomeRaw.trim()) {
    return null;
  }
  const nome = nomeRaw.trim();

  let slug = extractSlug(row);
  if (!slug) {
    const catalogId = row.olist_id ?? row.id;
    slug = buildCatalogSlug(nome, catalogId != null ? catalogId : String(row.id_supabase ?? "0"));
  }
  slug = slug.trim();
  if (!slug) {
    return null;
  }

  const precoRaw = extractPrecoCentavos(row);
  const preco =
    precoRaw != null && Number.isFinite(precoRaw) ? Math.max(0, Math.round(precoRaw)) : 0;

  const imagens = extractAllImagemUrls(row);
  const imagem_url = imagens[0] ?? "";

  const longa =
    row.descricaoComplementar ?? row.descricao_complementar ?? row.description ?? "";
  const descricaoComplementar =
    typeof longa === "string" && longa.trim() ? longa.trim() : "";
  const descricao =
    plainTextFromHtml(descricaoComplementar) ||
    (typeof row.nome === "string" && row.nome.trim()) ||
    (typeof row.descricao === "string" && row.descricao.trim()) ||
    nome;

  const estoque = extractEstoque(row);
  const catalogId = row.olist_id ?? row.id;

  return {
    id: catalogId != null ? String(catalogId) : String(row.id_supabase ?? slug),
    nome,
    preco,
    estoque: Number.isFinite(estoque) ? estoque : 0,
    imagem_url,
    imagens,
    descricao: String(descricao).trim(),
    descricaoComplementar,
    slug,
    marca: typeof row.marca === "string" ? row.marca.trim() : "",
  };
}

/**
 * Normaliza URL de imagem para a grade de destaques: vazia se inválida (fallback no card).
 * @param {string} raw
 */
function normalizeImagemUrlForFeaturedGrid(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * Modelo da vitrine para produtos marcados `is_featured`, sem exigir preço > 0 nem imagem.
 * @param {Record<string, unknown>} row
 */
export function mapProdutosRowToFeaturedGrid(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const nomeRaw = row.nome ?? row.descricao ?? row.name;
  if (typeof nomeRaw !== "string" || !nomeRaw.trim()) {
    return null;
  }
  const nome = nomeRaw.trim();

  let slug = extractSlug(row);
  if (!slug) {
    const catalogId = row.olist_id ?? row.id;
    slug = buildCatalogSlug(nome, catalogId != null ? catalogId : String(row.id_supabase ?? "0"));
  }
  slug = slug.trim();
  if (!slug) {
    return null;
  }

  const precoRaw = extractPrecoCentavos(row);
  const preco =
    precoRaw != null && Number.isFinite(precoRaw) ? Math.max(0, Math.round(precoRaw)) : 0;

  const imagens = extractAllImagemUrls(row);
  const imagem_url = imagens[0] ?? "";

  const longa =
    row.descricaoComplementar ?? row.descricao_complementar ?? row.description ?? "";
  const descricaoComplementar =
    typeof longa === "string" && longa.trim() ? longa.trim() : "";
  const descricao =
    plainTextFromHtml(descricaoComplementar) ||
    (typeof row.nome === "string" && row.nome.trim()) ||
    (typeof row.descricao === "string" && row.descricao.trim()) ||
    nome;

  const estoque = extractEstoque(row);
  const catalogId = row.olist_id ?? row.id;

  return {
    id: catalogId != null ? String(catalogId) : String(row.id_supabase ?? slug),
    nome,
    preco,
    estoque: Number.isFinite(estoque) ? estoque : 0,
    imagem_url,
    imagens,
    descricao: String(descricao).trim(),
    descricaoComplementar,
    slug,
    marca: typeof row.marca === "string" ? row.marca.trim() : "",
  };
}

/**
 * Mapeia linha `produto` para o painel admin (campos extras: sku, situacao, flags).
 * @param {Record<string, unknown>} row
 */
export function mapProdutosRowToAdminList(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const nomeRaw = row.nome ?? row.descricao ?? row.name;
  if (typeof nomeRaw !== "string" || !nomeRaw.trim()) {
    return null;
  }
  const nome = nomeRaw.trim();

  const precoRaw = extractPrecoCentavos(row);
  const preco =
    precoRaw != null && Number.isFinite(precoRaw) ? Math.max(0, Math.round(precoRaw)) : 0;

  const imagem_url = firstImagemUrl(row);
  let slug = extractSlug(row);
  if (!slug) {
    const catalogId = row.olist_id ?? row.id;
    slug = buildCatalogSlug(nome, catalogId != null ? catalogId : String(row.id ?? "0"));
  }

  const catalogId = row.olist_id ?? row.id;
  const id = catalogId != null ? String(catalogId) : String(row.id ?? "").trim();
  if (!id) {
    return null;
  }

  const featuredRaw = row.is_featured;
  const is_featured = featuredRaw === true || featuredRaw === "true" || featuredRaw === 1;
  const catalogRaw = row.in_catalog;
  const in_catalog =
    catalogRaw === true || catalogRaw === "true" || catalogRaw === 1;

  return {
    id,
    sku: String(row.codigo ?? row.skuMapeamento ?? row.sku ?? "").trim(),
    gtin: String(row.gtin ?? "").trim(),
    tipo: String(row.classeProduto ?? row.tipo ?? "").trim(),
    unidade: String(row.unidade ?? "").trim(),
    tipo_variacao: String(row.tipo_variacao ?? "").trim(),
    descricao: nome,
    situacao: String(row.situacao || "A"),
    preco,
    estoque: extractEstoque(row),
    imagem_url,
    slug: slug.trim(),
    is_featured,
    in_catalog,
  };
}

/** Colunas lidas pelo catálogo, detalhe e admin (PostgREST = nomes camelCase da tabela). */
export const PRODUTOS_CATALOG_SELECT =
  "id, id_supabase, nome, codigo, skuMapeamento, preco, precoPromocional, estoqueAtual, descricaoComplementar, situacao, gtin, unidade, anexos, seo, is_featured, in_catalog, marca, descricaoCategoria";

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
    .eq("in_catalog", true)
    .order("nome", { ascending: true });

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
    .eq("in_catalog", true)
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
    const olistIdStr = suffix[1];
    const { data: byOlist, error: olistError } = await supabase
      .from(PRODUTOS_TABLE)
      .select(PRODUTOS_CATALOG_SELECT)
      .eq("id", olistIdStr)
      .eq("in_catalog", true)
      .maybeSingle();

    if (olistError) {
      throw new ProductsFetchError("Nao foi possivel carregar o produto.", { cause: olistError });
    }

    const fromOlist = mapProdutosRowToCatalog(byOlist);
    if (fromOlist && fromOlist.slug === trimmed) {
      return fromOlist;
    }
  }

  return null;
}

export async function getProdutosDestaque(limit = 3) {
  const produtos = await getProdutos();
  return produtos.slice(0, Math.max(0, limit));
}
