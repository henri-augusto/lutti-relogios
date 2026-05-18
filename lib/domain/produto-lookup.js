/** Resolve id de produto (numérico ou string) para consultas Supabase. */
export function resolveProductLookupId(productId) {
  const safeId = String(productId || "").trim();
  if (!safeId) {
    return null;
  }
  const parsedId = Number(safeId);
  return Number.isFinite(parsedId) && String(parsedId) === safeId ? parsedId : safeId;
}
