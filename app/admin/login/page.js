"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const inputClasses =
  "w-full rounded-2xl border border-stone-200/80 bg-white/95 px-4 py-2.5 text-sm text-stone-900 outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:-translate-y-px focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const errorParam = searchParams.get("error");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busyLogin, setBusyLogin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 60);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (errorParam === "forbidden") {
      setError("Sua conta nao tem permissao de administrador.");
    }
  }, [errorParam]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setBusyLogin(true);
    setError("");

    const result = await signIn("credentials", {
      email: loginData.email,
      password: loginData.password,
      redirect: false,
    });

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Credenciais invalidas."
          : "Nao foi possivel entrar agora. Tente novamente em instantes.",
      );
      setBusyLogin(false);
      return;
    }

    const safeCallback = callbackUrl.startsWith("/admin") ? callbackUrl : "/admin";
    window.location.href = safeCallback;
  };

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-10 sm:px-6">
      <section
        className={`w-full rounded-[2rem] border border-stone-300/70 bg-stone-100/70 p-1.5 shadow-[0_20px_60px_rgba(41,37,36,0.12)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="rounded-[calc(2rem-0.375rem)] border border-white/60 bg-white/70 p-6 backdrop-blur-sm sm:p-7">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Area restrita</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Painel administrativo</h1>
          <p className="mt-1 text-sm text-stone-600">Entre com uma conta autorizada para gerenciar a loja.</p>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <form className="mt-6 grid gap-4" onSubmit={handleLoginSubmit}>
            <label>
              <span className="mb-1 block text-sm font-medium text-stone-700">Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                className={inputClasses}
                value={loginData.email}
                onChange={(event) => setLoginData((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-stone-700">Senha</span>
              <input
                required
                type="password"
                autoComplete="current-password"
                className={inputClasses}
                value={loginData.password}
                onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
              />
            </label>
            <button
              type="submit"
              disabled={busyLogin}
              className="mt-1 inline-flex w-full items-center justify-center rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyLogin ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-600">
            <Link href="/" className="font-medium text-stone-800 underline-offset-2 hover:underline">
              Voltar para a loja
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4 py-10">
          <p className="text-sm text-stone-600">Carregando...</p>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
