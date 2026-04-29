"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;
const MAX_HIGHLIGHTS = 3;

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(priceInCents) || 0) / 100);
}

function ProductDetailsModal({ product, loading, error, onClose }) {
  if (!product && !loading && !error) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">Detalhes do produto</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
          >
            Fechar
          </button>
        </div>

        {loading ? <p className="text-sm text-stone-600">Carregando...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {product ? (
          <div className="space-y-4 text-sm text-stone-700">
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-stone-900">ID:</span> {product.id}
              </p>
              {product.sku ? (
                <p>
                  <span className="font-semibold text-stone-900">SKU:</span> {product.sku}
                </p>
              ) : null}
              <p>
                <span className="font-semibold text-stone-900">Situacao:</span> {product.situacao}
              </p>
              <p>
                <span className="font-semibold text-stone-900">Preco:</span> {formatPrice(product.preco)}
              </p>
              <p>
                <span className="font-semibold text-stone-900">Estoque:</span> {product.estoque}
              </p>
            </div>

            <div>
              <p className="font-semibold text-stone-900">Descricao</p>
              <p className="mt-1">{product.descricao}</p>
            </div>

            {product.imagem_url ? (
              <div>
                <p className="mb-2 font-semibold text-stone-900">Imagem</p>
                <img
                  src={product.imagem_url}
                  alt={product.descricao}
                  className="max-h-64 w-full rounded-lg border border-stone-200 object-contain"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminProdutosPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [totalEstimated, setTotalEstimated] = useState(null);
  const [selectedById, setSelectedById] = useState({});
  const [savingHighlights, setSavingHighlights] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function loadFeaturedSelection() {
      try {
        const res = await fetch("/api/featured-products", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Falha ao carregar destaques salvos.");
        }
        if (!cancelled) {
          const next = {};
          for (const item of data?.items || []) {
            const idKey = String(item.id ?? "");
            if (!idKey) continue;
            next[idKey] = {
              id: item.id,
              descricao: item.descricao,
              preco: item.preco,
              estoque: item.estoque,
              imagem_url: item.imagem_url,
            };
          }
          setSelectedById(next);
        }
      } catch {
        if (!cancelled) {
          setSaveFeedback("Nao foi possivel carregar os destaques salvos.");
        }
      }
    }

    loadFeaturedSelection();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoadingList(true);
      setListError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }
        const res = await fetch(`/api/olist/produtos?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar produtos.");
        }
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setHasNext(Boolean(data?.hasNext));
          setTotalEstimated(Number.isFinite(data?.totalEstimated) ? data.totalEstimated : null);
        }
      } catch (error) {
        if (!cancelled) {
          setListError(error?.message || "Erro ao carregar produtos.");
          setItems([]);
          setHasNext(false);
          setTotalEstimated(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedQuery]);

  const selectedItems = useMemo(() => Object.values(selectedById), [selectedById]);
  const selectedCount = selectedItems.length;

  function toggleSelection(item) {
    const idKey = String(item.id ?? "");
    if (!idKey) return;

    setSaveFeedback("");
    setSelectedById((prev) => {
      if (prev[idKey]) {
        const next = { ...prev };
        delete next[idKey];
        return next;
      }

      if (Object.keys(prev).length >= MAX_HIGHLIGHTS) {
        setSaveFeedback(`Permitido selecionar apenas ${MAX_HIGHLIGHTS} produtos para destaque.`);
        return prev;
      }

      return {
        ...prev,
        [idKey]: {
          id: item.id,
          descricao: item.descricao,
          preco: item.preco,
          estoque: item.estoque,
          imagem_url: item.imagem_url,
        },
      };
    });
  }

  async function handleSaveHighlights() {
    setSaveFeedback("");
    setSavingHighlights(true);
    try {
      const res = await fetch("/api/featured-products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao salvar destaques.");
      }
      setSaveFeedback("Destaques salvos com sucesso.");
      const next = {};
      for (const item of data?.items || []) {
        const idKey = String(item.id ?? "");
        if (!idKey) continue;
        next[idKey] = {
          id: item.id,
          descricao: item.descricao,
          preco: item.preco,
          estoque: item.estoque,
          imagem_url: item.imagem_url,
        };
      }
      setSelectedById(next);
    } catch (error) {
      setSaveFeedback(error?.message || "Falha ao salvar destaques.");
    } finally {
      setSavingHighlights(false);
    }
  }

  async function openModalById(productId) {
    setModalLoading(true);
    setModalError("");
    setModalItem(null);
    try {
      const res = await fetch(`/api/olist/produtos/${encodeURIComponent(productId)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao carregar detalhes.");
      }
      setModalItem(data?.item || null);
    } catch (error) {
      setModalError(error?.message || "Falha ao carregar detalhes.");
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900">Admin - Produtos Olist</h1>
        <p className="mt-2 text-sm text-stone-600">
          Lista de produtos ativos com descricao iniciando em relogio.
        </p>
      </div>

      <section className="mb-6 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="w-full sm:max-w-md">
            <span className="mb-1 block text-sm font-medium text-stone-700">Busca por palavra-chave</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex.: technos, prata, feminino..."
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
            />
          </label>

          <div className="text-sm text-stone-700">
            Selecionados: <strong>{selectedCount}</strong> / {MAX_HIGHLIGHTS}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveHighlights}
            disabled={savingHighlights || selectedCount > MAX_HIGHLIGHTS}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingHighlights ? "Salvando..." : "Salvar destaque"}
          </button>
          {saveFeedback ? <p className="text-sm text-stone-600">{saveFeedback}</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        {loadingList ? <p className="text-sm text-stone-600">Carregando produtos...</p> : null}
        {listError ? <p className="text-sm text-red-700">{listError}</p> : null}

        {!loadingList && !listError ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-700">
                    <th scope="col" className="w-12 px-3 py-3 text-center font-medium">
                      <span className="sr-only">Destaque</span>
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Descricao
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3 font-medium">
                      Codigo SKU
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3 text-right font-medium">
                      Preco
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {items.map((item) => {
                    const idKey = String(item.id ?? "");
                    const checked = Boolean(selectedById[idKey]);
                    return (
                      <tr key={idKey || item.descricao} className="align-middle text-stone-800">
                        <td className="px-3 py-3 text-center">
                          <label className="inline-flex cursor-pointer justify-center">
                            <span className="sr-only">Marcar {item.descricao} como destaque</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelection(item)}
                              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                            />
                          </label>
                        </td>
                        <td className="max-w-md px-3 py-3">
                          <button
                            type="button"
                            onClick={() => openModalById(item.id)}
                            className="text-left text-stone-800 hover:text-stone-950 hover:underline"
                          >
                            {item.descricao}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-stone-600">
                          {item.sku || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-stone-900">
                          {formatPrice(item.preco)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {items.length === 0 ? (
              <p className="py-4 text-sm text-stone-600">Nenhum produto encontrado nesta página.</p>
            ) : null}

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || loadingList}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <div className="text-sm text-stone-600">
                Pagina {page}
                {Number.isFinite(totalEstimated) && totalEstimated != null
                  ? ` · Total estimado: ${totalEstimated}`
                  : ""}
              </div>

              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!hasNext || loadingList}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proxima
              </button>
            </div>
          </>
        ) : null}
      </section>

      <ProductDetailsModal
        product={modalItem}
        loading={modalLoading}
        error={modalError}
        onClose={() => {
          setModalItem(null);
          setModalLoading(false);
          setModalError("");
        }}
      />
    </div>
  );
}
