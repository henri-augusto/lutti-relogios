"use client";

import { useMemo, useState } from "react";
import ProductFavoriteButton from "@/components/product-favorite-button";
import ProductImageWithFallback from "@/components/product-image-with-fallback";

export default function ProductImageGallery({ product, images }) {
  const galleryImages = useMemo(() => {
    return Array.from(
      new Set(
        [product?.imagem_url, ...(Array.isArray(images) ? images : [])]
          .map((url) => String(url ?? "").trim())
          .filter(Boolean),
      ),
    );
  }, [images, product?.imagem_url]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = galleryImages[selectedIndex] ?? galleryImages[0] ?? product?.imagem_url ?? "";

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
        <ProductFavoriteButton
          product={product}
          variant="slate"
          className="absolute right-3 top-3 z-10"
        />
        <ProductImageWithFallback
          src={selectedImage}
          alt={product?.nome ?? "Imagem do produto"}
          tone="slate"
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {galleryImages.length > 1 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {galleryImages.map((imageUrl, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={`${imageUrl}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Ver foto ${idx + 1} de ${galleryImages.length}`}
                aria-pressed={isSelected}
                className={`relative aspect-square overflow-hidden rounded-xl border bg-slate-100 transition ${
                  isSelected
                    ? "border-slate-900 ring-2 ring-slate-900/20"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <ProductImageWithFallback
                  src={imageUrl}
                  alt={`${product?.nome ?? "Produto"} - foto ${idx + 1}`}
                  tone="slate"
                  sizes="(max-width: 1024px) 33vw, 20vw"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
