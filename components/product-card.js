"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import ProductImageWithFallback from "@/components/product-image-with-fallback";
import { normalizeCheckoutQuantity } from "@/lib/domain/checkout-quantity";
import { animateFlyToCart } from "@/lib/domain/fly-to-cart";
import { isStripeCheckoutEnabled } from "@/lib/domain/stripe-checkout-enabled";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

function ShoppingBagIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

function SpinnerIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Monta o item do carrinho a partir do produto do card; lança se inválido ou sem estoque.
 * @param {object} product
 */
function buildCartLineItemFromProduct(product) {
  const estoqueDisponivel = Number.isFinite(Number(product.estoque))
    ? Math.max(0, Math.floor(Number(product.estoque)))
    : 0;
  const slugStr = typeof product.slug === "string" ? product.slug.trim() : "";
  const nomeStr = typeof product.nome === "string" ? product.nome.trim() : "";
  const precoNum =
    typeof product.preco === "number" ? product.preco : Number(product.preco);
  let quantity = normalizeCheckoutQuantity(1);
  if (quantity > estoqueDisponivel) {
    quantity = normalizeCheckoutQuantity(estoqueDisponivel);
  }

  if (!slugStr || !nomeStr) {
    throw new Error("Dados do produto incompletos.");
  }

  if (estoqueDisponivel < 1) {
    throw new Error("Produto esgotado.");
  }

  if (quantity < 1 || quantity > estoqueDisponivel) {
    throw new Error("Quantidade indisponivel em estoque.");
  }

  if (!Number.isFinite(precoNum) || precoNum <= 0) {
    throw new Error("Preco do produto invalido.");
  }

  const imagemUrl =
    typeof product.imagem_url === "string" ? product.imagem_url.trim() : "";

  return {
    slug: slugStr,
    nomeProduto: nomeStr,
    precoCentavos: Math.round(precoNum),
    quantity,
    estoque: estoqueDisponivel,
    imagemUrl,
  };
}

const CARD_BUTTON_CLASS =
  "inline-flex min-h-9 min-w-0 w-full items-center justify-center gap-1.5 rounded-full bg-stone-900 px-4 text-[11px] font-semibold text-[#FDFBF7] transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/25 disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-8 lg:px-3 lg:text-[10px]";

function ProductCardViewProductLink({ product }) {
  const productHref = `/produto/${product.slug}`;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <Link
        href={productHref}
        className={CARD_BUTTON_CLASS}
        aria-label={`Ver produto ${product.nome ?? ""}`.trim()}
      >
        <span>Ver produto</span>
      </Link>
    </div>
  );
}

function ProductCardAddToCartButton({ product, outOfStock }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addItem, openCart } = useCart();

  const estoqueDisponivel = Number.isFinite(Number(product.estoque))
    ? Math.max(0, Math.floor(Number(product.estoque)))
    : 0;

  async function handleClick(event) {
    setError("");
    setIsLoading(true);

    try {
      const payload = buildCartLineItemFromProduct(product);
      addItem(payload);

      const sourceElement = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
      const targetElement = document.getElementById("cart-button-anchor");
      await animateFlyToCart({
        sourceElement,
        targetElement,
        imageUrl: payload.imagemUrl,
      });
      openCart();
      setIsLoading(false);
    } catch (err) {
      setError(err?.message || "Algo deu errado. Tente novamente.");
      setIsLoading(false);
    }
  }

  const disabled = isLoading || outOfStock || estoqueDisponivel < 1;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={
          outOfStock || estoqueDisponivel < 1
            ? "Produto esgotado"
            : isLoading
              ? "Adicionando ao carrinho"
              : "Comprar"
        }
        aria-label={
          outOfStock || estoqueDisponivel < 1
            ? "Produto esgotado"
            : isLoading
              ? "Adicionando ao carrinho"
              : `Comprar ${product.nome ?? "produto"}`
        }
        className={CARD_BUTTON_CLASS}
      >
        {isLoading ? (
          <SpinnerIcon className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ShoppingBagIcon className="h-4 w-4" />
            <span>Comprar</span>
          </>
        )}
      </button>
      {error ? (
        <p className="text-[10px] leading-tight text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

export default function ProductCard({ product }) {
  const outOfStock = (product.estoque ?? 0) < 1;

  const productHref = `/produto/${product.slug}`;

  return (
    <article className="group h-full rounded-[1.25rem] transition-[transform,box-shadow] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-18px_rgba(28,25,23,0.14)]">
      <div className="flex h-full flex-col rounded-[1.25rem] bg-stone-200/40 p-[5px] ring-1 ring-stone-900/[0.05]">
        <Link
          href={productHref}
          className="flex flex-1 flex-col overflow-hidden rounded-[calc(1.25rem-5px)] bg-[#FDFBF7] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none ring-0 transition-[box-shadow] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-stone-900/20"
        >
          <div className="relative h-48 shrink-0 overflow-hidden bg-stone-100 sm:h-52 lg:h-56">
            <ProductImageWithFallback
              src={product.imagem_url}
              alt={product.nome}
              tone="stone"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
            />
          </div>

          <div className="flex flex-1 flex-col border-t border-stone-900/[0.06] px-3 pb-3 pt-2.5">
            <h3 className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug tracking-tight text-stone-900">
              {product.nome}
            </h3>

            {product.descricao ? (
              <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-stone-500">
                {product.descricao}
              </p>
            ) : null}

            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
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
          </div>
        </Link>

        <div className="border-t border-stone-900/[0.04] px-3 pb-3 pt-2">
          {isStripeCheckoutEnabled() ? (
            <ProductCardAddToCartButton product={product} outOfStock={outOfStock} />
          ) : (
            <ProductCardViewProductLink product={product} />
          )}
        </div>
      </div>
    </article>
  );
}
