/**
 * PostgreSQL undefined_table (42P01) / missing relation — not missing column.
 * Supabase/PostgREST often returns EN: relation "produto" does not exist.
 * @param {unknown} error
 */
export function isMissingTableError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = /** @type {{ code?: string, message?: string }} */ (error);
  const code = String(e.code || "").toUpperCase();
  if (code === "42703") {
    return false;
  }
  if (code === "42P01") {
    return true;
  }
  const message = String(e.message || "").toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
}

/**
 * Table exists but SELECT/UPSERT references unknown columns (wrong or old schema).
 * @param {unknown} error
 */
export function isSchemaMismatchError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = /** @type {{ code?: string, message?: string }} */ (error);
  const code = String(e.code || "").toUpperCase();
  if (code === "42703") {
    return true;
  }
  const message = String(e.message || "");
  if (/column\s+["']?[\w.]+\s+does not exist/i.test(message)) {
    return true;
  }
  // PostgreSQL em locale PT, ex.: coluna produto.data_criacao não existe
  if (/coluna\s+[\w.]+\s+n[aã]o\s+existe/i.test(message)) {
    return true;
  }
  return false;
}
