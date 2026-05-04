const DEFAULT_OLIST_API_BASE_URL = "https://api.tiny.com.br/public-api/v3";
const DEFAULT_PRODUCTS_PATH = "/produtos";
const DEFAULT_SAFE_REQUESTS_PER_MINUTE = 180;
/** Máximo de itens por GET /produtos na API v3. */
const OLIST_LIST_API_LIMIT = 100;
/** Teto de chamadas GET por invocação de listOlistProducts (evita laços longos). */
const MAX_RAW_FETCHES_PER_LIST = 400;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const RATE_LIMIT_WINDOW_MS = 60_000;

const olistRateState = {
  startedAtMs: Date.now(),
  requestsInWindow: 0,
};

/**
 * Resposta de listagem GET /produtos (Olist ERP API v3).
 * @typedef {{
 *   itens?: unknown[],
 *   paginacao?: { limit?: number, offset?: number, total?: number },
 * }} OlistProdutosListPayload
 */

/**
 * Produto normalizado para uso interno e persistência.
 * `preco` e campos em `precos` estão em centavos de BRL (inteiros).
 * @typedef {{
 *   id: string,
 *   sku: string,
 *   descricao: string,
 *   situacao: string,
 *   tipo: string,
 *   unidade: string,
 *   gtin: string,
 *   tipoVariacao: string,
 *   dataCriacao: string,
 *   dataAlteracao: string,
 *   preco: number,
 *   estoque: number,
 *   imagem_url: string,
 *   precos: Record<string, number | null>,
 *   estoqueDetalhe: Record<string, unknown>,
 *   raw?: unknown,
 * }} NormalizedOlistProduct
 */

