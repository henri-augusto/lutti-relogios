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
 * No servidor, se existir `SUPABASE_SERVICE_ROLE_KEY`, usa ela antes do anon:
 * o painel admin enxerga tudo com service role, mas RLS costuma bloquear o anon
 * na tabela `produtos` — aí o catálogo público ficava vazio mesmo com `in_catalog`.
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
 * Lê campos extras do payload bruto da Olist (GET detalhe / listagem).
 * @param {Record<string, unknown>} normalized
 */
function extractOlistDetailFromNormalized(normalized) {
  const raw =
    normalized.raw && typeof normalized.raw === "object"
      ? /** @type {Record<string, unknown>} */ (normalized.raw)
      : {};
  const nested =
    raw.produto && typeof raw.produto === "object"
      ? /** @type {Record<string, unknown>} */ (raw.produto)
      : {};
  const src = { ...raw, ...nested };

  const descricaoComplementar = String(src.descricaoComplementar ?? "").trim();

  /** @type {{ url: string, externo: boolean }[]} */
  const anexos = [];
  const seen = new Set();
  for (const list of [
    Array.isArray(src.anexos) ? src.anexos : [],
    Array.isArray(src.imagens) ? src.imagens : [],
  ]) {
    for (const entry of list) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const u = String(/** @type {{ url?: unknown }} */ (entry).url ?? "").trim();
      if (!u || seen.has(u)) {
        continue;
      }
      seen.add(u);
      anexos.push({ url: u, externo: true });
    }
  }

  return { descricaoComplementar, anexos };
}

/**
 * Monta linha da tabela `produtos` a partir do produto normalizado da Olist (`lib/olist-api.js`).
 * @param {{
 *   id: string,
 *   sku?: string,
 *   descricao: string,
 *   situacao?: string,
 *   tipo?: string,
 *   unidade?: string,
 *   gtin?: string,
 *   tipoVariacao?: string,
 *   dataCriacao?: string,
 *   dataAlteracao?: string,
 *   precos?: Record<string, number | null | undefined>,
 *   estoqueDetalhe?: Record<string, unknown>,
 *   estoque?: number,
 *   imagem_url?: string,
 *   raw?: unknown,
 * }} normalized
 * @returns {Record<string, unknown> | null}
 */
