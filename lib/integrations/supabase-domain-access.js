import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";
import { isMissingTableError, isSchemaMismatchError } from "@/lib/integrations/supabase-errors";

/**
 * Acesso Supabase admin com erros tipados por domínio (tabela ausente, schema, etc.).
 * @param {new (message: string, opts?: { status?: number, cause?: unknown }) => Error} DomainErrorClass
 * @param {{ notConfigured?: string, tableMissing?: string, schemaMismatch?: string }} [messages]
 */
export function createSupabaseDomainAccess(DomainErrorClass, messages = {}) {
  const {
    notConfigured = "Supabase admin nao configurado.",
    tableMissing,
    schemaMismatch,
  } = messages;

  function getSupabaseOrThrow() {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new DomainErrorClass(notConfigured, { status: 503 });
    }
    return supabase;
  }

  function throwTableMissing() {
    throw new DomainErrorClass(tableMissing || notConfigured, { status: 503 });
  }

  function throwSchemaMismatch() {
    throw new DomainErrorClass(schemaMismatch || notConfigured, { status: 503 });
  }

  /**
   * @param {unknown} error
   * @param {string} fallbackMessage
   * @param {{ includeSchema?: boolean }} [opts]
   */
  function rethrowSupabaseError(error, fallbackMessage, opts = { includeSchema: true }) {
    if (isMissingTableError(error)) {
      throwTableMissing();
    }
    if (opts.includeSchema !== false && schemaMismatch && isSchemaMismatchError(error)) {
      throwSchemaMismatch();
    }
    throw new DomainErrorClass(fallbackMessage, { status: 500, cause: error });
  }

  return {
    getSupabaseOrThrow,
    throwTableMissing,
    throwSchemaMismatch,
    rethrowSupabaseError,
  };
}
