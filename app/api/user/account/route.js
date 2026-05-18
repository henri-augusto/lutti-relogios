import { NextResponse } from "next/server";
import { jsonSupabaseNotConfigured } from "@/lib/api/api-route";
import { getSessionUserId } from "@/lib/api/session-user";
import { requireSupabaseAdmin } from "@/lib/integrations/supabase-admin";

const USER_TABLE = "usuarios";

export async function DELETE(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const supabase = requireSupabaseAdmin();
    const { error } = await supabase.from(USER_TABLE).delete().eq("id", userId);
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const supabaseResponse = jsonSupabaseNotConfigured(
      error,
      "Configuracao do servidor incompleta para encerrar conta.",
    );
    if (supabaseResponse) {
      return supabaseResponse;
    }

    console.error("Erro ao encerrar conta:", error);
    return NextResponse.json({ error: "Nao foi possivel encerrar a conta." }, { status: 500 });
  }
}
