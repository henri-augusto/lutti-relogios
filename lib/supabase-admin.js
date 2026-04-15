import { createClient } from "@supabase/supabase-js";

let adminClient;

/**
 * Cliente Supabase com SERVICE ROLE — apenas em rotas de API / servidor.
 * Necessário para o webhook gravar pedidos (RLS costuma bloquear anon).
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

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
