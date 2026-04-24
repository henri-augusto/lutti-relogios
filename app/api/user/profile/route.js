import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeCep } from "@/lib/auth-users";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

export async function GET(request) {
  try {
    const userId = await getSessionUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }

    const supabase = getSupabaseOrThrow();
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
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para perfil." },
        { status: 503 },
      );
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

    if (payload.cep.length !== 8) {
      return NextResponse.json({ error: "CEP invalido." }, { status: 400 });
    }

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([key]) => EDITABLE_FIELDS.includes(key)),
    );

    const supabase = getSupabaseOrThrow();
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
    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Configuracao do servidor incompleta para editar perfil." },
        { status: 503 },
      );
    }

    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Nao foi possivel salvar o perfil." }, { status: 500 });
  }
}
