import { NextResponse } from "next/server";
<<<<<<< HEAD
import { getToken } from "next-auth/jwt";
import { normalizeCep } from "@/lib/auth-users";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
=======
import { jsonSupabaseNotConfigured } from "@/lib/api/api-route";
import { normalizeCep } from "@/lib/domain/auth-users";
import { getSessionUserId } from "@/lib/api/session-user";
import { requireSupabaseAdmin } from "@/lib/integrations/supabase-admin";
import { isValidCepDigits } from "@/lib/api/validators";
>>>>>>> main

const USER_TABLE = "usuarios";
const EDITABLE_FIELDS = [
  "full_name",
  "phone",
  "document",
  "cep",
  "street",
  "number",
  "complement",
  "neighborhood",
  "city",
  "state",
];

function trimValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

<<<<<<< HEAD
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
>>>>>>> main
export async function GET(request) {
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
    const { data, error } = await supabase
      .from(USER_TABLE)
      .select(
        "id, email, full_name, phone, document, cep, street, number, complement, neighborhood, city, state, created_at",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
<<<<<<< HEAD
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para perfil." },
        { status: 503 },
      );
=======
    const supabaseResponse = jsonSupabaseNotConfigured(
      error,
      "Configuracao do servidor incompleta para perfil.",
    );
    if (supabaseResponse) {
      return supabaseResponse;
>>>>>>> main
    }

    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: "Nao foi possivel carregar o perfil." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const payload = {
      full_name: trimValue(body?.full_name),
      phone: trimValue(body?.phone),
      document: trimValue(body?.document),
      cep: normalizeCep(body?.cep ?? ""),
      street: trimValue(body?.street),
      number: trimValue(body?.number),
      complement: trimValue(body?.complement),
      neighborhood: trimValue(body?.neighborhood),
      city: trimValue(body?.city),
      state: trimValue(body?.state),
    };

    if (!payload.full_name || !payload.cep || !payload.street || !payload.number) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatorios: nome, CEP, rua e numero." },
        { status: 400 },
      );
    }

<<<<<<< HEAD
    if (payload.cep.length !== 8) {
=======
    if (!isValidCepDigits(payload.cep)) {
>>>>>>> main
      return NextResponse.json({ error: "CEP invalido." }, { status: 400 });
    }

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => EDITABLE_FIELDS.includes(key)),
    );

<<<<<<< HEAD
    const supabase = getSupabaseOrThrow();
=======
    const supabase = requireSupabaseAdmin();
>>>>>>> main
    const { data, error } = await supabase
      .from(USER_TABLE)
      .update(sanitizedPayload)
      .eq("id", userId)
      .select(
        "id, email, full_name, phone, document, cep, street, number, complement, neighborhood, city, state, created_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (error) {
<<<<<<< HEAD
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para editar perfil." },
        { status: 503 },
      );
=======
    const supabaseResponse = jsonSupabaseNotConfigured(
      error,
      "Configuracao do servidor incompleta para editar perfil.",
    );
    if (supabaseResponse) {
      return supabaseResponse;
>>>>>>> main
    }

    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Nao foi possivel salvar o perfil." }, { status: 500 });
  }
}
