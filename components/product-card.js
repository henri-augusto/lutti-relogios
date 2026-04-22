import Link from "next/link";
import ProductImageWithFallback from "@/components/product-image-with-fallback";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

export default function ProductCard({ product }) {
  const outOfStock = (product.estoque ?? 0) < 1;

  return (
    <article className="group rounded-[1.25rem] transition-[transform,box-shadow] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-18px_rgba(28,25,23,0.14)]">
      <div className="rounded-[1.25rem] bg-stone-200/40 p-[5px] ring-1 ring-stone-900/[0.05]">
        <Link
          href={`/produto/${product.slug}`}
          className="block overflow-hidden rounded-[calc(1.25rem-5px)] bg-[#FDFBF7] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none ring-0 transition-[box-shadow] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-stone-900/20"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
            <ProductImageWithFallback
              src={product.imagem_url}
              alt={product.nome}
              tone="stone"
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
            />
          </div>

          <div className="border-t border-stone-900/[0.06] px-3 pb-3 pt-2.5">
            <h3 className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug tracking-tight text-stone-900">
              {product.nome}
            </h3>

            {product.descricao ? (
              <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-stone-500">
                {product.descricao}
              </p>
            ) : null}

            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="font-serif text-lg font-bold tabular-nums tracking-tight text-stone-900">
                {formatPrice(product.preco)}
              </p>
              {outOfStock ? (
                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-800/90">
                  Esgotado
                </span>
              ) : (
                <span className="shrink-0 text-[10px] font-medium tabular-nums text-stone-400">
                  {product.estoque} em estoque
                </span>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-stone-900/[0.04] pt-2">
              <span className="text-[11px] font-medium text-stone-500 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-stone-800">
                Ver produto
              </span>
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900/[0.06] text-xs text-stone-700 transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:bg-stone-900/[0.1]">
                ↗
              </span>
            </div>
          </div>
        </Link>
      </div>
    </article>
  );
}
