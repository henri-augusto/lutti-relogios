import { createClient } from "@supabase/supabase-js";

let adminClient;

/**
 * Cliente Supabase com SERVICE ROLE — apenas em rotas de API / servidor.
 * Necessário para o webhook gravar pedidos (RLS costuma bloquear anon).
 *
 * Prioridade de chave:
 * 1) SUPABASE_SERVICE_ROLE_KEY (recomendado para operacoes server-only)
 * 2) SUPABASE_SECRET_KEY
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  const key = serviceRoleKey || secretKey;
  const keySource = serviceRoleKey
    ? "service_role"
    : secretKey
      ? "secret"
      : "none";
  // #region agent log
  fetch("http://127.0.0.1:7573/ingest/65feb5ce-7cf6-40ef-b7df-7e3cf80f3de2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5e0082" },
    body: JSON.stringify({
      sessionId: "5e0082",
      runId: "register-debug-1",
      hypothesisId: "H1_H2",
      location: "lib/supabase-admin.js:getSupabaseAdmin",
      message: "Supabase env presence check",
      data: {
        hasUrl: Boolean(url),
        hasServiceRoleKey: Boolean(serviceRoleKey),
        hasSecretKey: Boolean(secretKey),
        selectedKeySource: keySource,
        urlLooksSupabaseHost: Boolean(url && url.includes(".supabase.co")),
        selectedKeyLength: key?.length ?? 0,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!url || !key) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}

/**
 * Retorna cliente Supabase admin ou lança erro com code SUPABASE_NOT_CONFIGURED.
 */
export function requireSupabaseAdmin() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const error = new Error("Supabase admin nao configurado.");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return supabase;
}
