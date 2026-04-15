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
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            Produtos em destaque
          </h2>
          <p className="text-sm text-slate-600">Selecao exclusiva com os modelos mais desejados.</p>
        </div>
        <Link
          href="/catalogo"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Ver todos
        </Link>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={3} />}>
        <FeaturedProductsContent />
      </Suspense>
    </section>
  );
}
