import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PRODUTOS_TABLE } from "@/lib/produtos";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const FAVORITES_TABLE = "favoritos";

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

export async function POST(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const slugs = Array.isArray(body?.slugs) ? body.slugs : [];
    const normalized = [
      ...new Set(
        slugs
          .filter((s) => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];

    if (normalized.length === 0) {
      return NextResponse.json({ ok: true, merged: 0 });
    }

    const supabase = getSupabaseOrThrow();
    let merged = 0;

    for (const slug of normalized) {
      const { data: bySeoRows, error: productError } = await supabase
        .from(PRODUTOS_TABLE)
        .select("id")
        .eq("in_catalog", true)
        .contains("seo", { slug })
        .limit(1);

      if (productError) {
        throw productError;
      }
      const product = (bySeoRows ?? [])[0];
      if (!product?.id) {
        continue;
      }

      const { error: insertError } = await supabase.from(FAVORITES_TABLE).insert({
        usuario_id: userId,
        product_id: product.id,
      });

      if (!insertError) {
        merged += 1;
      } else if (insertError.code === "23505") {
        // ja existia
      } else {
        throw insertError;
      }
    }

    return NextResponse.json({ ok: true, merged });
  } catch (error) {
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para favoritos." },
        { status: 503 },
      );
    }
    console.error("Erro ao mesclar favoritos:", error);
    return NextResponse.json({ error: "Nao foi possivel mesclar favoritos." }, { status: 500 });
  }
}
