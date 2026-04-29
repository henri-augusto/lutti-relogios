"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function parseHashToken() {
  if (typeof window === "undefined") {
    return { accessToken: "", tokenType: "", expiresIn: "", scope: "" };
  }

  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);

  return {
    accessToken: params.get("access_token") || "",
    tokenType: params.get("token_type") || "",
    expiresIn: params.get("expires_in") || "",
    scope: params.get("scope") || "",
  };
}

export default function OlistOAuthPage() {
  const searchParams = useSearchParams();
  const [tokenData, setTokenData] = useState({
    accessToken: "",
    tokenType: "",
    expiresIn: "",
    scope: "",
  });
  const [copyFeedback, setCopyFeedback] = useState("");

  const queryError = searchParams.get("error");

  useEffect(() => {
    const parsed = parseHashToken();
    if (parsed.accessToken) {
      setTokenData(parsed);
      window.history.replaceState(null, "", "/olist/oauth");
    }
  }, []);

  useEffect(() => {
    if (!copyFeedback) {
      return undefined;
    }

    const timeout = setTimeout(() => setCopyFeedback(""), 2500);
    return () => clearTimeout(timeout);
  }, [copyFeedback]);

  const hasToken = Boolean(tokenData.accessToken);

  const expiresText = useMemo(() => {
    if (!tokenData.expiresIn) {
      return "";
    }

    const parsed = Number(tokenData.expiresIn);
    if (!Number.isFinite(parsed)) {
      return tokenData.expiresIn;
    }

    const minutes = Math.floor(parsed / 60);
    if (minutes < 1) {
      return `${parsed}s`;
    }
    return `${minutes} min`;
  }, [tokenData.expiresIn]);

  async function handleCopyToken() {
    try {
      await navigator.clipboard.writeText(tokenData.accessToken);
      setCopyFeedback("Token copiado.");
    } catch {
      setCopyFeedback("Nao foi possivel copiar automaticamente.");
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-[#2F3437] sm:text-3xl">
          Conectar Tiny/Olist (OAuth 2)
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Use o botao abaixo para autorizar o acesso. Ao finalizar, o token sera exibido nesta tela
          para voce copiar e salvar manualmente no seu arquivo `.env.local`.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/api/olist/oauth/start"
            className="inline-flex items-center justify-center rounded-md bg-[#111111] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#333333]"
          >
            Conectar com Tiny/Olist
          </Link>
        </div>

        {queryError ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {queryError}
          </p>
        ) : null}

        {hasToken ? (
          <div className="mt-6 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-sm font-medium text-emerald-900">Token gerado com sucesso.</p>
            <label className="block text-xs font-semibold uppercase tracking-wide text-stone-600">
              Access Token
            </label>
            <textarea
              readOnly
              value={tokenData.accessToken}
              className="min-h-28 w-full rounded-md border border-[#D9D9D9] bg-white p-3 text-xs text-stone-700"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
              <span>Tipo: {tokenData.tokenType || "Bearer"}</span>
              {expiresText ? <span>Expira em: {expiresText}</span> : null}
              {tokenData.scope ? <span>Scope: {tokenData.scope}</span> : null}
            </div>
            <button
              type="button"
              onClick={handleCopyToken}
              className="inline-flex items-center justify-center rounded-md border border-[#D9D9D9] bg-white px-3 py-2 text-sm font-medium text-[#2F3437] transition-colors hover:bg-[#F7F6F3]"
            >
              Copiar token
            </button>
            {copyFeedback ? <p className="text-xs text-stone-600">{copyFeedback}</p> : null}
            <p className="text-xs text-stone-600">
              Depois de copiar, adicione no `.env.local` como `OLIST_API_TOKEN=seu_token`.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
