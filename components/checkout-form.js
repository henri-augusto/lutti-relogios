"use client";

import { useState } from "react";
import { normalizeCheckoutQuantity } from "@/lib/checkout-quantity";

export default function CheckoutForm({
  produtoSlug,
  produtoNome,
  produtoPrecoCentavos,
  produtoEstoque = 0,
}) {
  const estoqueMax = Math.max(0, Math.floor(Number(produtoEstoque) || 0));
  const qtyMax = Math.min(99, Math.max(1, estoqueMax));

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const slugStr = typeof produtoSlug === "string" ? produtoSlug.trim() : "";
      const nomeStr = typeof produtoNome === "string" ? produtoNome.trim() : "";
      const precoRaw = produtoPrecoCentavos;
      const precoNum = typeof precoRaw === "number" ? precoRaw : Number(precoRaw);
      if (estoqueMax < 1) {
        throw new Error("Produto esgotado.");
      }

      let qty = normalizeCheckoutQuantity(quantidade);
      qty = Math.min(qty, estoqueMax);

      if (qty < 1 || qty > estoqueMax) {
        throw new Error("Quantidade indisponivel em estoque.");
      }

      if (!slugStr || !nomeStr || !Number.isFinite(precoNum) || precoNum <= 0) {
        throw new Error("Dados do produto invalidos.");
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slugStr,
          nomeProduto: nomeStr,
          preco: Math.round(precoNum),
          quantity: qty,
          quantidade: qty,
          customerEmail: email.trim(),
          nomeCliente: nome.trim(),
          telefone: telefone.trim(),
          endereco: endereco.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Nao foi possivel iniciar o pagamento.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="border-b border-slate-100 pb-4">
        <h2 className="font-serif text-xl font-bold text-slate-900">Seus dados</h2>
        <p className="mt-1 text-sm text-slate-600">
          Preencha para continuar. Produto:{" "}
          <span className="font-medium text-slate-800">{produtoNome}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="checkout-quantidade" className="text-sm font-medium text-slate-700">
          Quantidade
        </label>
        <input
          id="checkout-quantidade"
          name="quantidade"
          type="number"
          min={1}
          max={qtyMax}
          required
          value={quantidade}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            setQuantidade(Number.isNaN(n) ? 1 : Math.min(qtyMax, Math.max(1, n)));
          }}
          className="w-full max-w-[8rem] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none ring-slate-900/10 transition focus:border-slate-400 focus:bg-white focus:ring-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="checkout-nome" className="text-sm font-medium text-slate-700">
          Nome completo
        </label>
        <input
          id="checkout-nome"
          name="nome"
          type="text"
          autoComplete="name"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none ring-slate-900/10 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2"
          placeholder="Seu nome completo"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="checkout-email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="checkout-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none ring-slate-900/10 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="checkout-telefone" className="text-sm font-medium text-slate-700">
          Telefone
        </label>
        <input
          id="checkout-telefone"
          name="telefone"
          type="tel"
          autoComplete="tel"
          required
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none ring-slate-900/10 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2"
          placeholder="(00) 00000-0000"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="checkout-endereco" className="text-sm font-medium text-slate-700">
          Endereço
        </label>
        <textarea
          id="checkout-endereco"
          name="endereco"
          rows={3}
          required
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none ring-slate-900/10 transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2"
          placeholder="Rua, número, bairro, cidade, CEP"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isLoading ? "Redirecionando..." : "Continuar pagamento"}
      </button>
    </form>
  );
}
