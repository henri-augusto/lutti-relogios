"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const inputClasses =
  "w-full rounded-2xl border border-stone-200/80 bg-white/95 px-4 py-2.5 text-sm text-stone-900 outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:-translate-y-px focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70";

export default function AuthPanel() {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyLogin, setBusyLogin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 60);
    return () => clearTimeout(timeout);
  }, []);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setBusyLogin(true);
    setError("");
    setMessage("");

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

    setMessage("Login realizado com sucesso.");
    setBusyLogin(false);
    window.location.href = "/";
  };

  return (
    <section className="flex w-full justify-center">
      <div
        className={`w-full max-w-md rounded-[2rem] border border-stone-300/70 bg-stone-100/70 p-1.5 shadow-[0_20px_60px_rgba(41,37,36,0.12)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="rounded-[calc(2rem-0.375rem)] border border-white/60 bg-white/70 p-6 backdrop-blur-sm sm:p-7">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Entrar</h1>
          <p className="mt-1 text-sm text-stone-600">Acesse sua conta para continuar.</p>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

          <form className="mt-6 grid gap-4" onSubmit={handleLoginSubmit}>
            <label>
              <span className="mb-1 block text-sm font-medium text-stone-700">Email</span>
              <input
                required
                type="email"
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
                className={inputClasses}
                value={loginData.password}
                onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
              />
            </label>
            <button
              type="submit"
              disabled={busyLogin}
              className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-stone-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busyLogin ? "Entrando..." : "Entrar"}
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-px group-hover:translate-x-1">
                ↗
              </span>
            </button>
          </form>

<<<<<<< HEAD
          <div className="mt-5 flex items-center gap-4 text-sm text-stone-600">
            <Link href="/auth/forgot-password" className="hover:text-stone-900 hover:underline">
              Esqueci minha senha
            </Link>
            <span className="text-stone-400">|</span>
            <Link href="/auth/register" className="font-medium text-stone-800 hover:text-stone-950 hover:underline">
=======
          <div className="mt-5 flex flex-col gap-3 text-sm text-stone-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link
              href="/auth/forgot-password"
              className="inline-flex min-h-11 items-center hover:text-stone-900 hover:underline"
            >
              Esqueci minha senha
            </Link>
            <span className="hidden text-stone-400 sm:inline">|</span>
            <Link
              href="/auth/register"
              className="inline-flex min-h-11 items-center font-medium text-stone-800 hover:text-stone-950 hover:underline"
            >
>>>>>>> main
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
