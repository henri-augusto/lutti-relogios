import { createDomainErrorClass } from "@/lib/domain/domain-error";
import { listOlistProducts } from "@/lib/integrations/olist-api";
import { mapNormalizedOlistToProdutosRow, PRODUTOS_TABLE } from "@/lib/domain/produtos";
import { createSupabaseDomainAccess } from "@/lib/integrations/supabase-domain-access";

const DEFAULT_SYNC_PAGE_SIZE = 100;
const DEFAULT_SYNC_MAX_PAGES_PER_RUN = 20;
const MAX_SYNC_PAGES_PER_RUN = 120;

let syncCursorPage = 1;

export const OlistSyncError = createDomainErrorClass("OlistSyncError");

const { getSupabaseOrThrow, rethrowSupabaseError: rethrowProdutosError } = createSupabaseDomainAccess(
  OlistSyncError,
  {
    tableMissing:
      "Tabela 'produto' nao existe no Supabase. Execute o SQL de produtos no editor SQL do projeto.",
    schemaMismatch:
      "A tabela 'produto' existe mas o schema nao bate com o app. Confira `supabase/PRODUTO_create_table.sql` e `supabase/migrations/` no mesmo projeto do NEXT_PUBLIC_SUPABASE_URL.",
  },
);

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
        rethrowProdutosError(error, "Falha ao gravar produtos sincronizados no Supabase.");
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
