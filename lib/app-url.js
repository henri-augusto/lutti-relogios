/**
 * URL publica da app (sem barra final).
 * @param {Request} request
 */
export function resolvePublicBaseUrl(request) {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (envUrl) {
    return envUrl;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return null;
}
