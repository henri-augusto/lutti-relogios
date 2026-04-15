export default function ProductGridSkeleton({ count = 6 }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando produtos"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="aspect-square animate-pulse bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-9 w-28 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
