import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const FAVORITES_TABLE = "favoritos";
const PRODUCTS_TABLE = "products";

async function getSessionUserId(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return token?.userId ? String(token.userId) : null;
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const error = new Error("Supabase admin nao configurado.");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return supabase;
}

function mapJoinedRow(row) {
  const p = row?.products;
  if (!p || typeof p !== "object") {
    return null;
  }
  const slug = typeof p.slug === "string" ? p.slug.trim() : "";
  if (!slug) {
    return null;
  }
  const nome = p.name ?? p.nome;
  if (typeof nome !== "string" || !nome.trim()) {
    return null;
  }
  const precoRaw = p.price ?? p.preco;
  const preco = Number(precoRaw);
  if (!Number.isFinite(preco) || preco <= 0) {
    return null;
  }
  const imagem_url = p.image_url ?? p.imagem_url ?? "";
  const descricao = String(p.description ?? p.descricao ?? "").trim();
  const stockRaw = p.stock ?? p.estoque;
  const estoque =
    stockRaw === undefined || stockRaw === null ? 0 : Math.max(0, Math.floor(Number(stockRaw)));

  return {
    id: String(p.id ?? slug),
    slug,
    nome: nome.trim(),
    preco,
    imagem_url: typeof imagem_url === "string" ? imagem_url : "",
    descricao,
    estoque: Number.isFinite(estoque) ? estoque : 0,
    product_id: String(row.product_id ?? p.id ?? ""),
  };
}

export async function GET(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const supabase = getSupabaseOrThrow();
    const { data, error } = await supabase
      .from(FAVORITES_TABLE)
      .select("product_id, created_at, products ( id, name, price, image_url, description, slug, stock )")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const favorites = (data ?? []).map(mapJoinedRow).filter(Boolean);
    return NextResponse.json({ favorites });
  } catch (error) {
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para favoritos." },
        { status: 503 },
      );
    }
    console.error("Erro ao listar favoritos:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar favoritos." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
    if (!productId) {
      return NextResponse.json({ error: "productId obrigatorio." }, { status: 400 });
    }

    const supabase = getSupabaseOrThrow();
    const { data: product, error: productError } = await supabase
      .from(PRODUCTS_TABLE)
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      throw productError;
    }
    if (!product?.id) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }

    const { error: insertError } = await supabase.from(FAVORITES_TABLE).insert({
      usuario_id: userId,
      product_id: product.id,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: true, already: true });
      }
      throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para favoritos." },
        { status: 503 },
      );
    }
    console.error("Erro ao adicionar favorito:", error);
    return NextResponse.json({ error: "Nao foi possivel salvar o favorito." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const url = new URL(request.url);
    let pid = url.searchParams.get("productId")?.trim() ?? "";
    if (!pid) {
      const body = await request.json().catch(() => ({}));
      pid = typeof body?.productId === "string" ? body.productId.trim() : "";
    }

    if (!pid) {
      return NextResponse.json({ error: "productId obrigatorio." }, { status: 400 });
    }

    const supabase = getSupabaseOrThrow();
    const { error } = await supabase
      .from(FAVORITES_TABLE)
      .delete()
      .eq("usuario_id", userId)
      .eq("product_id", pid);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para favoritos." },
        { status: 503 },
      );
    }
    console.error("Erro ao remover favorito:", error);
    return NextResponse.json({ error: "Nao foi possivel remover o favorito." }, { status: 500 });
  }
}
