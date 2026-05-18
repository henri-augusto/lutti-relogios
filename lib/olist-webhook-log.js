const LOG_PREFIX = "[olist-webhook-estoque]";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);

function maskHeaderValue(name, value) {
  if (!value) return value;
  if (!SENSITIVE_HEADERS.has(name.toLowerCase())) return value;
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function sanitizeWebhookHeaders(headers) {
  const sanitized = {};
  headers.forEach((value, name) => {
    sanitized[name] = maskHeaderValue(name, value);
  });
  return sanitized;
}

function tryParseJson(rawBody) {
  if (!rawBody || !rawBody.trim()) {
    return { parsed: null, parseError: null };
  }

  try {
    return { parsed: JSON.parse(rawBody), parseError: null };
  } catch (err) {
    return {
      parsed: null,
      parseError: err?.message || "JSON invalido",
    };
  }
}

/**
 * Registra payload de webhook Olist para analise (fase observacao).
 */
export function logOlistWebhookObservation({
  label = LOG_PREFIX,
  request,
  rawBody,
}) {
  const { parsed, parseError } = tryParseJson(rawBody);
  const headers = sanitizeWebhookHeaders(request.headers);

  const entry = {
    at: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers,
    rawBodyLength: rawBody?.length ?? 0,
    rawBody: rawBody ?? "",
    parsed,
    parseError,
  };

  console.log(label, JSON.stringify(entry, null, 2));

  if (parseError) {
    console.warn(`${label} corpo nao e JSON valido:`, parseError);
  }

  return entry;
}

export { LOG_PREFIX };