export class OlistApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "OlistApiError";
    if (opts.status !== undefined) {
      this.status = opts.status;
    }
    if (opts.cause !== undefined) {
      this.cause = opts.cause;
    }
  }
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function readOlistConfig() {
  const baseUrlRaw = process.env.OLIST_API_BASE_URL?.trim() || DEFAULT_OLIST_API_BASE_URL;
  const token = process.env.OLIST_API_TOKEN?.trim();
  const productsPath = process.env.OLIST_PRODUCTS_PATH?.trim() || DEFAULT_PRODUCTS_PATH;
  const safeRpmRaw = Number(process.env.OLIST_SAFE_REQUESTS_PER_MINUTE);

  if (!token) {
    throw new OlistApiError(
      "OLIST_API_TOKEN nao configurado. Gere um token na tela /olist/oauth e configure no .env.local.",
    );
  }

  const baseUrl = stripTrailingSlash(baseUrlRaw);
  if (!baseUrl) {
    throw new OlistApiError("OLIST_API_BASE_URL invalido.");
  }

  return {
    baseUrl,
    token,
    productsPath: productsPath.startsWith("/") ? productsPath : `/${productsPath}`,
    safeRequestsPerMinute:
      Number.isFinite(safeRpmRaw) && safeRpmRaw > 0
        ? Math.min(240, Math.floor(safeRpmRaw))
        : DEFAULT_SAFE_REQUESTS_PER_MINUTE,
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireOlistRateLimitSlot(maxRequestsPerMinute) {
  const now = Date.now();
  const elapsed = now - olistRateState.startedAtMs;
  if (elapsed >= RATE_LIMIT_WINDOW_MS) {
    olistRateState.startedAtMs = now;
    olistRateState.requestsInWindow = 0;
  }

  if (olistRateState.requestsInWindow < maxRequestsPerMinute) {
    olistRateState.requestsInWindow += 1;
    return;
  }

  const waitForMs = Math.max(100, RATE_LIMIT_WINDOW_MS - elapsed);
  await wait(waitForMs);
  olistRateState.startedAtMs = Date.now();
  olistRateState.requestsInWindow = 1;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

/**
 * @param {number | null | undefined} reais
 * @returns {number | null}
 */
function reaisToCentavos(reais) {
  if (reais == null || reais === "") {
    return null;
  }
  const n = Number(reais);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.round(n * 100);
}

/**
 * Monta objeto `precos` em centavos a partir do modelo da API (valores em reais).
 * @param {Record<string, unknown> | null | undefined} precosRaw
 * @returns {Record<string, number>}
 */
function buildPrecosCentavos(precosRaw) {
  if (!precosRaw || typeof precosRaw !== "object") {
    return {};
  }
  /** @type {Record<string, number>} */
  const out = {};
  const keys = ["preco", "precoPromocional", "precoCusto", "precoCustoMedio"];
  for (const key of keys) {
    const c = reaisToCentavos(/** @type {number} */ (precosRaw[key]));
    if (c != null) {
      out[key] = c;
    }
  }
  return out;
}

/**
 * @param {Record<string, unknown> | null | undefined} estoqueRaw
 * @returns {{ detalhe: Record<string, unknown>, quantidade: number }}
 */
function buildEstoqueDetalhe(estoqueRaw) {
  const detalhe = {};
  if (estoqueRaw && typeof estoqueRaw === "object") {
    if (estoqueRaw.localizacao != null) {
      detalhe.localizacao = String(estoqueRaw.localizacao).trim();
    }
    if (estoqueRaw.quantidade != null) {
      const q = Number(estoqueRaw.quantidade);
      if (Number.isFinite(q)) {
        detalhe.quantidade = Math.max(0, Math.floor(q));
      }
    }
  }
  const quantidade =
    detalhe.quantidade != null && typeof detalhe.quantidade === "number"
      ? detalhe.quantidade
      : 0;
  return { detalhe, quantidade };
}

/**
 * Extrai array de produtos da resposta JSON (listagem ou detalhe).
 * @param {unknown} payload
 * @returns {unknown[]}
 */
function asArrayFromPayload(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload === "object" && payload !== null && "itens" in payload) {
    const itens = /** @type {{ itens?: unknown }} */ (payload).itens;
    if (Array.isArray(itens)) {
      return itens;
    }
  }

  const candidates = [
    /** @type {Record<string, unknown>} */ (payload).items,
    /** @type {Record<string, unknown>} */ (payload).dados,
    /** @type {Record<string, unknown>} */ (payload).data,
    /** @type {Record<string, unknown>} */ (payload).retorno?.produtos,
    /** @type {Record<string, unknown>} */ (payload).retorno?.produto,
    /** @type {Record<string, unknown>} */ (payload).produtos,
    /** @type {Record<string, unknown>} */ (payload).produto,
  ];

  for (const entry of candidates) {
    if (Array.isArray(entry)) {
      return entry;
    }
  }

  const p = /** @type {Record<string, unknown>} */ (payload);
  if (p.item && typeof p.item === "object") {
    return [p.item];
  }

  if (p.produto && typeof p.produto === "object" && !Array.isArray(p.produto)) {
    return [p.produto];
  }

  if (p.id || p.descricao) {
    return [payload];
  }

  return [];
}

/**
 * Paginação v3: `paginacao.limit`, `offset`, `total`.
 * Mantém leitura de chaves legadas quando presentes.
 * @param {unknown} payload
 * @returns {{
 *   limit: number | null,
 *   offset: number | null,
 *   total: number | null,
 *   currentPage: number | null,
 *   totalPages: number | null,
 * }}
 */
function parsePagination(payload) {
  const pag =
    (payload && typeof payload === "object" && (/** @type {Record<string, unknown>} */ (payload).paginacao ||
      /** @type {Record<string, unknown>} */ (payload).pagination ||
      /** @type {Record<string, unknown>} */ (payload).page)) ||
    null;

  const limit = Number(pag?.limit ?? pag?.limite ?? NaN);
  const offset = Number(pag?.offset ?? NaN);
  const total = Number(pag?.total ?? pag?.totalItens ?? pag?.totalItems ?? NaN);

  const currentPage = Number(pag?.pagina ?? pag?.currentPage ?? pag?.page ?? NaN);
  const totalPages = Number(pag?.totalPaginas ?? pag?.totalPages ?? NaN);

  return {
    limit: Number.isFinite(limit) ? limit : null,
    offset: Number.isFinite(offset) ? offset : null,
    total: Number.isFinite(total) ? total : null,
    currentPage: Number.isFinite(currentPage) ? currentPage : null,
    totalPages: Number.isFinite(totalPages) ? totalPages : null,
  };
}

/**
 * @param {unknown} raw
 * @returns {NormalizedOlistProduct | null}
 */
function normalizeOlistProduct(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const r = /** @type {Record<string, unknown>} */ (raw);
  const nested = r.produto && typeof r.produto === "object" ? /** @type {Record<string, unknown>} */ (r.produto) : null;
  const src = nested || r;

  const id = src.id ?? r.id;
  const sku = String(src.sku ?? src.codigo ?? r.codigo ?? "").trim();
  const descricao = String(src.descricao ?? src.nome ?? r.descricao ?? r.nome ?? "").trim();
  const situacao = String(src.situacao ?? r.situacao ?? "").trim();
  const tipo = String(src.tipo ?? r.tipo ?? "").trim();
  const unidade = String(src.unidade ?? r.unidade ?? "").trim();
  const gtin = String(src.gtin ?? r.gtin ?? "").trim();
  const tipoVariacao = String(src.tipoVariacao ?? r.tipoVariacao ?? "").trim();
  const dataCriacao = src.dataCriacao != null ? String(src.dataCriacao) : "";
  const dataAlteracao = src.dataAlteracao != null ? String(src.dataAlteracao) : "";

  const precosRaw =
    src.precos && typeof src.precos === "object" ? /** @type {Record<string, unknown>} */ (src.precos) : null;
  const precosCentavos = buildPrecosCentavos(precosRaw);

  const reaisPreco =
    Number(precosRaw?.preco ?? src.preco ?? precosRaw?.precoPromocional ?? r.preco ?? 0) || 0;
  const precoDisplay = Number.isFinite(reaisPreco) ? Math.round(reaisPreco * 100) : 0;

  const estoqueRaw =
    src.estoque && typeof src.estoque === "object" ? /** @type {Record<string, unknown>} */ (src.estoque) : null;
  const { detalhe: estoqueDetalhe, quantidade: estoqueQty } = buildEstoqueDetalhe(estoqueRaw);
  const estoqueFallback = Number(r.estoque ?? r.saldo ?? 0);
  const estoque = estoqueQty > 0 ? estoqueQty : Number.isFinite(estoqueFallback) ? Math.max(0, Math.floor(estoqueFallback)) : 0;

  const imagemUrl =
    (Array.isArray(src.anexos) && src.anexos[0] && typeof src.anexos[0] === "object" && "url" in src.anexos[0]
      ? String(/** @type {{ url?: string }} */ (src.anexos[0]).url || "")
      : "") ||
    String(src.imagemURL ?? src.imagem_url ?? r.imagemURL ?? r.imagem_url ?? "").trim() ||
    (Array.isArray(src.imagens) && src.imagens[0] && typeof src.imagens[0] === "object" && "url" in src.imagens[0]
      ? String(/** @type {{ url?: string }} */ (src.imagens[0]).url || "")
      : "") ||
    String(src.foto ?? r.foto ?? "").trim();

  const normalized = {
    id: String(id ?? "").trim(),
    sku,
    descricao,
    situacao,
    tipo,
    unidade,
    gtin,
    tipoVariacao,
    dataCriacao,
    dataAlteracao,
    preco: Object.keys(precosCentavos).length > 0 ? precosCentavos.preco ?? precoDisplay : precoDisplay,
    estoque,
    imagem_url: imagemUrl,
    precos: Object.keys(precosCentavos).length > 0 ? precosCentavos : { preco: precoDisplay },
    estoqueDetalhe,
    raw,
  };

  if (!normalized.id || !normalized.descricao) {
    return null;
  }

  return normalized;
}

function descricaoContemRelogio(descricao) {
  return normalizeText(descricao).includes("relogio");
}

/**
 * @param {unknown} payload
 * @param {number} rawCount
 * @param {number} requestedLimit
 */
function computeApiHasNextPage(payload, rawCount, requestedLimit) {
  const pagination = parsePagination(payload);
  if (pagination.total != null && pagination.offset != null && pagination.limit != null) {
    return pagination.offset + pagination.limit < pagination.total;
  }
  if (pagination.currentPage != null && pagination.totalPages != null) {
    return pagination.currentPage < pagination.totalPages;
  }
  return rawCount >= requestedLimit;
}

async function olistFetch(pathname, searchParams = new URLSearchParams()) {
  const { baseUrl, token, safeRequestsPerMinute } = readOlistConfig();
  const url = new URL(`${baseUrl}${pathname}`);
  for (const [key, value] of searchParams.entries()) {
    url.searchParams.set(key, value);
  }
  const maxAttempts = 4;
  let lastPayload = null;
  let lastStatus = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await acquireOlistRateLimitSlot(safeRequestsPerMinute);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    lastPayload = payload;
    lastStatus = response.status;

    if (response.ok) {
      return payload;
    }

    const canRetry = RETRYABLE_STATUS.has(response.status) && attempt < maxAttempts;
    if (!canRetry) {
      const reason =
        payload?.message || payload?.mensagem || payload?.error || `Erro ${response.status}`;
      throw new OlistApiError(`Falha na API Olist: ${reason}`, {
        status: response.status,
        cause: payload,
      });
    }

    const retryAfterHeader = Number(response.headers.get("retry-after"));
    const retryAfterMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader * 1000 : 0;
    const backoffMs = Math.min(8000, 400 * 2 ** (attempt - 1));
    await wait(Math.max(backoffMs, retryAfterMs));
  }

  throw new OlistApiError("Falha na API Olist apos tentativas de retry.", {
    status: lastStatus || 500,
    cause: lastPayload,
  });
}

/**
 * Lista produtos na Olist ERP API v3 (GET /produtos).
 * Não envia `nome` na query: percorre páginas da API (limit alto) e filtra em memória
 * descrições que contêm "relogio" (acentos ignorados), depois aplica `keyword` se houver.
 * @param {{ page?: number, pageSize?: number, keyword?: string }} [opts]
 */
export async function listOlistProducts({ page = 1, pageSize = 20, keyword = "" } = {}) {
  const { productsPath } = readOlistConfig();
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 20)));
  const skip = (safePage - 1) * safePageSize;
  const take = safePageSize;

  const keywordNormalized = normalizeText(keyword);

  /** @type {NormalizedOlistProduct[]} */
  const collected = [];
  let apiOffset = 0;
  let filteredIndex = 0;
  let rawFetches = 0;
  let virtualHasNext = false;
  /** @type {unknown} */
  let lastPayload = null;
  let lastApiHasNext = false;

  while (collected.length < take && rawFetches < MAX_RAW_FETCHES_PER_LIST) {
    const search = new URLSearchParams({
      limit: String(OLIST_LIST_API_LIMIT),
      offset: String(apiOffset),
      situacao: "A",
    });

    lastPayload = await olistFetch(productsPath, search);
    rawFetches += 1;
    const rawItems = asArrayFromPayload(lastPayload);
    const batch = rawItems
      .map(normalizeOlistProduct)
      .filter(Boolean)
      .filter((item) => item.situacao === "A")
      .filter((item) => descricaoContemRelogio(item.descricao));

    const batchFiltered =
      keywordNormalized.length > 0
        ? batch.filter((item) => normalizeText(item.descricao).includes(keywordNormalized))
        : batch;

    for (const item of batchFiltered) {
      if (filteredIndex >= skip + take) {
        virtualHasNext = true;
        break;
      }
      if (filteredIndex >= skip) {
        collected.push(item);
      }
      filteredIndex += 1;
    }

    if (virtualHasNext || collected.length >= take) {
      lastApiHasNext = computeApiHasNextPage(lastPayload, rawItems.length, OLIST_LIST_API_LIMIT);
      break;
    }

    lastApiHasNext = computeApiHasNextPage(lastPayload, rawItems.length, OLIST_LIST_API_LIMIT);
    if (!lastApiHasNext || rawItems.length === 0) {
      break;
    }

    apiOffset += OLIST_LIST_API_LIMIT;
  }

  const hasNext =
    virtualHasNext ||
    (collected.length === take && lastApiHasNext) ||
    (collected.length < take &&
      rawFetches >= MAX_RAW_FETCHES_PER_LIST &&
      lastApiHasNext);

  return {
    items: collected,
    page: safePage,
    pageSize: safePageSize,
    hasNext,
    totalEstimated: null,
    offset: skip,
    limit: safePageSize,
  };
}

export async function getOlistProductById(id) {
  const { productsPath } = readOlistConfig();
  const safeId = String(id || "").trim();
  if (!safeId) {
    throw new OlistApiError("ID do produto nao informado.");
  }

  const payload = await olistFetch(`${productsPath}/${encodeURIComponent(safeId)}`);
  const [first] = asArrayFromPayload(payload);
  const normalized = normalizeOlistProduct(first || payload);
  if (!normalized) {
    throw new OlistApiError("Produto nao encontrado na Olist.", { status: 404 });
  }
  return normalized;
}
