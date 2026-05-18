"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

const toneClass = {
  stone: "border-stone-300/70 bg-stone-100 text-stone-500",
  slate: "border-slate-300/70 bg-slate-100 text-slate-500",
};

/**
 * Imagem de produto com fallback quando a URL retorna erro (ex.: 404) ou está vazia.
 */
export default function ProductImageWithFallback({
  src,
  alt,
  sizes,
  className = "",
  priority,
  tone = "stone",
}) {
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  const trimmed = typeof src === "string" ? src.trim() : "";
  const showFallback = !trimmed || failed;

  const panelTone = toneClass[tone] ?? toneClass.stone;

  if (showFallback) {
    return (
      <div
        className={`absolute inset-0 z-[1] flex items-center justify-center border border-dashed px-3 ${panelTone}`}
        role="img"
        aria-label={
          alt && typeof alt === "string"
            ? `${alt} — imagem indisponível`
            : "Imagem do produto indisponível"
        }
      >
        <span className="text-center text-[9px] font-semibold uppercase tracking-[0.18em]">
          Imagem indisponível
        </span>
      </div>
    );
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      onError={onError}
    />
  );
}
