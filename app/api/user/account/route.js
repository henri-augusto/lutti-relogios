import { NextResponse } from "next/server";
<<<<<<< HEAD
import { getToken } from "next-auth/jwt";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const USER_TABLE = "usuarios";

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

=======
import { jsonSupabaseNotConfigured } from "@/lib/api/api-route";
import { getSessionUserId } from "@/lib/api/session-user";
import { requireSupabaseAdmin } from "@/lib/integrations/supabase-admin";

const USER_TABLE = "usuarios";

>>>>>>> main
export async function DELETE(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

<<<<<<< HEAD
    const supabase = getSupabaseOrThrow();
=======
    const supabase = requireSupabaseAdmin();
>>>>>>> main
    const { error } = await supabase.from(USER_TABLE).delete().eq("id", userId);
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
<<<<<<< HEAD
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para encerrar conta." },
        { status: 503 },
      );
=======
    const supabaseResponse = jsonSupabaseNotConfigured(
      error,
      "Configuracao do servidor incompleta para encerrar conta.",
    );
    if (supabaseResponse) {
      return supabaseResponse;
>>>>>>> main
    }

    console.error("Erro ao encerrar conta:", error);
    return NextResponse.json({ error: "Nao foi possivel encerrar a conta." }, { status: 500 });
  }
}
