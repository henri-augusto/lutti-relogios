import { OlistApiError } from "@/lib/integrations/olist-api";

/**
 * Re-lança OlistApiError como erro de domínio; preserva erros já do mesmo domínio.
 * @param {new (message: string, opts?: { status?: number, cause?: unknown }) => Error} DomainErrorClass
 * @param {unknown} error
 * @param {{ fallbackMessage?: string, includeTokenHint?: boolean, defaultStatus?: number }} [options]
 */
export function rethrowAsDomainError(DomainErrorClass, error, options = {}) {
  const {
    fallbackMessage = "Falha ao buscar produto na Olist.",
    includeTokenHint = false,
    defaultStatus = 502,
  } = options;

  if (error instanceof DomainErrorClass) {
    throw error;
  }

  if (error instanceof OlistApiError) {
    const status =
      Number.isFinite(error.status) && error.status >= 400 && error.status < 600
        ? error.status
        : defaultStatus;
    const hint =
      includeTokenHint && error.status === 401
        ? " Token Olist invalido ou expirado. Renove em /olist/oauth ou sincronize o produto antes de marcar destaque."
        : "";
    throw new DomainErrorClass((error.message || fallbackMessage) + hint, {
      status,
      cause: error,
    });
  }

  throw error;
}
