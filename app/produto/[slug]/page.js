import Link from "next/link";
import { notFound } from "next/navigation";
import ComprarButton from "@/components/comprar-button";
import ProductImageGallery from "@/components/product-image-gallery";
import WhatsAppButton from "@/components/whatsapp-button";
import { getProdutoBySlug, getProdutos } from "@/lib/produtos";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

function plainTextFromHtml(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDangerousHtmlTags(html) {
  return String(html ?? "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
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
    return { title: "Produto não encontrado | Luti Relogios" };
  }

  const produto = await getProdutoBySlug(slug);

  if (!produto) {
    return { title: "Produto não encontrado | Luti Relogios" };
  }

  return {
    title: `${produto.nome} | Luti Relógios`,
    description: plainTextFromHtml(produto.descricaoComplementar) || produto.descricao,
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

  const imagensProduto = Array.from(
    new Set(
      [produto.imagem_url, ...(Array.isArray(produto.imagens) ? produto.imagens : [])]
        .map((url) => String(url ?? "").trim())
        .filter(Boolean),
    ),
  );
  const hasDescricaoComplementar = Boolean(plainTextFromHtml(produto.descricaoComplementar));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8 lg:grid-cols-2">
        <ProductImageGallery product={produto} images={imagensProduto} />

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
          {!hasDescricaoComplementar ? (
            <p className="text-base leading-relaxed text-slate-600">{produto.descricao}</p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <WhatsAppButton productName={produto.nome} />
            <ComprarButton
              slug={produto.slug}
              nomeProduto={produto.nome}
              precoCentavos={produto.preco}
              estoque={produto.estoque}
              imagemUrl={produto.imagem_url}
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

      {hasDescricaoComplementar ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Mais informações</h2>
          <div
            className="mt-3 text-base leading-relaxed text-slate-600 [&_a]:break-all [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_p]:first:mt-0 [&_p]:last:mb-0 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_th]:text-left [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{
              __html: stripDangerousHtmlTags(produto.descricaoComplementar),
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
