import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isMissingTableError } from "@/lib/supabase-errors";
import { persistPedidoPagoFromCheckoutSession } from "@/lib/pedidos-db";
import { getStripe } from "@/lib/stripe";

export class AdminPedidosError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = "AdminPedidosError";
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
    throw new AdminPedidosError("Supabase admin nao configurado.", { status: 503 });
  }
  return supabase;
}

function throwPedidosTableMissing() {
  throw new AdminPedidosError(
    "Tabela 'pedidos' nao existe no Supabase. Crie a tabela antes de usar esta funcao.",
    { status: 503 },
  );
}

/**
 * @param {unknown} row
 */
function mapPedidoRow(row) {
  return {
    id: row.id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    nomeProduto: row.nome_produto,
    precoTotalCentavos: row.preco_total_centavos,
    quantidade: row.quantidade,
    emailCliente: row.email_cliente,
    status: row.status,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
  };
}

/**
 * Lista pedidos gravados no Supabase (mais recentes primeiro).
 */
export async function listAdminPedidos({ page = 1, pageSize = 50 } = {}) {
  const supabase = getSupabaseOrThrow();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(100, Math.floor(pageSize)) : 50;
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, error, count } = await supabase
    .from("pedidos")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    if (isMissingTableError(error)) {
      throwPedidosTableMissing();
    }
    throw new AdminPedidosError("Nao foi possivel listar pedidos.", { status: 500, cause: error });
  }

  return {
    items: (data || []).map(mapPedidoRow),
    page: safePage,
    pageSize: safePageSize,
    total: count ?? 0,
  };
}

/**
 * Reconcilia sessoes pagas do Stripe Checkout com a tabela `pedidos`.
 * Util quando o webhook falhou ou nao estava configurado.
 *
 * @param {{ days?: number, limit?: number }} [opts]
 */
export async function verificarPedidosStripe({ days = 30, limit = 100 } = {}) {
  const supabase = getSupabaseOrThrow();
  const stripe = getStripe();

  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(90, Math.floor(days)) : 30;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(200, Math.floor(limit)) : 100;
  const createdGte = Math.floor(Date.now() / 1000) - safeDays * 24 * 60 * 60;

  /** @type {import("stripe").Stripe.Checkout.Session[]} */
  const collected = [];
  let startingAfter;

  while (collected.length < safeLimit) {
    const pageSize = Math.min(100, safeLimit - collected.length);
    const page = await stripe.checkout.sessions.list({
      limit: pageSize,
      created: { gte: createdGte },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    collected.push(...page.data);
    if (!page.has_more || page.data.length === 0) {
      break;
    }
    startingAfter = page.data[page.data.length - 1].id;
  }

  const paidSessions = collected.filter(
    (session) => session.mode === "payment" && session.payment_status === "paid",
  );

  const sessionIds = paidSessions.map((session) => session.id);
  /** @type {Set<string>} */
  const existingIds = new Set();

  if (sessionIds.length > 0) {
    const { data: existing, error } = await supabase
      .from("pedidos")
      .select("stripe_checkout_session_id")
      .in("stripe_checkout_session_id", sessionIds);

    if (error) {
      if (isMissingTableError(error)) {
        throwPedidosTableMissing();
      }
      throw new AdminPedidosError("Nao foi possivel consultar pedidos existentes.", {
        status: 500,
        cause: error,
      });
    }

    for (const row of existing || []) {
      if (row?.stripe_checkout_session_id) {
        existingIds.add(row.stripe_checkout_session_id);
      }
    }
  }

  const summary = {
    scanned: collected.length,
    paid: paidSessions.length,
    alreadyInDb: 0,
    inserted: 0,
    skipped: [],
    errors: [],
  };

  for (const session of paidSessions) {
    if (existingIds.has(session.id)) {
      summary.alreadyInDb += 1;
      continue;
    }

    try {
      const full = await stripe.checkout.sessions.retrieve(session.id);
      const result = await persistPedidoPagoFromCheckoutSession(full);

      if (result.ok && result.inserted) {
        summary.inserted += 1;
        existingIds.add(session.id);
        continue;
      }

      if (result.ok && !result.inserted) {
        summary.alreadyInDb += 1;
        existingIds.add(session.id);
        continue;
      }

      summary.skipped.push({
        sessionId: session.id,
        reason: result.reason || "unknown",
      });
    } catch (err) {
      summary.errors.push({
        sessionId: session.id,
        message: err instanceof Error ? err.message : "Erro desconhecido.",
      });
    }
  }

  return summary;
}
