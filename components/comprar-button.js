"use client";

import { useState } from "react";
<<<<<<< HEAD
import { normalizeCheckoutQuantity } from "@/lib/checkout-quantity";
import { useCart } from "@/components/cart-provider";
import { animateFlyToCart } from "@/lib/fly-to-cart";
=======
import { normalizeCheckoutQuantity } from "@/lib/domain/checkout-quantity";
import { useCart } from "@/components/cart-provider";
import { animateFlyToCart } from "@/lib/domain/fly-to-cart";
>>>>>>> main

export default function ComprarButton({
  slug,
  nomeProduto,
  precoCentavos,
  estoque: estoqueProp = 0,
  quantity: quantityProp = 1,
  imagemUrl = "",
<<<<<<< HEAD
=======
  disabled: disabledProp = false,
>>>>>>> main
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { addItem, openCart } = useCart();

  const estoqueDisponivel = Number.isFinite(Number(estoqueProp))
    ? Math.max(0, Math.floor(Number(estoqueProp)))
    : 0;

  async function handleClick(event) {
    setError("");
    setIsLoading(true);

    try {
      const slugStr = typeof slug === "string" ? slug.trim() : "";
      const nomeStr = typeof nomeProduto === "string" ? nomeProduto.trim() : "";
      const precoRaw = precoCentavos;
      const precoNum = typeof precoRaw === "number" ? precoRaw : Number(precoRaw);
      let quantity = normalizeCheckoutQuantity(quantityProp);
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

      const preco = Math.round(precoNum);

      addItem({
        slug: slugStr,
        nomeProduto: nomeStr,
        precoCentavos: preco,
        quantity,
        estoque: estoqueDisponivel,
        imagemUrl,
      });

      const sourceElement = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
      const targetElement = document.getElementById("cart-button-anchor");
      await animateFlyToCart({ sourceElement, targetElement, imageUrl: imagemUrl });
      openCart();
      setIsLoading(false);
    } catch (err) {
      setError(err?.message || "Algo deu errado. Tente novamente.");
      setIsLoading(false);
    }
  }

  const semEstoque = estoqueDisponivel < 1;
  const isDisabled = disabledProp || isLoading || semEstoque;

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        title={
          disabledProp
            ? "Compra online temporariamente indisponível. Use o WhatsApp."
            : semEstoque
              ? "Produto esgotado"
              : undefined
        }
        aria-label={
          disabledProp
            ? "Comprar indisponível — use o WhatsApp"
            : semEstoque
              ? "Produto esgotado"
              : `Comprar ${nomeProduto ?? "produto"}`
        }
        className="inline-flex w-full items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-[#FDFBF7] transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/25 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
<<<<<<< HEAD
        {isLoading ? "Adicionando..." : semEstoque ? "Esgotado" : "Comprar"}
=======
        {disabledProp ? "Comprar" : isLoading ? "Adicionando..." : semEstoque ? "Esgotado" : "Comprar"}
>>>>>>> main
      </button>
      {error ? <p className="max-w-xs text-sm text-red-600 sm:max-w-none">{error}</p> : null}
    </div>
  );
}
