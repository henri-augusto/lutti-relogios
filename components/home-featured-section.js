import Link from "next/link";
import ProductGrid from "@/components/product-grid";
import ProductGridSkeleton from "@/components/product-grid-skeleton";
import ProductsErrorBanner from "@/components/products-error-banner";
import { ProductsFetchError, getProdutosDestaque } from "@/lib/produtos";
import { Suspense } from "react";

async function FeaturedProductsContent() {
  let produtosDestaque = [];
  let fetchError = null;

  try {
    produtosDestaque = await getProdutosDestaque(3);
  } catch (err) {
    fetchError =
      err instanceof ProductsFetchError
        ? err.message
        : "Erro inesperado ao buscar produtos no Supabase.";
  }

  if (fetchError) {
    return <ProductsErrorBanner message={fetchError} />;
  }

  return <ProductGrid products={produtosDestaque} />;
}

export default function HomeFeaturedSection() {
  return (
    <section className="space-y-8" aria-labelledby="featured-heading">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
          Seleção especial
        </p>
        <div className="flex items-end justify-between gap-4">
          <h2
            id="featured-heading"
            className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl"
          >
            Em destaque agora
          </h2>
          <Link
            href="/catalogo"
            className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-stone-300/60 px-4 py-2 text-sm font-medium text-stone-600 transition-all duration-300 hover:border-stone-400 hover:bg-stone-100/60 hover:text-stone-900"
          >
            Ver catálogo
            <svg
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={3} />}>
        <FeaturedProductsContent />
      </Suspense>
    </section>
  );
}
