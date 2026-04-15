import ProductGrid from "@/components/product-grid";
import ProductGridSkeleton from "@/components/product-grid-skeleton";
import ProductsErrorBanner from "@/components/products-error-banner";
import { ProductsFetchError, getProdutos } from "@/lib/produtos";
import { Suspense } from "react";

export const metadata = {
  title: "Catalogo | Luti Relogios",
  description: "Explore nosso catalogo completo de relogios premium.",
};

export const revalidate = 60;

async function CatalogGrid() {
  let produtos = [];
  let fetchError = null;

  try {
    produtos = await getProdutos();
  } catch (err) {
    fetchError =
      err instanceof ProductsFetchError
        ? err.message
        : "Erro inesperado ao buscar produtos no Supabase.";
  }

  if (fetchError) {
    return <ProductsErrorBanner message={fetchError} />;
  }

  return <ProductGrid products={produtos} />;
}

export default function CatalogoPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Catalogo de relogios</h1>
        <p className="mt-2 text-sm text-slate-600">
          Encontre o modelo ideal para seu estilo com compra segura e atendimento dedicado.
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={6} />}>
        <CatalogGrid />
      </Suspense>
    </div>
  );
}
