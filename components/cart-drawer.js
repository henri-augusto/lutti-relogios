"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, subtotalCentavos } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          isCartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />
      <aside
        aria-label="Carrinho"
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Seu carrinho</h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            Fechar
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-600">Seu carrinho esta vazio.</p>
          ) : (
            items.map((item) => {
              const maxQty = Math.max(1, Math.floor(Number(item.estoque || 1)));
              return (
                <article key={item.slug} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{item.nomeProduto}</p>
                  <p className="text-sm text-slate-600">{formatPrice(item.precoCentavos)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <label htmlFor={`qty-${item.slug}`} className="text-xs text-slate-600">
                      Qtd.
                    </label>
                    <input
                      id={`qty-${item.slug}`}
                      type="number"
                      min={1}
                      max={maxQty}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.slug, Number(event.target.value))}
                      className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-slate-500">Estoque: {item.estoque}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.slug)}
                    className="mt-3 text-xs font-medium text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </article>
              );
            })
          )}
        </div>

        <footer className="border-t border-slate-100 px-5 py-4">
          <p className="mb-3 text-sm text-slate-700">
            Subtotal: <span className="font-semibold text-slate-900">{formatPrice(subtotalCentavos)}</span>
          </p>
          <Link
            href="/checkout"
            onClick={closeCart}
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Finalizar compra
          </Link>
        </footer>
      </aside>
    </>
  );
}
