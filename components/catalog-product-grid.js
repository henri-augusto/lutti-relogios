"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product-card";

const INITIAL = 8;
const STEP = 8;

export default function CatalogProductGrid({ products }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL);

  const visible = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
        Nenhum produto disponivel no momento.
      </div>
    );
  }

  const hasMore = visibleCount < products.length;

  return (
    <>
      <section
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        aria-live="polite"
      >
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((n) => Math.min(n + STEP, products.length))
            }
            className="rounded-full border border-stone-900/12 bg-white px-8 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:border-stone-900/20 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900/25"
          >
            Ver mais
          </button>
        </div>
      ) : null}
    </>
  );
}
