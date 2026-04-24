import { NextResponse } from "next/server";
import { createUser, normalizeCep } from "@/lib/auth-users";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongEnoughPassword(value) {
  return typeof value === "string" && value.length >= 6;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const payload = {
      email: body?.email ?? "",
      password: body?.password ?? "",
      fullName: body?.fullName ?? "",
      phone: body?.phone ?? "",
      document: body?.document ?? "",
      cep: body?.cep ?? "",
      street: body?.street ?? "",
      number: body?.number ?? "",
      complement: body?.complement ?? "",
      neighborhood: body?.neighborhood ?? "",
      city: body?.city ?? "",
      state: body?.state ?? "",
    };
    // #region agent log
    fetch("http://127.0.0.1:7573/ingest/65feb5ce-7cf6-40ef-b7df-7e3cf80f3de2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5e0082" },
      body: JSON.stringify({
        sessionId: "5e0082",
        runId: "register-debug-1",
        hypothesisId: "H3",
        location: "app/api/auth/register/route.js:POST",
        message: "Register payload shape",
        data: {
          hasEmail: Boolean(payload.email),
          hasPassword: Boolean(payload.password),
          hasFullName: Boolean(payload.fullName),
          normalizedCepLength: normalizeCep(payload.cep).length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!payload.email || !payload.password || !payload.fullName || !payload.cep) {
      return NextResponse.json({ error: "Preencha os campos obrigatorios." }, { status: 400 });
    }

    if (!isEmail(payload.email)) {
      return NextResponse.json({ error: "Email invalido." }, { status: 400 });
    }

    if (!isStrongEnoughPassword(payload.password)) {
      return NextResponse.json({ error: "A senha deve ter no minimo 6 caracteres." }, { status: 400 });
    }

    const normalizedCep = normalizeCep(payload.cep);
    if (normalizedCep.length !== 8) {
      return NextResponse.json({ error: "CEP invalido." }, { status: 400 });
    }

    await createUser({ ...payload, cep: normalizedCep });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7573/ingest/65feb5ce-7cf6-40ef-b7df-7e3cf80f3de2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5e0082" },
      body: JSON.stringify({
        sessionId: "5e0082",
        runId: "register-debug-1",
        hypothesisId: "H1_H2_H4_H5",
        location: "app/api/auth/register/route.js:catch",
        message: "Register route caught error",
        data: {
          errorCode: error?.code ?? null,
          errorName: error?.name ?? null,
          hasErrorMessage: Boolean(error?.message),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (error?.code === "USER_EXISTS") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error?.code === "SUPABASE_NOT_CONFIGURED") {
      return NextResponse.json(
        console.log(error),
        { error: "Configuracao do servidor incompleta para cadastro." },
        { status: 503 },
      );
    }

    if (error?.code === "42501") {
      return NextResponse.json(
        {
          error:
            "Sem permissao para cadastrar usuario no banco. Configure SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) no servidor.",
        },
        { status: 503 },
      );
    }

    console.error("Erro ao cadastrar usuario:", error);
    return NextResponse.json({ error: "Nao foi possivel concluir o cadastro." }, { status: 500 });
  }
}
