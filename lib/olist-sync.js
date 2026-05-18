import { listOlistProducts } from "@/lib/olist-api";
import { mapNormalizedOlistToProdutosRow, PRODUTOS_TABLE } from "@/lib/produtos";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isMissingTableError, isSchemaMismatchError } from "@/lib/supabase-errors";

const DEFAULT_SYNC_PAGE_SIZE = 100;
const DEFAULT_SYNC_MAX_PAGES_PER_RUN = 20;
const MAX_SYNC_PAGES_PER_RUN = 120;

let syncCursorPage = 1;

export class OlistSyncError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "OlistSyncError";
    if (opts.status !== undefined) {
      this.status = opts.status;
    }
    if (opts.cause !== undefined) {
      this.cause = opts.cause;
    }
  }
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new OlistSyncError("Supabase admin nao configurado.", { status: 503 });
  }
  return supabase;
}

function normalizePositiveInt(value, fallback, max) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export async function syncOlistProductsToLocal({ maxPagesPerRun } = {}) {
  const supabase = getSupabaseOrThrow();
  const pagesToProcess = normalizePositiveInt(
    maxPagesPerRun || process.env.OLIST_SYNC_MAX_PAGES_PER_RUN,
    DEFAULT_SYNC_MAX_PAGES_PER_RUN,
    MAX_SYNC_PAGES_PER_RUN,
  );
  const startedPage = syncCursorPage;

  let currentPage = startedPage;
  let processed = 0;
  let pages = 0;
  let hasNext = true;

  while (hasNext && pages < pagesToProcess) {
    const result = await listOlistProducts({
      page: currentPage,
      pageSize: DEFAULT_SYNC_PAGE_SIZE,
    });

    const rows = (result.items || []).map((item) => mapNormalizedOlistToProdutosRow(item)).filter(Boolean);
    if (rows.length > 0) {
      const { error } = await supabase.from(PRODUTOS_TABLE).upsert(rows, { onConflict: "id" });
      if (error) {
        if (isMissingTableError(error)) {
          throw new OlistSyncError(
            "Tabela 'produtos' nao existe no Supabase. Execute o SQL de produtos no editor SQL do projeto.",
            { status: 503 },
          );
        }
        if (isSchemaMismatchError(error)) {
          throw new OlistSyncError(
            "A tabela 'produtos' existe mas o schema nao bate com o app. Rode `produtos.sql` no mesmo projeto do NEXT_PUBLIC_SUPABASE_URL.",
            { status: 503 },
          );
        }
        throw new OlistSyncError("Falha ao gravar produtos sincronizados no Supabase.", {
          status: 500,
          cause: error,
        });
      }
    }

    processed += rows.length;
    pages += 1;
    hasNext = Boolean(result.hasNext);
    currentPage += 1;
  }

  syncCursorPage = hasNext ? currentPage : 1;

  return {
    processed,
    pages,
    startedPage,
    nextPage: syncCursorPage,
    hasMorePending: hasNext,
    pageSize: DEFAULT_SYNC_PAGE_SIZE,
  };
}
