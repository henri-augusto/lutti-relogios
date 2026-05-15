/**
 * Integracoes pos-pagamento (ex.: Olist/Tiny pedidos, CRM).
 * Hoje o projeto so integra Olist para catalogo de produtos — nao ha envio de pedido.
 * Mantenha este gancho em try/catch para nunca quebrar o webhook Stripe.
 *
 * @param {object} params
 * @param {object} params.session Checkout Session Stripe (event.data.object)
 * @param {object} params.pedidoRow Linha inserida ou equivalente (campos usados no futuro)
 */
export async function runPedidoIntegrations(params) {
  try {
    void params;
    // Reservado: ex. syncPedidoTiny(session, pedidoRow). Olist no repositorio cobre apenas catalogo de produtos.
  } catch (err) {
    console.error("[pedido-pos-pagamento] Erro (ignorado para o checkout):", err?.message || err);
  }
}
