import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutForm from "@/components/checkout-form";
import ProductImageWithFallback from "@/components/product-image-with-fallback";
import { getProdutoBySlug } from "@/lib/produtos";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

export const metadata = {
  title: "Checkout | Luti Relogios",
  description: "Finalize seus dados para continuar com o pagamento.",
};

export default async function CheckoutPage({ searchParams }) {
  const resolved = await Promise.resolve(searchParams);
  const slug = resolved?.slug;

  if (!slug || typeof slug !== "string") {
    redirect("/catalogo");
  }

  const produto = await getProdutoBySlug(slug);

  if (!produto) {
    redirect("/catalogo");
  }

  if (produto.estoque < 1) {
    redirect(`/produto/${produto.slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/produto/${produto.slug}`}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Voltar ao produto
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-2 text-sm text-slate-600">
          Revise o item e informe seus dados para continuar.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
        <aside className="lg:col-span-2">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-square bg-slate-100 sm:aspect-[4/3]">
              <ProductImageWithFallback
                src={produto.imagem_url}
                alt={produto.nome}
                tone="slate"
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="space-y-2 p-5">
              <h2 className="font-serif text-lg font-semibold text-slate-900">{produto.nome}</h2>
              <p className="text-xl font-bold text-slate-800">{formatPrice(produto.preco)}</p>
              <p className="text-sm text-slate-600">{produto.estoque} em estoque</p>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <CheckoutForm
            produtoSlug={produto.slug}
            produtoNome={produto.nome}
            produtoPrecoCentavos={produto.preco}
            produtoEstoque={produto.estoque}
          />
        </div>
      </div>
    </div>
  );
}
