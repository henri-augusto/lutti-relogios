"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 50;
const MAX_HIGHLIGHTS = 3;

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(priceInCents) || 0) / 100);
}

/** Texto visível aproximado (para decidir se mostra "—"). */
function plainTextFromHtml(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDangerousHtmlTags(html) {
  return String(html ?? "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
}

function featuredResponseToMap(items) {
  const next = {};
  for (const item of items || []) {
    const idKey = String(item.id ?? "");
    if (!idKey) continue;
    next[idKey] = {
      id: item.id,
      descricao: item.descricao ?? item.nome ?? "",
      preco: item.preco,
      estoque: item.estoque,
      imagem_url: item.imagem_url,
    };
  }
  return next;
}

function ProductDetailsModal({ open, product, loading, error, deleting, onClose, onDelete }) {
  if (!open && !product && !loading && !error) {
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
            disabled={deleting}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Fechar
          </button>
        </div>

        {loading ? <p className="text-sm text-stone-600">Carregando...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {product ? (
          <div className="space-y-4 text-sm text-stone-700">
            <div>
              <p className="mb-2 font-semibold text-stone-900">Foto</p>
              {product.foto ? (
                <div className="relative h-64 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                  <Image
                    src={product.foto}
                    alt={
                      product.sku
                        ? `Foto do produto SKU ${product.sku}`
                        : `Foto do produto ${product.id}`
                    }
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, 672px"
                    unoptimized
                  />
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-3 py-8 text-center text-stone-500">
                  Sem foto
                </p>
              )}
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-stone-900">ID</dt>
                <dd className="mt-0.5 tabular-nums">{product.id}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-900">SKU</dt>
                <dd className="mt-0.5 font-mono text-xs">{product.sku || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-900">Preço</dt>
                <dd className="mt-0.5 tabular-nums">{formatPrice(product.preco)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-900">Estoque</dt>
                <dd className="mt-0.5 tabular-nums">{product.estoque ?? "—"}</dd>
              </div>
            </dl>

            <div>
              <p className="font-semibold text-stone-900">Descrição complementar</p>
              {plainTextFromHtml(product.descricaoComplementar) ? (
                <div
                  className="mt-2 max-h-[min(50vh,24rem)] overflow-y-auto break-words rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-3 text-stone-800 [&_a]:break-all [&_a]:text-stone-900 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_p]:first:mt-0 [&_p]:last:mb-0 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-stone-200 [&_td]:p-2 [&_th]:border [&_th]:border-stone-200 [&_th]:p-2 [&_th]:text-left [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{
                    __html: stripDangerousHtmlTags(product.descricaoComplementar),
                  }}
                />
              ) : (
                <p className="mt-1 text-stone-500">—</p>
              )}
            </div>

            <div>
              <p className="font-semibold text-stone-900">Fornecedor</p>
              <p className="mt-1">{product.fornecedorNome || "—"}</p>
            </div>
          </div>
        ) : null}

        {onDelete ? (
          <div className={`${product ? "mt-4" : ""} border-t border-stone-200 pt-4`}>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || loading}
              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Excluindo..." : "Excluir produto"}
            </button>
            <p className="mt-2 text-xs text-stone-500">
              Remove do banco local (catalogo e destaques). Não exclui na Olist.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminProdutosPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchMode, setSearchMode] = useState("descricao");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [featuredById, setFeaturedById] = useState({});
  const [togglingFeaturedKey, setTogglingFeaturedKey] = useState("");
  const [featuredFeedback, setFeaturedFeedback] = useState("");
  const [catalogById, setCatalogById] = useState({});
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogFeedback, setCatalogFeedback] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [modalProductId, setModalProductId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [searchMode]);

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
          setFeaturedById(featuredResponseToMap(data?.items));
        }
      } catch {
        if (!cancelled) {
          setFeaturedFeedback("Nao foi possivel carregar os destaques salvos.");
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
    async function loadCatalogSelection() {
      try {
        const res = await fetch("/api/admin/produtos/catalog", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Falha ao carregar selecao do catalogo.");
        }
        if (!cancelled) {
          const next = {};
          for (const id of data?.ids || []) {
            const key = String(id ?? "");
            if (key) next[key] = true;
          }
          setCatalogById(next);
        }
      } catch {
        if (!cancelled) {
          setCatalogFeedback("Nao foi possivel carregar a selecao do catalogo.");
        }
      }
    }

    loadCatalogSelection();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }
    setCatalogById((prev) => {
      const next = { ...prev };
      for (const item of items) {
        const idKey = String(item.id ?? "");
        if (!idKey) continue;
        next[idKey] = Boolean(item.in_catalog);
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoadingList(true);
      setListError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          mode: searchMode,
        });
        if (debouncedQuery) {
          params.set("q", debouncedQuery);
        }
        const res = await fetch(`/api/admin/produtos?${params.toString()}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar produtos.");
        }
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setHasNext(Boolean(data?.hasNext));
          setTotalItems(Number.isFinite(data?.total) ? data.total : 0);
        }
      } catch (error) {
        if (!cancelled) {
          setListError(error?.message || "Erro ao carregar produtos.");
          setItems([]);
          setHasNext(false);
          setTotalItems(0);
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
  }, [page, debouncedQuery, searchMode]);

  const featuredItems = useMemo(() => Object.values(featuredById), [featuredById]);
  const featuredCount = featuredItems.length;
  const catalogCount = useMemo(
    () => Object.entries(catalogById).filter(([, v]) => v === true).length,
    [catalogById],
  );
  const totalPages = useMemo(() => {
    if (!Number.isFinite(totalItems) || totalItems <= 0) return 0;
    return Math.ceil(totalItems / PAGE_SIZE);
  }, [totalItems]);

  function isInCatalog(idKey) {
    return catalogById[idKey] === true;
  }

  function toggleCatalogRow(item) {
    const idKey = String(item.id ?? "");
    if (!idKey) return;
    setCatalogFeedback("");
    setCatalogById((prev) => ({
      ...prev,
      [idKey]: !isInCatalog(idKey),
    }));
  }

  async function handleSaveCatalog() {
    setCatalogFeedback("");
    setSavingCatalog(true);
    try {
      const ids = Object.entries(catalogById)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      const res = await fetch("/api/admin/produtos/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao salvar catalogo.");
      }
      setCatalogFeedback("Catalogo salvo com sucesso.");
      const next = {};
      for (const id of data?.ids || []) {
        const key = String(id ?? "");
        if (key) next[key] = true;
      }
      setCatalogById(next);
    } catch (error) {
      setCatalogFeedback(error?.message || "Falha ao salvar catalogo.");
    } finally {
      setSavingCatalog(false);
    }
  }

  async function handleToggleFeatured(item) {
    const idKey = String(item.id ?? "");
    if (!idKey) return;

    setFeaturedFeedback("");
    const wasFeatured = Boolean(featuredById[idKey]);
    let nextPayload;
    if (wasFeatured) {
      nextPayload = featuredItems.filter((x) => String(x.id) !== idKey);
    } else {
      if (featuredItems.length >= MAX_HIGHLIGHTS) {
        setFeaturedFeedback(`No maximo ${MAX_HIGHLIGHTS} produtos em destaque.`);
        return;
      }
      nextPayload = [
        ...featuredItems,
        {
          id: item.id,
          descricao: item.descricao,
          preco: item.preco,
          estoque: item.estoque,
          imagem_url: item.imagem_url,
        },
      ];
    }

    setTogglingFeaturedKey(idKey);
    try {
      const res = await fetch("/api/featured-products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: nextPayload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao atualizar destaque.");
      }
      setFeaturedFeedback(wasFeatured ? "Produto removido do destaque." : "Produto adicionado ao destaque.");
      setFeaturedById(featuredResponseToMap(data?.items));
    } catch (error) {
      setFeaturedFeedback(error?.message || "Falha ao atualizar destaque.");
    } finally {
      setTogglingFeaturedKey("");
    }
  }

  function closeProductModal() {
    setModalItem(null);
    setModalProductId("");
    setModalLoading(false);
    setModalError("");
    setDeletingProduct(false);
  }

  async function openModalById(productId) {
    const idKey = String(productId ?? "");
    if (!idKey) return;

    setModalProductId(idKey);
    setModalLoading(true);
    setModalError("");
    setModalItem(null);
    setDeleteFeedback("");
    try {
      const res = await fetch(`/api/admin/produtos/${encodeURIComponent(idKey)}`, {
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

  async function handleDeleteProduct() {
    const idKey = modalProductId || (modalItem?.id != null ? String(modalItem.id) : "");
    if (!idKey) return;

    const label = modalItem?.sku ? `SKU ${modalItem.sku}` : `ID ${idKey}`;
    if (
      !window.confirm(
        `Excluir o produto ${label} do banco local?\n\nIsso remove catalogo, destaque e favoritos vinculados. O produto continua na Olist.`,
      )
    ) {
      return;
    }

    setDeleteFeedback("");
    setDeletingProduct(true);
    try {
      const res = await fetch(`/api/admin/produtos/${encodeURIComponent(idKey)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Falha ao excluir produto.");
      }

      setItems((prev) => prev.filter((item) => String(item.id) !== idKey));
      setTotalItems((prev) => Math.max(0, prev - 1));
      setFeaturedById((prev) => {
        if (!prev[idKey]) return prev;
        const next = { ...prev };
        delete next[idKey];
        return next;
      });
      setCatalogById((prev) => {
        if (!prev[idKey]) return prev;
        const next = { ...prev };
        delete next[idKey];
        return next;
      });
      setDeleteFeedback("Produto excluido do banco local.");
      closeProductModal();
    } catch (error) {
      setModalError(error?.message || "Falha ao excluir produto.");
    } finally {
      setDeletingProduct(false);
    }
  }

  const searchPlaceholder =
    searchMode === "sku"
      ? "Digite o codigo SKU..."
      : "Ex.: technos, prata, feminino...";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900">Admin - Produtos Olist</h1>
        <p className="mt-2 text-sm text-stone-600">
          Produtos ativos (situacao A) salvos no Supabase.
        </p>
      </div>

      <section className="mb-6 rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full flex-1 lg:max-w-xl">
            <span className="mb-1 block text-sm font-medium text-stone-700">Busca</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-500"
              />
              <div className="flex shrink-0 gap-1 rounded-md border border-stone-300 p-0.5">
                <button
                  type="button"
                  onClick={() => setSearchMode("descricao")}
                  className={`rounded px-3 py-1.5 text-xs font-medium sm:text-sm ${
                    searchMode === "descricao"
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Palavra-chave
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode("sku")}
                  className={`rounded px-3 py-1.5 text-xs font-medium sm:text-sm ${
                    searchMode === "sku"
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  SKU
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm text-stone-700 sm:items-end">
            <p>
              Em destaque: <strong>{featuredCount}</strong> / {MAX_HIGHLIGHTS}
            </p>
            <p>
              No catalogo (marcados): <strong>{catalogCount}</strong>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveCatalog}
            disabled={savingCatalog}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingCatalog ? "Salvando..." : "Salvar catalogo"}
          </button>
          {featuredFeedback ? <p className="text-sm text-stone-600">{featuredFeedback}</p> : null}
          {catalogFeedback ? <p className="text-sm text-stone-600">{catalogFeedback}</p> : null}
          {deleteFeedback ? <p className="text-sm text-stone-600">{deleteFeedback}</p> : null}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        {loadingList ? <p className="text-sm text-stone-600">Carregando produtos...</p> : null}
        {listError ? <p className="text-sm text-red-700">{listError}</p> : null}

        {!loadingList && !listError ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-stone-200">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-700">
                    <th scope="col" className="w-12 px-3 py-3 text-center font-medium">
                      Catalogo
                    </th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3 text-center font-medium">
                      Destaque
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
                    const catalogChecked = isInCatalog(idKey);
                    const isFeatured = Boolean(featuredById[idKey]);
                    const busyFeatured = togglingFeaturedKey === idKey;
                    return (
                      <tr
                        key={idKey || item.descricao}
                        className={`align-middle text-stone-800 ${isFeatured ? "bg-amber-50/60" : ""}`}
                      >
                        <td className="px-3 py-3 text-center">
                          <label className="inline-flex cursor-pointer justify-center">
                            <span className="sr-only">Incluir {item.descricao} no catalogo publico</span>
                            <input
                              type="checkbox"
                              checked={catalogChecked}
                              onChange={() => toggleCatalogRow(item)}
                              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                            />
                          </label>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            disabled={busyFeatured}
                            onClick={() => handleToggleFeatured(item)}
                            className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
                              isFeatured
                                ? "border-amber-600 bg-amber-100 text-amber-950 hover:bg-amber-200"
                                : "border-stone-300 text-stone-700 hover:bg-stone-50"
                            }`}
                          >
                            {busyFeatured ? "..." : isFeatured ? "Remover destaque" : "Destaque"}
                          </button>
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

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || loadingList}
                className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <div className="min-w-0 flex-1 text-center text-sm text-stone-600">
                {totalPages > 0 ? (
                  <>
                    Pagina{" "}
                    <span className="font-medium tabular-nums text-stone-800">{page}</span>
                    {" de "}
                    <span className="font-medium tabular-nums text-stone-800">{totalPages}</span>
                    {Number.isFinite(totalItems) ? (
                      <>
                        {" "}
                        <span className="text-stone-500">·</span> {totalItems} produtos
                      </>
                    ) : null}
                  </>
                ) : (
                  <span>Nenhum produto para exibir.</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!hasNext || loadingList}
                className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proxima
              </button>
            </div>
          </>
        ) : null}
      </section>

      <ProductDetailsModal
        open={Boolean(modalProductId)}
        product={modalItem}
        loading={modalLoading}
        error={modalError}
        deleting={deletingProduct}
        onClose={closeProductModal}
        onDelete={modalProductId ? handleDeleteProduct : undefined}
      />
    </div>
  );
}
