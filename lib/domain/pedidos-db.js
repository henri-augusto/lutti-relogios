<<<<<<< HEAD:lib/pedidos-db.js
import { resolveUsuarioIdForPaidSession } from "@/lib/checkout-usuario";
import { runPedidoIntegrations } from "@/lib/pedido-pos-pagamento";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
=======
import { getSupabaseAdmin } from "@/lib/integrations/supabase-admin";
>>>>>>> main:lib/domain/pedidos-db.js

/**
 * Persiste pedido após pagamento confirmado no Checkout.
 * Idempotente: mesmo session.id não duplica (constraint unique).
 *
 * @param {object} session Objeto Checkout Session do Stripe (event.data.object)
 * @returns {Promise<{ ok: true, inserted: boolean } | { ok: false, reason: string }>}
 */
export async function persistPedidoPagoFromCheckoutSession(session) {
  if (!session?.id) {
    return { ok: false, reason: "session_invalid" };
  }

  if (session.mode !== "payment") {
    return { ok: false, reason: "not_payment_mode" };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }

  const amountTotal = session.amount_total;
  if (typeof amountTotal !== "number" || amountTotal <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase admin nao configurado (NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const email =
    session.customer_details?.email?.trim() ||
    (typeof session.customer_email === "string" ? session.customer_email.trim() : "") ||
    null;

  const meta = session.metadata || {};
  const nomeProduto =
    (typeof meta.produto_nome === "string" && meta.produto_nome.trim()) ||
    "Produto";

  const qtyRaw = meta.quantidade;
  const quantidade = (() => {
    const n = typeof qtyRaw === "string" ? Number.parseInt(qtyRaw, 10) : Number(qtyRaw);
    if (!Number.isFinite(n) || n < 1) {
      return 1;
    }
    return Math.min(99999, Math.floor(n));
  })();

  const pi = session.payment_intent;
  const stripePaymentIntentId = typeof pi === "string" ? pi : pi?.id ?? null;

  let usuarioId = null;
  try {
    usuarioId = await resolveUsuarioIdForPaidSession(session);
  } catch (err) {
    console.error("[pedidos] Falha ao resolver usuario (pedido seguira sem usuario_id):", err?.message || err);
  }

  const row = {
    stripe_checkout_session_id: session.id,
    nome_produto: nomeProduto.slice(0, 500),
    preco_total_centavos: amountTotal,
    quantidade,
    email_cliente: email,
    status: "pago",
    stripe_payment_intent_id: stripePaymentIntentId,
    ...(usuarioId ? { usuario_id: usuarioId } : {}),
  };

  const { error } = await supabase.from("pedidos").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: true, inserted: false };
    }
    throw error;
  }

  const slugMeta = typeof meta.produto_slug === "string" ? meta.produto_slug.trim() : "";
  const isMultiCart = meta.multi_cart === "1";

  if (slugMeta && !isMultiCart) {
    const { data: baixou, error: rpcError } = await supabase.rpc("baixar_estoque_produto", {
      p_slug: slugMeta,
      p_quantidade: quantidade,
    });

    if (rpcError) {
      if (rpcError.code === "42883" || rpcError.message?.includes("does not exist")) {
        console.warn(
          "[pedidos] RPC baixar_estoque_produto ausente — execute supabase/estoque.sql no Supabase.",
        );
      } else {
        console.error("[pedidos] Erro ao baixar estoque:", rpcError);
      }
    } else if (baixou === false) {
      console.error(
        "[pedidos] Estoque insuficiente apos pagamento — revisar pedido e estoque manualmente.",
        session.id,
        slugMeta,
        quantidade,
      );
    }
  } else if (isMultiCart && slugMeta) {
    console.warn(
      "[pedidos] Carrinho multi-item: baixa de estoque via RPC nao aplicada automaticamente (revisar estoque).",
      session.id,
    );
  }

  try {
    await runPedidoIntegrations({ session, pedidoRow: row });
  } catch (err) {
    console.error("[pedidos] Integracao pos-pagamento (ignorada):", err?.message || err);
  }

  return { ok: true, inserted: true };
}
