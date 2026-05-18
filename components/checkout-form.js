"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useCart } from "@/components/cart-provider";
import {
  MIN_CHECKOUT_TOTAL_ITEMS,
  MIN_CHECKOUT_TOTAL_ITEMS_ERROR_MESSAGE,
} from "@/lib/domain/checkout-quantity";

const initialPersonal = {
  fullName: "",
  email: "",
  phone: "",
  document: "",
};

const initialAddress = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function formatPrice(priceInCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}

export default function CheckoutForm() {
  const { items, totalItems, subtotalCentavos, updateQuantity, removeItem, clearCart } = useCart();
  const { status } = useSession();
  const [personal, setPersonal] = useState(initialPersonal);
  const [address, setAddress] = useState(initialAddress);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        setIsProfileLoading(true);
        const response = await fetch("/api/user/profile");
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.profile || cancelled) {
          return;
        }
        setPersonal((previous) => ({
          ...previous,
          fullName: data.profile.full_name ?? previous.fullName,
          email: data.profile.email ?? previous.email,
          phone: data.profile.phone ?? previous.phone,
          document: data.profile.document ?? previous.document,
        }));
        setAddress((previous) => ({
          ...previous,
          cep: data.profile.cep ?? previous.cep,
          street: data.profile.street ?? previous.street,
          number: data.profile.number ?? previous.number,
          complement: data.profile.complement ?? previous.complement,
          neighborhood: data.profile.neighborhood ?? previous.neighborhood,
          city: data.profile.city ?? previous.city,
          state: data.profile.state ?? previous.state,
        }));
      } finally {
        if (!cancelled) {
          setIsProfileLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const enderecoCompleto = useMemo(
    () =>
      [
        `${address.street}, ${address.number}`.trim(),
        address.complement.trim(),
        address.neighborhood.trim(),
        `${address.city} - ${address.state}`.trim(),
        `CEP ${address.cep}`.trim(),
      ]
        .filter(Boolean)
        .join(" | "),
    [address],
  );

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setIsLoginLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Login invalido. Revise email e senha.");
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel entrar.");
    } finally {
      setIsLoginLoading(false);
    }
  }

  async function handleCepBlur() {
    const cepLimpo = address.cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      return;
    }

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.erro) {
        throw new Error("CEP nao encontrado.");
      }

      setAddress((previous) => ({
        ...previous,
        street: data.logradouro || previous.street,
        neighborhood: data.bairro || previous.neighborhood,
        city: data.localidade || previous.city,
        state: data.uf || previous.state,
      }));
    } catch (err) {
      setError(err.message || "Nao foi possivel buscar o CEP.");
    } finally {
      setIsCepLoading(false);
    }
  }

  async function handleFinish(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (status !== "authenticated" && !isGuestCheckout) {
        throw new Error("Entre na sua conta para continuar com a compra.");
      }
      if (!items.length) {
        throw new Error("Seu carrinho esta vazio.");
      }
      if (totalItems < MIN_CHECKOUT_TOTAL_ITEMS) {
        throw new Error(MIN_CHECKOUT_TOTAL_ITEMS_ERROR_MESSAGE);
      }
      if (!personal.fullName.trim() || !personal.email.trim()) {
        throw new Error("Preencha os dados pessoais obrigatorios.");
      }
      if (!address.cep.trim() || !address.street.trim() || !address.number.trim()) {
        throw new Error("Preencha CEP, rua e numero.");
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerEmail: personal.email.trim(),
          nomeCliente: personal.fullName.trim(),
          telefone: personal.phone.trim(),
          endereco: enderecoCompleto,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Nao foi possivel iniciar o pagamento.");
      }

      clearCart();
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Erro inesperado. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleFinish}
      className="space-y-8 rounded-xl border border-[#EAEAEA] bg-[#FBFBFA] p-6 text-[#2F3437] sm:p-8"
    >
      <div className="border-b border-[#EAEAEA] pb-5">
        <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[#111111]">
          Finalização do pedido
        </h2>
        {isProfileLoading ? (
          <p className="mt-2 text-xs uppercase tracking-[0.06em] text-[#787774]">Carregando seus dados...</p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <div className="space-y-6">
          <section className="space-y-4 rounded-[12px] border border-[#EAEAEA] bg-white p-5 sm:p-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
              {status === "authenticated" || isGuestCheckout ? "1. Dados pessoais" : "1. Entrar na conta"}
            </h3>
            {status !== "authenticated" && !isGuestCheckout ? (
              <div className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
                />
                <input
                  type="password"
                  required
                  placeholder="Senha"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
                />
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoginLoading || status === "loading"}
                    className="rounded-md bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#333333] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoginLoading ? "Entrando..." : "Entrar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setIsGuestCheckout(true);
                      setLoginPassword("");
                    }}
                    className="rounded-md border border-[#EAEAEA] bg-white px-5 py-3 text-sm font-medium text-[#2F3437] transition hover:border-[#D4D4D2] hover:bg-[#F9F9F8]"
                  >
                    Não tenho conta
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Nome completo"
                  value={personal.fullName}
                  onChange={(event) => setPersonal((previous) => ({ ...previous, fullName: event.target.value }))}
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={personal.email}
                  onChange={(event) => setPersonal((previous) => ({ ...previous, email: event.target.value }))}
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={personal.phone}
                  onChange={(event) => setPersonal((previous) => ({ ...previous, phone: event.target.value }))}
                  className="w-full rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
                />
                {status !== "authenticated" && isGuestCheckout ? (
                  <button
                    type="button"
                    onClick={() => setIsGuestCheckout(false)}
                    className="rounded-md border border-[#EAEAEA] bg-white px-5 py-3 text-sm font-medium text-[#2F3437] transition hover:border-[#D4D4D2] hover:bg-[#F9F9F8]"
                  >
                    Já tenho conta
                  </button>
                ) : null}
              </div>
            )}
          </section>

          {status === "authenticated" || isGuestCheckout ? (
            <section className="grid gap-3 rounded-[12px] border border-[#EAEAEA] bg-white p-5 sm:grid-cols-2 sm:p-6">
              <h3 className="sm:col-span-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                2. Endereco
              </h3>
              <input
                type="text"
                required
                placeholder="CEP"
                value={address.cep}
                onChange={(event) => setAddress((previous) => ({ ...previous, cep: event.target.value }))}
                onBlur={handleCepBlur}
                className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
              />
              <input
                type="text"
                required
                placeholder="Rua"
                value={address.street}
                onChange={(event) => setAddress((previous) => ({ ...previous, street: event.target.value }))}
                className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
              />
              <input
                type="text"
                required
                placeholder="Numero"
                value={address.number}
                onChange={(event) => setAddress((previous) => ({ ...previous, number: event.target.value }))}
                className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
              />
              <input
                type="text"
                placeholder="Complemento"
                value={address.complement}
                onChange={(event) => setAddress((previous) => ({ ...previous, complement: event.target.value }))}
                className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
              />
              <input
                type="text"
                placeholder="Bairro"
                value={address.neighborhood}
                onChange={(event) => setAddress((previous) => ({ ...previous, neighborhood: event.target.value }))}
                className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
              />
              <input
                type="text"
                placeholder="Cidade"
                value={address.city}
                onChange={(event) => setAddress((previous) => ({ ...previous, city: event.target.value }))}
                className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
              />
              <input
                type="text"
                placeholder="Estado"
                value={address.state}
                onChange={(event) => setAddress((previous) => ({ ...previous, state: event.target.value }))}
                className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#111111] placeholder:text-[#787774] outline-none transition focus:border-[#CFCFCD]"
              />
              {isCepLoading ? (
                <p className="sm:col-span-2 text-xs uppercase tracking-[0.06em] text-[#787774]">
                  Buscando endereco pelo CEP...
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="space-y-4 xl:sticky xl:top-6">
          <section className="space-y-5 rounded-[12px] border border-[#EAEAEA] bg-white p-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
              3. Resumo e finalizacao
            </h3>
            <h4 className="font-serif text-xl font-semibold tracking-[-0.02em] text-[#111111]">
              Detalhes dos produtos
            </h4>
            {!items.length ? (
              <p className="text-sm leading-relaxed text-[#787774]">Nenhum item no carrinho no momento.</p>
            ) : (
              <div className="divide-y divide-[#EAEAEA]">
                {items.map((item) => (
                  <article key={item.slug} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                      <div className="flex min-w-0 gap-3 sm:flex-1 sm:gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#EAEAEA] bg-[#F9F9F8] sm:h-24 sm:w-24">
                        {item.imagemUrl ? (
                          <img
                            src={item.imagemUrl}
                            alt={item.nomeProduto}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.06em] text-[#787774]">
                            Sem foto
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="line-clamp-2 text-sm font-semibold text-[#111111] sm:truncate">{item.nomeProduto}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-xs text-[#787774]">Quantidade:</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem(item.slug);
                                return;
                              }
                              updateQuantity(item.slug, item.quantity - 1);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#EAEAEA] bg-white text-sm font-semibold text-[#2F3437] transition hover:border-[#D4D4D2] hover:bg-[#F9F9F8] sm:h-6 sm:w-6"
                            aria-label={`Diminuir quantidade de ${item.nomeProduto}`}
                          >
                            -
                          </button>
                          <span className="min-w-5 text-center text-xs font-semibold text-[#111111]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                            disabled={item.estoque > 0 && item.quantity >= item.estoque}
                            className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#EAEAEA] bg-white text-sm font-semibold text-[#2F3437] transition hover:border-[#D4D4D2] hover:bg-[#F9F9F8] disabled:cursor-not-allowed disabled:opacity-60 sm:h-6 sm:w-6"
                            aria-label={`Aumentar quantidade de ${item.nomeProduto}`}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs text-[#787774]">Preco unitario: {formatPrice(item.precoCentavos)}</p>
                        <p className="text-xs text-[#787774]">Estoque disponivel: {item.estoque}</p>
                      </div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#111111] sm:pt-1">
                        {formatPrice(item.precoCentavos * item.quantity)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="border-t border-[#EAEAEA] pt-4 text-sm font-semibold text-[#111111]">
              Total do pedido: {formatPrice(subtotalCentavos)}
            </p>
          </section>

          {error ? (
            <p className="rounded-md border border-[#F5D1D3] bg-[#FDEBEC] px-4 py-3 text-sm text-[#9F2F2D]">{error}</p>
          ) : null}

          {(status === "authenticated" || isGuestCheckout) && totalItems < MIN_CHECKOUT_TOTAL_ITEMS ? (
            <p className="rounded-md border border-[#F5D1D3] bg-[#FDEBEC] px-4 py-3 text-sm text-[#9F2F2D]">
              {MIN_CHECKOUT_TOTAL_ITEMS_ERROR_MESSAGE}
            </p>
          ) : null}

          <div className="flex">
            <button
              type="submit"
              disabled={
                isLoading ||
                (status !== "authenticated" && !isGuestCheckout) ||
                ((status === "authenticated" || isGuestCheckout) && totalItems < MIN_CHECKOUT_TOTAL_ITEMS)
              }
              className="w-full rounded-md bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#333333] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading
                ? "Redirecionando..."
                : status !== "authenticated" && !isGuestCheckout
                  ? "Entre para finalizar a compra"
                  : "FINALIZAR COMPRA"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}