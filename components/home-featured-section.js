import Link from "next/link";
import ProductGrid from "@/components/product-grid";
import ProductGridSkeleton from "@/components/product-grid-skeleton";
import ProductsErrorBanner from "@/components/products-error-banner";
<<<<<<< HEAD
import { ProductsFetchError, getProdutosDestaque } from "@/lib/produtos";
import { FeaturedProductsError, getFeaturedProducts } from "@/lib/featured-products";
=======
import { ProductsFetchError, getProdutosDestaque } from "@/lib/domain/produtos";
import { FeaturedProductsError, getFeaturedProducts } from "@/lib/domain/featured-products";
>>>>>>> main
import { Suspense } from "react";

const FEATURED_PRODUCTS_GRID_CLASS =
  "grid grid-flow-col auto-cols-[minmax(16rem,82vw)] gap-5 overflow-x-auto overscroll-x-contain pb-2 sm:grid-flow-row sm:auto-cols-auto sm:auto-rows-fr sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3";

async function FeaturedProductsContent() {
  let produtosDestaque = [];
  let fetchError = null;

  try {
    const featuredFromAdmin = await getFeaturedProducts();
    produtosDestaque =
      featuredFromAdmin.length > 0 ? featuredFromAdmin.slice(0, 3) : await getProdutosDestaque(3);
  } catch (err) {
<<<<<<< HEAD
    fetchError =
      err instanceof ProductsFetchError || err instanceof FeaturedProductsError
        ? err.message
        : "Erro inesperado ao buscar produtos no Supabase.";
=======
    try {
      produtosDestaque = await getProdutosDestaque(3);
    } catch (fallbackErr) {
      fetchError =
        fallbackErr instanceof ProductsFetchError || fallbackErr instanceof FeaturedProductsError
          ? fallbackErr.message
          : err instanceof ProductsFetchError || err instanceof FeaturedProductsError
            ? err.message
            : "Erro inesperado ao buscar produtos no Supabase.";
    }
>>>>>>> main
  }

  if (fetchError) {
    return <ProductsErrorBanner message={fetchError} />;
  }

  return <ProductGrid products={produtosDestaque} className={FEATURED_PRODUCTS_GRID_CLASS} />;
}

export default function HomeFeaturedSection() {
  return (
    <section className="space-y-8" aria-labelledby="featured-heading">
      <div data-reveal>
        <p data-reveal data-reveal-delay={40} className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
          Seleção especial
        </p>
<<<<<<< HEAD
        <div data-reveal data-reveal-delay={90} className="flex items-end justify-between gap-4">
=======
        <div
          data-reveal
          data-reveal-delay={90}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
>>>>>>> main
          <h2
            id="featured-heading"
            className="min-w-0 font-serif text-3xl font-bold text-stone-900 sm:text-4xl"
          >
            Em destaque agora
          </h2>
          <Link
            href="/catalogo"
            className="group inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-stone-300/60 px-4 py-2 text-sm font-medium text-stone-600 transition-all duration-300 hover:border-stone-400 hover:bg-stone-100/60 hover:text-stone-900"
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

      <div data-reveal data-reveal-delay={160}>
<<<<<<< HEAD
        <Suspense fallback={<ProductGridSkeleton count={3} />}>
        <FeaturedProductsContent />
=======
        <Suspense
          fallback={
            <ProductGridSkeleton count={3} gridClassName={FEATURED_PRODUCTS_GRID_CLASS} />
          }
        >
          <FeaturedProductsContent />
>>>>>>> main
        </Suspense>
      </div>
    </section>
  );
}
