const DEFAULT_OLIST_API_BASE_URL = "https://api.tiny.com.br/public-api/v3";
const DEFAULT_PRODUCTS_PATH = "/produtos";

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
  };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function asArrayFromPayload(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload.itens,
    payload.items,
    payload.dados,
    payload.data,
    payload.retorno?.produtos,
    payload.retorno?.produto,
    payload.produtos,
    payload.produto,
  ];

  for (const entry of candidates) {
    if (Array.isArray(entry)) {
      return entry;
    }
  }

  if (payload.item && typeof payload.item === "object") {
    return [payload.item];
  }

  if (payload.produto && typeof payload.produto === "object" && !Array.isArray(payload.produto)) {
    return [payload.produto];
  }

  if (payload.id || payload.descricao) {
    return [payload];
  }

  return [];
}

function parsePagination(payload) {
  const pag = payload?.paginacao || payload?.pagination || payload?.page || null;
  const currentPage = Number(pag?.pagina ?? pag?.currentPage ?? pag?.page ?? NaN);
  const totalPages = Number(pag?.totalPaginas ?? pag?.totalPages ?? NaN);
  const totalItems = Number(pag?.totalItens ?? pag?.totalItems ?? NaN);

  return {
    currentPage: Number.isFinite(currentPage) ? currentPage : null,
    totalPages: Number.isFinite(totalPages) ? totalPages : null,
    totalItems: Number.isFinite(totalItems) ? totalItems : null,
  };
}

function normalizeOlistProduct(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = raw.id ?? raw.produto?.id;
  const sku = String(raw.sku ?? raw.codigo ?? raw.produto?.sku ?? raw.produto?.codigo ?? "").trim();
  const descricao = raw.descricao ?? raw.nome ?? raw.produto?.descricao ?? raw.produto?.nome ?? "";
  const situacao = raw.situacao ?? raw.produto?.situacao ?? "";
  const preco = Number(
    raw.precos?.preco ?? raw.preco ?? raw.precos?.precoPromocional ?? raw.produto?.preco ?? 0,
  );
  const estoque = Number(raw.estoque?.quantidade ?? raw.estoque ?? raw.saldo ?? 0);
  const imagemUrl =
    raw.anexos?.[0]?.url ??
    raw.imagemURL ??
    raw.imagem_url ??
    raw.imagens?.[0]?.url ??
    raw.foto ??
    "";

  const normalized = {
    id: String(id ?? "").trim(),
    sku,
    descricao: String(descricao || "").trim(),
    situacao: String(situacao || "").trim(),
    preco: Number.isFinite(preco) ? Math.round(preco * 100) : 0,
    estoque: Number.isFinite(estoque) ? Math.max(0, Math.floor(estoque)) : 0,
    imagem_url: String(imagemUrl || "").trim(),
    raw,
  };

  if (!normalized.id || !normalized.descricao) {
    return null;
  }

  return normalized;
}

function startsWithRelogio(descricao) {
  const normalized = normalizeText(descricao);
  return normalized.startsWith("relogio");
}

async function olistFetch(pathname, searchParams = new URLSearchParams()) {
  const { baseUrl, token } = readOlistConfig();
  const url = new URL(`${baseUrl}${pathname}`);
  for (const [key, value] of searchParams.entries()) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const reason =
      payload?.message || payload?.mensagem || payload?.error || `Erro ${response.status}`;
    throw new OlistApiError(`Falha na API Olist: ${reason}`, {
      status: response.status,
      cause: payload,
    });
  }

  return payload;
}

export async function listOlistProducts({ page = 1, pageSize = 20, keyword = "" } = {}) {
  const { productsPath } = readOlistConfig();
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 20)));
  const search = new URLSearchParams({
    pagina: String(safePage),
    limite: String(safePageSize),
    situacao: "A",
    descricao: "relógio",
  });
  const payload = await olistFetch(productsPath, search);
  const items = asArrayFromPayload(payload)
    .map(normalizeOlistProduct)
    .filter(Boolean)
    .filter((item) => item.situacao === "A")
    .filter((item) => startsWithRelogio(item.descricao));

  const keywordNormalized = normalizeText(keyword);
  const filtered =
    keywordNormalized.length > 0
      ? items.filter((item) => normalizeText(item.descricao).includes(keywordNormalized))
      : items;

  const pagination = parsePagination(payload);
  const hasNext =
    pagination.currentPage && pagination.totalPages
      ? pagination.currentPage < pagination.totalPages
      : filtered.length >= safePageSize;

  return {
    items: filtered,
    page: safePage,
    pageSize: safePageSize,
    hasNext,
    totalEstimated: pagination.totalItems,
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
