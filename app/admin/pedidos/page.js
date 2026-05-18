"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function formatPrice(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(cents) || 0) / 100);
}

function formatDate(iso) {
  if (!iso) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminPedidosPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pedidos?pageSize=50", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao carregar pedidos.");
      }
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  async function handleVerificar() {
    setVerifying(true);
    setVerifyResult(null);
    setError("");
    try {
      const res = await fetch("/api/admin/pedidos/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30, limit: 100 }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao verificar pedidos.");
      }
      setVerifyResult(data.summary);
      await loadPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar pedidos.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/admin" className="text-sm font-medium text-stone-600 hover:text-stone-900">
          ← Voltar ao painel
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-stone-900">Pedidos</h1>

        <p className="mt-2 text-sm text-stone-600">
          Confira pedidos pagos gravados no banco e sincronize com o Stripe sessoes que o webhook nao
          registrou.
        </p>

        <PedidosActions verifying={verifying} onVerificar={handleVerificar} />

        {verifyResult ? (
          <VerifySummary summary={verifyResult} />
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6">
          <PedidosTable items={items} loading={loading} total={total} />
        </div>
      </section>
    </main>
  );
}

function PedidosActions({ verifying, onVerificar }) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onVerificar}
        disabled={verifying}
        className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifying ? "Verificando no Stripe..." : "Verificar pedidos"}
      </button>
    </div>
  );
}

function VerifySummary({ summary }) {
  return (
    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
      <p className="font-medium">Verificacao concluida</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-emerald-900/90">
        <li>Sessoes analisadas no Stripe: {summary.scanned}</li>
        <li>Pagas: {summary.paid}</li>
        <li>Ja no banco: {summary.alreadyInDb}</li>
        <li>Novos gravados: {summary.inserted}</li>
        {summary.skipped?.length > 0 ? <li>Ignoradas: {summary.skipped.length}</li> : null}
        {summary.errors?.length > 0 ? (
          <li className="text-red-800">Erros: {summary.errors.length}</li>
        ) : null}
      </ul>
    </div>
  );
}

function PedidosTable({ items, loading, total }) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-900">Pedidos ({total})</h2>
        {loading ? <span className="text-sm text-stone-500">Carregando...</span> : null}
      </div>

      {!loading && items.length === 0 ? (
        <p className="text-sm text-stone-600">Nenhum pedido encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-3 py-2.5 font-medium">Data</th>
                <th className="px-3 py-2.5 font-medium">Produto</th>
                <th className="px-3 py-2.5 font-medium">Qtd</th>
                <th className="px-3 py-2.5 font-medium">Total</th>
                <th className="px-3 py-2.5 font-medium">E-mail</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white text-stone-800">
              {items.map((item) => (
                <tr key={item.id ?? item.stripeCheckoutSessionId}>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatDate(item.createdAt)}</td>
                  <td className="max-w-[200px] truncate px-3 py-2.5" title={item.nomeProduto}>
                    {item.nomeProduto || "—"}
                  </td>
                  <td className="px-3 py-2.5">{item.quantidade ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatPrice(item.precoTotalCentavos)}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2.5" title={item.emailCliente || ""}>
                    {item.emailCliente || "—"}
                  </td>
                  <td className="px-3 py-2.5 capitalize">{item.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
