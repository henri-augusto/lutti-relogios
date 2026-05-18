import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { mapProdutosRowToCatalog, PRODUTOS_TABLE } from "@/lib/produtos";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const FAVORITES_TABLE = "favoritos";

/** Corpo `/api/favorites`: `product.id` na vitrina é o `id` Tiny/Olist; FK em `favoritos.product_id` aponta para `produto.id_supabase` ou `produto.id`. */
async function lookupProdutoRowPk(supabase, productId) {
  const trimmed = productId.trim();
  const { data, error } = await supabase
    .from(PRODUTOS_TABLE)
    .select("id, id_supabase")
    .eq("id", trimmed)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

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
  const p = row?.produto ?? row?.produtos;
  if (!p || typeof p !== "object") {
    return null;
  }
  const catalog = mapProdutosRowToCatalog(p);
  if (!catalog) {
    return null;
  }

  return {
    ...catalog,
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
      .select(
        `product_id, created_at, produto ( id, id_supabase, nome, descricaoComplementar, preco, estoqueAtual, anexos, seo, marca )`,
      )
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
    const product = await lookupProdutoRowPk(supabase, productId);
    const productPk = product.id_supabase ?? product.id;
    if (!productPk) {
      return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });
    }

    const { error: insertError } = await supabase.from(FAVORITES_TABLE).insert({
      usuario_id: userId,
      product_id: productPk,
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
