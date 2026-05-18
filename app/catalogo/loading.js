import ProductGridSkeleton from "@/components/product-grid-skeleton";

export default function CatalogoLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 max-w-md animate-pulse rounded bg-slate-200" />
      </div>
      <ProductGridSkeleton
        count={8}
        gridClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      />
    </div>
  );
}
