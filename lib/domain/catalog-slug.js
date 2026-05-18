/**
 * Slug de vitrine (nome/descrição + id Olist).
 * Compartilhado entre `lib/produtos.js` e `lib/olist-webhook-produto.js` para evitar import circular.
 */

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
 * @param {string} descricao
 * @param {string | number} olistId
 */
export function buildCatalogSlug(descricao, olistId) {
  return `${slugify(descricao)}-${olistId}`;
}
