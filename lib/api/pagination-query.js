/**
 * Extrai parâmetros de paginação e busca de URLSearchParams ou URL.
 */
export function parsePageSearchParams(searchParams, options = {}) {
  const { defaultPageSize = 20, includeSearchMode = false } = options;

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || String(defaultPageSize));
  const q = String(searchParams.get("q") || "");

  const result = { page, pageSize, q };

  if (includeSearchMode) {
    const modeRaw = String(
      searchParams.get("mode") || searchParams.get("searchMode") || "descricao",
    );
    result.searchMode = modeRaw === "sku" ? "sku" : "descricao";
  }

  return result;
}

/** Atalho para `parsePageSearchParams` a partir de `request.url`. */
export function parsePageSearchParamsFromRequest(request, options = {}) {
  const url = new URL(request.url);
  return parsePageSearchParams(url.searchParams, options);
}

/** Normaliza número de página ou pageSize (inteiro positivo). */
export function normalizePageValue(value, fallback) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
