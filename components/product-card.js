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
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-square bg-slate-100">
          <Image
            src={product.imagem_url}
            alt={product.nome}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{product.nome}</h3>
        {product.descricao ? (
          <p className="line-clamp-2 text-sm text-slate-600">{product.descricao}</p>
        ) : null}
        <p className="text-lg font-bold text-slate-800">{formatPrice(product.preco)}</p>
        {(product.estoque ?? 0) < 1 ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Esgotado</p>
        ) : (
          <p className="text-xs text-slate-500">{product.estoque} disponíveis</p>
        )}
        <Link
          href={`/produto/${product.slug}`}
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Ver produto
        </Link>
      </div>
    </article>
  );
}