export function mapNormalizedOlistToProdutosRow(normalized) {
  if (!normalized || typeof normalized !== "object") {
    return null;
  }
  const olistId = Number(normalized.id);
  if (!Number.isFinite(olistId)) {
    return null;
  }
  const descricao = String(normalized.descricao || "").trim();
  if (!descricao) {
    return null;
  }

  const precosIn = normalized.precos && typeof normalized.precos === "object" ? normalized.precos : {};
  /** @type {Record<string, number>} */
  const precos = {};
  for (const [k, v] of Object.entries(precosIn)) {
    if (v == null) {
      continue;
    }
    const n = Number(v);
    if (Number.isFinite(n)) {
      precos[k] = Math.max(0, Math.round(n));
    }
  }
  if (Object.keys(precos).length === 0) {
    precos.preco = 0;
  }

  const qty = Math.max(0, Math.floor(Number(normalized.estoque) || 0));
  const det = normalized.estoqueDetalhe && typeof normalized.estoqueDetalhe === "object" ? { ...normalized.estoqueDetalhe } : {};
  if (qty > 0) {
    det.quantidade = qty;
  }

  const imagemUrl = String(normalized.imagem_url || "").trim();
  const { descricaoComplementar, anexos: anexosFromRaw } = extractOlistDetailFromNormalized(
    /** @type {Record<string, unknown>} */ (normalized),
  );
  const anexos =
    anexosFromRaw.length > 0 ? anexosFromRaw : imagemUrl ? [{ url: imagemUrl, externo: true }] : [];

  const toNullIfEmpty = (s) => {
    const t = String(s ?? "").trim();
    return t ? t : null;
  };

  return {
    olist_id: olistId,
    descricao,
    descricao_complementar: toNullIfEmpty(descricaoComplementar),
    situacao: String(normalized.situacao || "A"),
    sku: toNullIfEmpty(normalized.sku) ?? "",
    gtin: toNullIfEmpty(normalized.gtin),
    tipo: toNullIfEmpty(normalized.tipo),
    unidade: toNullIfEmpty(normalized.unidade),
    tipo_variacao: toNullIfEmpty(normalized.tipoVariacao),
    data_criacao: toNullIfEmpty(normalized.dataCriacao),
    data_alteracao: toNullIfEmpty(normalized.dataAlteracao),
    precos,
    estoque: det,
    anexos,
    seo: { slug: buildCatalogSlug(descricao, olistId) },
  };
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
 * Aceita preço zero e imagem ausente ou URL inválida (fallback no `ProductImageWithFallback`),
 * para que tudo com `in_catalog` possa ser listado no catálogo.
 * @param {Record<string, unknown>} row
 */
export function mapProdutosRowToCatalog(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const nomeRaw = row.descricao ?? row.name ?? row.nome;
  if (typeof nomeRaw !== "string" || !nomeRaw.trim()) {
    return null;
  }
  const nome = nomeRaw.trim();

  let slug = extractSlug(row);
  if (!slug) {
    const olistId = row.olist_id;
    slug = buildCatalogSlug(nome, olistId != null ? olistId : String(row.id ?? "0"));
  }
  slug = slug.trim();
  if (!slug) {
    return null;
  }

  const precoRaw = extractPrecoCentavos(row);
  const preco =
    precoRaw != null && Number.isFinite(precoRaw) ? Math.max(0, Math.round(precoRaw)) : 0;

  const imagem_url = normalizeImagemUrlForFeaturedGrid(firstImagemUrl(row));

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
    imagem_url,
    descricao: String(descricao).trim(),
    slug,
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

  const nomeRaw = row.descricao ?? row.name ?? row.nome;
  if (typeof nomeRaw !== "string" || !nomeRaw.trim()) {
    return null;
  }
  const nome = nomeRaw.trim();

  let slug = extractSlug(row);
  if (!slug) {
    const olistId = row.olist_id;
    slug = buildCatalogSlug(nome, olistId != null ? olistId : String(row.id ?? "0"));
  }
  slug = slug.trim();
  if (!slug) {
    return null;
  }

  const precoRaw = extractPrecoCentavos(row);
  const preco =
    precoRaw != null && Number.isFinite(precoRaw) ? Math.max(0, Math.round(precoRaw)) : 0;

  const imagem_url = normalizeImagemUrlForFeaturedGrid(firstImagemUrl(row));

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
    imagem_url,
    descricao: String(descricao).trim(),
    slug,
  };
}

/**
 * Mapeia linha `produtos` para o painel admin (campos extras: sku, situacao, flags).
 * @param {Record<string, unknown>} row
 */
export function mapProdutosRowToAdminList(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const nomeRaw = row.descricao ?? row.name ?? row.nome;
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
    const olistId = row.olist_id;
    slug = buildCatalogSlug(nome, olistId != null ? olistId : String(row.id ?? "0"));
  }

  const olistId = row.olist_id;
  const id = olistId != null ? String(olistId) : String(row.id ?? "");
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
    sku: String(row.sku ?? row.codigo ?? "").trim(),
    gtin: String(row.gtin ?? "").trim(),
    tipo: String(row.tipo ?? "").trim(),
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

export const PRODUTOS_CATALOG_SELECT =
  "id, olist_id, descricao, descricao_complementar, situacao, sku, gtin, tipo, unidade, tipo_variacao, data_criacao, data_alteracao, precos, estoque, anexos, seo, is_featured, in_catalog";

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
    const olistId = Number(suffix[1]);
    if (Number.isFinite(olistId)) {
      const { data: byOlist, error: olistError } = await supabase
        .from(PRODUTOS_TABLE)
        .select(PRODUTOS_CATALOG_SELECT)
        .eq("olist_id", olistId)
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
  }

  return null;
}

export async function getProdutosDestaque(limit = 3) {
  const produtos = await getProdutos();
  return produtos.slice(0, Math.max(0, limit));
}
