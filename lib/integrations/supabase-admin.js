import { createClient } from "@supabase/supabase-js";
import { getFirstRuntimeEnv } from "@/lib/integrations/env";

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
  const url = getFirstRuntimeEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
  const serviceRoleKey = getFirstRuntimeEnv(["SUPABASE_SERVICE_ROLE_KEY"]);
  const secretKey = getFirstRuntimeEnv(["SUPABASE_SECRET_KEY"]);
  const key = serviceRoleKey || secretKey;

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
