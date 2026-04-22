import Link from "next/link";
import { notFound } from "next/navigation";
import ComprarButton from "@/components/comprar-button";
import ProductImageWithFallback from "@/components/product-image-with-fallback";
import WhatsAppButton from "@/components/whatsapp-button";
import { getProdutoBySlug, getProdutos } from "@/lib/produtos";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const produtos = await getProdutos();
    return produtos.map((produto) => ({ slug: produto.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;

  if (!slug || typeof slug !== "string") {
    return { title: "Produto nao encontrado | Luti Relogios" };
  }

  const produto = await getProdutoBySlug(slug);

  if (!produto) {
    return { title: "Produto nao encontrado | Luti Relogios" };
  }

  return {
    title: `${produto.nome} | Luti Relogios`,
    description: produto.descricao,
  };
}

export default async function ProdutoPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;

  if (!slug || typeof slug !== "string") {
    notFound();
  }

  const produto = await getProdutoBySlug(slug);

  if (!produto) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
          <ProductImageWithFallback
            src={produto.imagem_url}
            alt={produto.nome}
            tone="slate"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col justify-center gap-5">
          <h1 className="font-serif text-3xl font-bold text-slate-900">{produto.nome}</h1>
          <p className="text-3xl font-bold text-slate-800">{formatPrice(produto.preco)}</p>
          <p className="text-sm font-medium text-slate-600">
            {(produto.estoque ?? 0) < 1 ? (
              <span className="text-amber-700">Esgotado</span>
            ) : (
              <span>{produto.estoque} em estoque</span>
            )}
          </p>
          <p className="text-base leading-relaxed text-slate-600">{produto.descricao}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <WhatsAppButton productName={produto.nome} />
            <ComprarButton
              slug={produto.slug}
              nomeProduto={produto.nome}
              precoCentavos={produto.preco}
              estoque={produto.estoque}
            />
          </div>

          <p className="text-xs text-slate-500">
            Cadastro opcional:{" "}
            <Link href="/cadastro" className="font-semibold text-slate-800 underline underline-offset-2">
              preencher dados
            </Link>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
