"use client";

import { useState } from "react";
import { normalizeCheckoutQuantity } from "@/lib/checkout-quantity";

export default function ComprarButton({
  slug,
  nomeProduto,
  precoCentavos,
  estoque: estoqueProp = 0,
  quantity: quantityProp = 1,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const estoqueDisponivel = Number.isFinite(Number(estoqueProp))
    ? Math.max(0, Math.floor(Number(estoqueProp)))
    : 0;

  async function handleClick() {
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

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugStr,
          nomeProduto: nomeStr,
          preco,
          quantity,
          quantidade: quantity,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Nao foi possivel iniciar o pagamento.");
      }

      window.location.href = data.url;
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
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isLoading ? "Carregando..." : semEstoque ? "Esgotado" : "Comprar"}
      </button>
      {error ? <p className="max-w-xs text-sm text-red-600 sm:max-w-none">{error}</p> : null}
    </div>
  );
}
