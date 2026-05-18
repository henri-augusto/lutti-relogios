import { buildCatalogSlug } from "@/lib/domain/catalog-slug";

/**
 * Webhook Olist/Tiny → `public.produto`
 *
 * Colunas alinhadas ao objeto `dados` do JSON da Olist (mesmos nomes / camelCase).
 * Upsert na coluna de negócio `id` (único).
 */

/** Coluna usada no upsert (PostgREST `onConflict`). */
export const PRODUTO_WEBHOOK_CONFLICT_COLUMN = "id";

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toNullText(value) {
  if (value == null) {
    return null;
  }
  const s = String(value).trim();
  return s ? s : null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function numToNullText(value) {
  if (value == null || value === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return String(n);
}

/**
 * Preços em reais como string (formato webhook / API em reais).
 * @param {unknown} reais
 */
function reaisToNullText(reais) {
  if (reais == null || reais === "") {
    return null;
  }
  const n = Number(reais);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n.toFixed(2);
}

/**
 * Centavos (modelo interno normalizado) → texto em reais.
 * @param {unknown} centavos
 */
function centavosToReaisText(centavos) {
  if (centavos == null || centavos === "") {
    return null;
  }
  const n = Number(centavos);
  if (!Number.isFinite(n)) {
    return null;
  }
  return (n / 100).toFixed(2);
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function cloneJson(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  }
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function coerceInt(value) {
  if (value == null || value === "") {
    return null;
  }
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? n : null;
}

/**
 * Texto opcional: preserva string vazia se vier explícita do payload (como na Olist).
 * @param {unknown} value
 * @returns {string | null}
 */
function asText(value) {
  if (value == null) {
    return null;
  }
  return String(value);
}

/**
 * Objeto produto “achatado”: raiz do raw + `raw.produto` quando existir (formato legado).
 * @param {Record<string, unknown>} normalized
 * @returns {Record<string, unknown>}
 */
function mergeOlistSources(normalized) {
  const raw =
    normalized.raw && typeof normalized.raw === "object"
      ? /** @type {Record<string, unknown>} */ (normalized.raw)
      : {};
  const nested =
    raw.produto && typeof raw.produto === "object"
      ? /** @type {Record<string, unknown>} */ (raw.produto)
      : null;
  return { ...raw, ...(nested || {}) };
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function jsonColumnValue(value) {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return cloneJson(value);
  }
  if (typeof value === "object") {
    return cloneJson(value);
  }
  return null;
}

/**
 * Monta linha para `public.produto` (colunas = payload Olist em `dados`).
 * Aceita webhook plano (`dados`) e estruturas antigas (precos/estoque/categoria aninhados).
 * @param {Record<string, unknown> | null | undefined} normalized
 * @returns {Record<string, unknown> | null}
 */
export function mapNormalizedOlistToProdutoWebhookRow(normalized) {
  if (!normalized || typeof normalized !== "object") {
    return null;
  }

  const norm = /** @type {Record<string, unknown>} */ (normalized);
  const src = mergeOlistSources(norm);

  const idRaw = src.id ?? norm.id;
  const id = idRaw != null ? String(idRaw).trim() : "";
  if (!id) {
    return null;
  }

  const nome = String(src.nome ?? src.descricao ?? norm.descricao ?? "").trim();
  if (!nome) {
    return null;
  }

  const precosRaw =
    src.precos && typeof src.precos === "object" ? /** @type {Record<string, unknown>} */ (src.precos) : null;
  const precosNorm =
    norm.precos && typeof norm.precos === "object" ? /** @type {Record<string, unknown>} */ (norm.precos) : null;

  const preco =
    src.preco != null && src.preco !== ""
      ? asText(src.preco)
      : reaisToNullText(precosRaw?.preco) ?? centavosToReaisText(precosNorm?.preco) ?? centavosToReaisText(norm.preco);
  const precoPromocional =
    src.precoPromocional != null && src.precoPromocional !== ""
      ? asText(src.precoPromocional)
      : reaisToNullText(precosRaw?.precoPromocional) ?? centavosToReaisText(precosNorm?.precoPromocional);
  const precoCusto =
    src.precoCusto != null && src.precoCusto !== ""
      ? asText(src.precoCusto)
      : reaisToNullText(precosRaw?.precoCusto) ?? centavosToReaisText(precosNorm?.precoCusto);
  const precoCustoMedio =
    src.precoCustoMedio != null && src.precoCustoMedio !== ""
      ? asText(src.precoCustoMedio)
      : reaisToNullText(precosRaw?.precoCustoMedio) ?? centavosToReaisText(precosNorm?.precoCustoMedio);

  const estoqueRaw =
    src.estoque && typeof src.estoque === "object" ? /** @type {Record<string, unknown>} */ (src.estoque) : null;
  const detNorm =
    norm.estoqueDetalhe && typeof norm.estoqueDetalhe === "object"
      ? /** @type {Record<string, unknown>} */ (norm.estoqueDetalhe)
      : null;

  let estoqueAtual = coerceInt(src.estoqueAtual);
  if (estoqueAtual == null && estoqueRaw?.quantidade != null) {
    estoqueAtual = coerceInt(estoqueRaw.quantidade);
  }
  if (estoqueAtual == null && detNorm?.quantidade != null) {
    estoqueAtual = coerceInt(detNorm.quantidade);
  }
  if (estoqueAtual == null && norm.estoque != null) {
    estoqueAtual = coerceInt(norm.estoque);
  }

  const estoqueMinimo =
    src.estoqueMinimo != null && src.estoqueMinimo !== ""
      ? asText(src.estoqueMinimo)
      : numToNullText(estoqueRaw?.minimo);
  const estoqueMaximo =
    src.estoqueMaximo != null && src.estoqueMaximo !== ""
      ? asText(src.estoqueMaximo)
      : numToNullText(estoqueRaw?.maximo);

  const categoria =
    src.categoria && typeof src.categoria === "object"
      ? /** @type {Record<string, unknown>} */ (src.categoria)
      : null;
  const marcaVal =
    typeof src.marca === "string"
      ? src.marca
      : src.marca && typeof src.marca === "object"
        ? /** @type {Record<string, unknown>} */ (src.marca).nome
        : null;

  const dim =
    src.dimensoes && typeof src.dimensoes === "object"
      ? /** @type {Record<string, unknown>} */ (src.dimensoes)
      : null;
  const emb =
    dim && dim.embalagem && typeof dim.embalagem === "object"
      ? /** @type {Record<string, unknown>} */ (dim.embalagem)
      : null;
  const tributacao =
    src.tributacao && typeof src.tributacao === "object"
      ? /** @type {Record<string, unknown>} */ (src.tributacao)
      : null;

  const fornecedores = Array.isArray(src.fornecedores) ? src.fornecedores : [];
  const f0 =
    fornecedores[0] && typeof fornecedores[0] === "object"
      ? /** @type {Record<string, unknown>} */ (fornecedores[0])
      : null;

  const idFornecedor =
    src.idFornecedor != null && String(src.idFornecedor).trim() !== ""
      ? asText(src.idFornecedor)
      : f0?.id != null
        ? String(f0.id)
        : null;
  const codigoFornecedor =
    src.codigoFornecedor != null && String(src.codigoFornecedor).trim() !== ""
      ? asText(src.codigoFornecedor)
      : toNullText(f0?.codigo);
  const codigoPeloFornecedor =
    src.codigoPeloFornecedor != null && String(src.codigoPeloFornecedor).trim() !== ""
      ? asText(src.codigoPeloFornecedor)
      : toNullText(f0?.codigoProdutoNoFornecedor);

  const skuMapeamento =
    src.skuMapeamento != null && String(src.skuMapeamento).trim() !== ""
      ? asText(src.skuMapeamento)
      : toNullText(src.sku ?? norm.sku);

  let anexosVal = jsonColumnValue(src.anexos);
  if (anexosVal == null && typeof norm.imagem_url === "string" && norm.imagem_url.trim()) {
    anexosVal = cloneJson([{ url: norm.imagem_url.trim(), externo: true }]);
  }

  const arvoreCategoriaVal =
    jsonColumnValue(src.arvoreCategoria) ??
    (categoria && (categoria.id != null || categoria.nome != null) ? cloneJson([categoria]) : null);

  const variacoesVal = jsonColumnValue(src.variacoes);
  const kitVal = jsonColumnValue(src.kit);
  const seoVal = jsonColumnValue(src.seo);

  /** @type {Record<string, unknown>} */
  let seoMerged = {};
  if (seoVal && typeof seoVal === "object" && !Array.isArray(seoVal)) {
    seoMerged = { .../** @type {Record<string, unknown>} */ (seoVal) };
  }
  const slugDefault = buildCatalogSlug(nome, id);
  if (typeof seoMerged.slug !== "string" || !String(seoMerged.slug).trim()) {
    seoMerged.slug = slugDefault;
  } else {
    seoMerged.slug = String(seoMerged.slug).trim();
  }

  const tipoEmbalagem =
    src.tipoEmbalagem != null && String(src.tipoEmbalagem).trim() !== ""
      ? asText(src.tipoEmbalagem)
      : emb?.descricao != null
        ? asText(emb.descricao)
        : emb?.tipo != null
          ? String(emb.tipo)
          : null;

  const alturaEmbalagem =
    src.alturaEmbalagem != null && String(src.alturaEmbalagem).trim() !== ""
      ? asText(src.alturaEmbalagem)
      : numToNullText(dim?.altura);
  const larguraEmbalagem =
    src.larguraEmbalagem != null && String(src.larguraEmbalagem).trim() !== ""
      ? asText(src.larguraEmbalagem)
      : numToNullText(dim?.largura);
  const comprimentoEmbalagem =
    src.comprimentoEmbalagem != null && String(src.comprimentoEmbalagem).trim() !== ""
      ? asText(src.comprimentoEmbalagem)
      : numToNullText(dim?.comprimento);
  const diametroEmbalagem =
    src.diametroEmbalagem != null && String(src.diametroEmbalagem).trim() !== ""
      ? asText(src.diametroEmbalagem)
      : numToNullText(dim?.diametro);

  const pesoLiquido =
    src.pesoLiquido != null && String(src.pesoLiquido).trim() !== ""
      ? asText(src.pesoLiquido)
      : numToNullText(dim?.pesoLiquido);
  const pesoBruto =
    src.pesoBruto != null && String(src.pesoBruto).trim() !== ""
      ? asText(src.pesoBruto)
      : numToNullText(dim?.pesoBruto);

  const localizacao =
    src.localizacao != null && String(src.localizacao).trim() !== ""
      ? asText(src.localizacao)
      : toNullText(estoqueRaw?.localizacao ?? detNorm?.localizacao);

  const gtinEmbalagem =
    src.gtinEmbalagem != null && String(src.gtinEmbalagem).trim() !== ""
      ? asText(src.gtinEmbalagem)
      : toNullText(tributacao?.gtinEmbalagem);

  const sobEncomenda =
    src.sobEncomenda != null && String(src.sobEncomenda).trim() !== ""
      ? asText(src.sobEncomenda)
      : estoqueRaw?.sobEncomenda === true
        ? "true"
        : estoqueRaw?.sobEncomenda === false
          ? "false"
          : null;

  return {
    id,
    idMapeamento: asText(src.idMapeamento ?? src.id_mapeamento),
    skuMapeamento,
    nome,
    codigo: asText(src.codigo),
    unidade: asText(src.unidade ?? norm.unidade),
    preco,
    precoPromocional,
    ncm: asText(src.ncm),
    origem: src.origem != null && String(src.origem).trim() !== "" ? asText(src.origem) : null,
    gtin: asText(src.gtin ?? norm.gtin),
    gtinEmbalagem,
    localizacao,
    pesoLiquido,
    pesoBruto,
    estoqueMinimo,
    estoqueMaximo,
    idFornecedor,
    codigoFornecedor,
    codigoPeloFornecedor,
    unidadePorCaixa: asText(src.unidadePorCaixa),
    estoqueAtual,
    precoCusto,
    precoCustoMedio,
    situacao: asText(src.situacao ?? norm.situacao),
    descricaoComplementar: asText(src.descricaoComplementar),
    obs: asText(src.obs ?? src.observacoes),
    garantia: asText(src.garantia),
    cest: asText(src.cest),
    sobEncomenda,
    marca: marcaVal != null ? asText(marcaVal) : null,
    tipoEmbalagem,
    alturaEmbalagem,
    larguraEmbalagem,
    comprimentoEmbalagem,
    diametroEmbalagem,
    classeProduto: asText(src.classeProduto ?? src.tipo ?? norm.tipo),
    idCategoria:
      src.idCategoria != null && String(src.idCategoria).trim() !== ""
        ? asText(src.idCategoria)
        : categoria?.id != null
          ? String(categoria.id)
          : null,
    descricaoCategoria:
      src.descricaoCategoria != null && String(src.descricaoCategoria).trim() !== ""
        ? asText(src.descricaoCategoria)
        : toNullText(categoria?.nome),
    descricaoArvoreCategoria:
      src.descricaoArvoreCategoria != null && String(src.descricaoArvoreCategoria).trim() !== ""
        ? asText(src.descricaoArvoreCategoria)
        : toNullText(categoria?.caminhoCompleto),
    arvoreCategoria: arvoreCategoriaVal,
    variacoes: variacoesVal,
    anexos: anexosVal,
    seo: seoMerged,
    kit: kitVal,
  };
}

/**
 * Upsert na coluna `id`.
 * @param {{ from: (t: string) => unknown }} supabase cliente admin Supabase
 * @param {string} tableName
 * @param {Record<string, unknown>[]} rows
 * @returns {Promise<{ error: { message?: string } | null }>}
 */
export async function persistProdutoWebhookRows(supabase, tableName, rows) {
  const { error } = await supabase.from(tableName).upsert(rows, {
    onConflict: PRODUTO_WEBHOOK_CONFLICT_COLUMN,
  });
  return { error: error ?? null };
}
