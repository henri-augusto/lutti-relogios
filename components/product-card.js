import Image from "next/image";
import Link from "next/link";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

export default function ProductCard({ product }) {
  return (
    <article className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          <Image
            src={product.imagem_url}
            alt={product.nome}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      </Link>
      <div className="space-y-2 p-5">
        <h3 className="line-clamp-2 text-base font-semibold text-stone-900">
          {product.nome}
        </h3>
        {product.descricao ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-stone-500">
            {product.descricao}
          </p>
        ) : null}
        <p className="font-serif text-xl font-bold text-stone-900">
          {formatPrice(product.preco)}
        </p>
        {(product.estoque ?? 0) < 1 ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Esgotado
          </p>
        ) : (
          <p className="text-xs text-stone-400">
            {product.estoque} disponíveis
          </p>
        )}
        <Link
          href={`/produto/${product.slug}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-stone-700 active:scale-[0.97]"
        >
          Ver produto
        </Link>
      </div>
    </article>
  );
}
