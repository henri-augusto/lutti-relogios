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

function StockBadge({ estoque }) {
  const disponivel = (estoque ?? 0) >= 1;
  if (!disponivel) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900/90">
        Esgotado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-[11px] font-medium text-emerald-900/85">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {estoque} em estoque
    </span>
  );
}

const TRUST_ITEMS = [
  {
    label: "Garantia de 12 meses",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    ),
  },
  {
    label: "Atendimento via WhatsApp",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    ),
  },
  {
    label: "Compra segura",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    ),
  },
];

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
  const marca = String(produto.marca ?? "").trim();
  const semEstoque = (produto.estoque ?? 0) < 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <nav aria-label="Navegação do produto" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <li>
            <Link
              href="/catalogo"
              className="font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              Catálogo
            </Link>
          </li>
          <li aria-hidden="true" className="text-stone-300">
            /
          </li>
          <li className="max-w-[min(100%,28rem)] truncate font-medium text-stone-900" aria-current="page">
            {produto.nome}
          </li>
        </ol>
      </nav>

      <article className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start lg:gap-14">
        <ProductImageGallery product={produto} images={imagensProduto} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6">
            <header className="space-y-4 border-b border-stone-200/70 pb-6">
              {marca ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A68B4B]">
                  {marca}
                </p>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                  Relógio premium
                </p>
              )}

              <h1 className="font-serif text-3xl font-bold leading-[1.12] tracking-tight text-stone-900 text-balance sm:text-4xl">
                {produto.nome}
              </h1>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <p className="font-serif text-3xl font-bold tabular-nums tracking-tight text-stone-900 sm:text-[2rem]">
                  {formatPrice(produto.preco)}
                </p>
                <StockBadge estoque={produto.estoque} />
              </div>
            </header>

            {!hasDescricaoComplementar && produto.descricao ? (
              <p className="max-w-prose text-[0.9375rem] leading-relaxed text-stone-600">
                {produto.descricao}
              </p>
            ) : null}

            <div className="rounded-2xl border border-stone-200/80 bg-[#FDFBF7] p-5 shadow-[0_18px_40px_-28px_rgba(28,25,23,0.35)] ring-1 ring-stone-900/[0.04]">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Finalizar compra
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <WhatsAppButton productName={produto.nome} />
                <ComprarButton
                  slug={produto.slug}
                  nomeProduto={produto.nome}
                  precoCentavos={produto.preco}
                  estoque={produto.estoque}
                  imagemUrl={produto.imagem_url}
                />
              </div>
              {semEstoque ? (
                <p className="mt-3 text-sm text-amber-800/90">
                  Este modelo está temporariamente indisponível. Fale conosco pelo WhatsApp para aviso de reposição.
                </p>
              ) : null}
            </div>

            <ul className="grid gap-3 sm:grid-cols-3">
              {TRUST_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start gap-2.5 rounded-xl border border-stone-200/60 bg-stone-50/50 px-3 py-3"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#A68B4B]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </svg>
                  <span className="text-xs leading-snug font-medium text-stone-700">{item.label}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs leading-relaxed text-stone-500">
              Cadastro opcional para agilizar o checkout:{" "}
              <Link
                href="/cadastro"
                className="font-semibold text-stone-800 underline underline-offset-2 hover:text-stone-950"
              >
                preencher dados
              </Link>
              .
            </p>
          </div>
        </div>
      </article>

      {hasDescricaoComplementar ? (
        <section className="mt-10 rounded-2xl border border-stone-200/80 bg-[#FDFBF7] p-6 shadow-[0_18px_40px_-28px_rgba(28,25,23,0.2)] ring-1 ring-stone-900/[0.04] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            Detalhes do produto
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-stone-900">Mais informações</h2>
          <div
            className="mt-5 max-w-none text-[0.9375rem] leading-relaxed text-stone-600 [&_a]:break-all [&_a]:text-stone-800 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#C9A96E]/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mb-2 [&_h1]:font-serif [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-stone-900 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2.5 [&_p]:first:mt-0 [&_p]:last:mb-0 [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-stone-200 [&_td]:p-2 [&_th]:border [&_th]:border-stone-200 [&_th]:bg-stone-50 [&_th]:p-2 [&_th]:text-left [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold [&_strong]:text-stone-800"
            dangerouslySetInnerHTML={{
              __html: stripDangerousHtmlTags(produto.descricaoComplementar),
            }}
          />
        </section>
      ) : null}
    </div>
  );
}
