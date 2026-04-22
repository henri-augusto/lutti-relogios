import { createClient } from "@supabase/supabase-js";

const PRODUCTS_TABLE = "products";

export class ProductsFetchError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "ProductsFetchError";
    if (opts.cause !== undefined) {
      this.cause = opts.cause;
    }
  }
}

/**
 * Cliente Supabase para leitura do catálogo (somente servidor).
 * Prefira NEXT_PUBLIC_SUPABASE_ANON_KEY + RLS; em último caso usa SERVICE_ROLE_KEY.
 */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const key = anon || publishable || service;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Mapeia linha da tabela `products` (ou aliases em PT) para o modelo usado na UI.
 */
function mapProductRow(row) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const slug = row.slug;
  if (typeof slug !== "string" || !slug.trim()) {
    return null;
  }

  const nome = row.name ?? row.nome;
  if (typeof nome !== "string" || !nome.trim()) {
    return null;
  }

  const precoRaw = row.price ?? row.preco;
  const preco = Number(precoRaw);
  if (!Number.isFinite(preco) || preco <= 0) {
    return null;
  }

  const imagem_url = row.image_url ?? row.imagem_url;
  if (typeof imagem_url !== "string" || !imagem_url.trim()) {
    return null;
  }
  const imagemUrlNormalizada = imagem_url.trim();
  const imagemEhRelativa = imagemUrlNormalizada.startsWith("/");
  let imagemEhUrlValida = false;

  if (!imagemEhRelativa) {
    try {
      const parsedUrl = new URL(imagemUrlNormalizada);
      imagemEhUrlValida = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      imagemEhUrlValida = false;
    }
  }

  if (!imagemEhRelativa && !imagemEhUrlValida) {
    return null;
  }

  const descricao = String(row.description ?? row.descricao ?? "").trim() || "Sem descricao.";

  const stockRaw = row.stock ?? row.estoque;
  const estoque =
    stockRaw === undefined || stockRaw === null
      ? 0
      : Math.max(0, Math.floor(Number(stockRaw)));

  return {
    id: String(row.id ?? slug),
    nome: nome.trim(),
    preco,
    estoque: Number.isFinite(estoque) ? estoque : 0,
    imagem_url: imagemUrlNormalizada,
    descricao,
    slug: slug.trim(),
  };
}

export async function getProdutos() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ProductsFetchError(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY no servidor) no .env.local.",
    );
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select("id, name, price, image_url, description, slug, stock")
    .order("name", { ascending: true });

  if (error) {
    throw new ProductsFetchError("Nao foi possivel carregar os produtos.", { cause: error });
  }

  return (data ?? []).map(mapProductRow).filter(Boolean);
}

export async function getProdutoBySlug(slug) {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ProductsFetchError(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY no servidor) no .env.local.",
    );
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select("id, name, price, image_url, description, slug, stock")
    .eq("slug", slug.trim())
    .maybeSingle();

  if (error) {
    throw new ProductsFetchError("Nao foi possivel carregar o produto.", { cause: error });
  }

  return mapProductRow(data);
}

export async function getProdutosDestaque(limit = 3) {
  const produtos = await getProdutos();
  return produtos.slice(0, Math.max(0, limit));
}
