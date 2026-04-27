"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFavorites } from "@/components/favorites-context";
import ProductImageWithFallback from "@/components/product-image-with-fallback";

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((priceInCents ?? 0) / 100);
}

export default function FavoritosPage() {
  const { status } = useSession();
  const { items, loading, isAuthenticated, removeBySlug } = useFavorites();

  if (status === "loading") {
    return <div className="mx-auto max-w-4xl px-4 py-10">Carregando...</div>;
  }

  if (isAuthenticated && loading) {
    return <div className="mx-auto max-w-4xl px-4 py-10">Carregando favoritos...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[#2F3437]">Favoritos</h1>
      <p className="mt-2 text-sm text-stone-600">
        {isAuthenticated
          ? "Relogios salvos na sua conta."
          : "Relogios salvos neste navegador. Entre na sua conta para sincronizar entre dispositivos."}
      </p>

      {!isAuthenticated ? (
        <p className="mt-3 text-sm text-stone-600">
          <Link href="/auth" className="font-semibold text-[#2F3437] underline-offset-2 hover:underline">
            Criar conta ou entrar
          </Link>{" "}
          para guardar os favoritos no servidor.
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-6 grid gap-3">
          {items.map((item) => (
            <li
              key={item.slug}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#EAEAEA] bg-white p-4 transition-[box-shadow] duration-200 ease-out hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Link
                  href={`/produto/${item.slug}`}
                  className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#EAEAEA] bg-[#F7F6F3] outline-none ring-0 transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#2F3437]/15"
                >
                  <ProductImageWithFallback
                    src={item.imagem_url}
                    alt={item.nome}
                    tone="stone"
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-snug tracking-tight text-[#2F3437]">
                    {item.nome}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-[#787774]">{formatPrice(item.preco)}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/produto/${item.slug}`}
                  className="rounded border border-[#EAEAEA] bg-white px-3 py-1.5 text-xs font-semibold text-[#2F3437] transition-[background-color,transform] duration-200 hover:bg-[#F7F6F3] active:scale-[0.98]"
                >
                  Ver produto
                </Link>
                <button
                  type="button"
                  onClick={() => removeBySlug(item.slug, item.product_id)}
                  className="rounded border border-transparent px-3 py-1.5 text-xs font-semibold text-[#9F2F2D] transition-colors duration-200 hover:bg-[#FDEBEC]"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-[#EAEAEA] bg-white p-5 text-sm text-stone-600">
          Nenhum relogio favoritado ainda. Explore o catalogo e toque no coracao do card para salvar.
        </div>
      )}
    </div>
  );
}
