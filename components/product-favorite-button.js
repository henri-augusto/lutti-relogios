"use client";

import { useFavorites } from "@/components/favorites-context";

/** Traço mais espesso, estilo utilitário (evita ícone “genérico fino”). */
function HeartIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const surfaceByVariant = {
  stone: "bg-[#FFFFFF]",
  slate: "bg-[#FBFBFA]",
};

export default function ProductFavoriteButton({ product, variant = "stone", className = "" }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.slug);
  const surface = surfaceByVariant[variant] ?? surfaceByVariant.stone;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFavorite(product);
      }}
      aria-pressed={favorited}
      aria-label={
        favorited ? `Remover ${product.nome} dos favoritos` : `Adicionar ${product.nome} aos favoritos`
      }
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#EAEAEA] text-[#2F3437] transition-[transform,background-color,color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F3437]/20 active:scale-[0.98] ${surface} ${
        favorited
          ? "border-[#EAEAEA] bg-[#F0EFEC] text-[#3A3A38] hover:bg-[#E8E7E4] hover:text-[#111111]"
          : "hover:bg-[#F7F6F3] hover:text-[#111111]"
      } ${className}`.trim()}
    >
      <HeartIcon filled={favorited} />
    </button>
  );
}
