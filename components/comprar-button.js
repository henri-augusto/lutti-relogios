"use client";

import { useState } from "react";
import { normalizeCheckoutQuantity } from "@/lib/domain/checkout-quantity";
import { useCart } from "@/components/cart-provider";
import { animateFlyToCart } from "@/lib/domain/fly-to-cart";

export default function ComprarButton({
  slug,
  nomeProduto,
  precoCentavos,
  estoque: estoqueProp = 0,
  quantity: quantityProp = 1,
  imagemUrl = "",
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

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || semEstoque}
        className="inline-flex w-full items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-[#FDFBF7] transition hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/25 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isLoading ? "Adicionando..." : semEstoque ? "Esgotado" : "Comprar"}
      </button>
      {error ? <p className="max-w-xs text-sm text-red-600 sm:max-w-none">{error}</p> : null}
    </div>
  );
}
