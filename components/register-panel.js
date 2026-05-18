"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { formatDocument, validateDocument } from "@/lib/domain/documents";

const inputClasses =
  "w-full rounded-2xl border border-stone-200/80 bg-white/95 px-4 py-2.5 text-sm text-stone-900 outline-none transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:-translate-y-px focus:border-stone-400 focus:ring-4 focus:ring-stone-200/70";

const initialRegister = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  document: "",
  documentType: "cpf",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export default function RegisterPanel() {
  const [registerData, setRegisterData] = useState(initialRegister);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyRegister, setBusyRegister] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 60);
    return () => clearTimeout(timeout);
  }, []);

  const documentType = registerData.documentType === "cnpj" ? "cnpj" : "cpf";

  const labels = useMemo(() => {
    if (documentType === "cnpj") {
      return {
        section: "Dados da empresa",
        name: "Razao social",
        document: "CNPJ",
      };
    }

    return {
      section: "Dados pessoais",
      name: "Nome completo",
      document: "CPF",
    };
  }, [documentType]);

  const handleDocumentTypeChange = (nextType) => {
    setRegisterData((prev) => ({
      ...prev,
      documentType: nextType,
      document: "",
    }));
    setError("");
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (registerData.password !== confirmPassword) {
      setError("As senhas nao conferem.");
      setMessage("");
      return;
    }

    const documentCheck = validateDocument(registerData.document, documentType);
    if (!documentCheck.ok) {
      setError(documentCheck.error);
      setMessage("");
      return;
    }

    setBusyRegister(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body?.error || "Nao foi possivel cadastrar.");
      setBusyRegister(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email: registerData.email,
      password: registerData.password,
      redirect: false,
    });

    if (loginResult?.error) {
      setMessage("Cadastro concluido. Agora faca login.");
      setBusyRegister(false);
      return;
    }

    setMessage("Cadastro e login realizados com sucesso.");
    setBusyRegister(false);
    window.location.href = "/";
  };

  const handleCepBlur = async () => {
    const cep = registerData.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data?.erro) {
      setError("CEP nao encontrado.");
      return;
    }

    setRegisterData((prev) => ({
      ...prev,
      cep,
      street: data.logradouro || prev.street,
      neighborhood: data.bairro || prev.neighborhood,
      city: data.localidade || prev.city,
      state: data.uf || prev.state,
    }));
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div
        className={`rounded-[2rem] border border-stone-300/70 bg-stone-100/70 p-1.5 shadow-[0_20px_60px_rgba(41,37,36,0.12)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="rounded-[calc(2rem-0.375rem)] border border-white/60 bg-white/70 p-6 backdrop-blur-sm sm:p-7">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Criar conta</h1>
          <p className="mt-1 text-sm text-stone-600">Cadastre-se na Luti com seus dados completos.</p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

          <form className="mt-6 space-y-5" onSubmit={handleRegisterSubmit}>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">{labels.section}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleDocumentTypeChange("cpf")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    documentType === "cpf"
                      ? "bg-stone-900 text-white"
                      : "border border-stone-300 bg-white text-stone-700"
                  }`}
                >
                  Pessoa fisica (CPF)
                </button>
                <button
                  type="button"
                  onClick={() => handleDocumentTypeChange("cnpj")}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    documentType === "cnpj"
                      ? "bg-emerald-800 text-white"
                      : "border border-stone-300 bg-white text-stone-700"
                  }`}
                >
                  Pessoa juridica (CNPJ)
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">{labels.name}</span>
                  <input
                    required
                    className={inputClasses}
                    value={registerData.fullName}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, fullName: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">{labels.document}</span>
                  <input
                    required
                    inputMode="numeric"
                    className={inputClasses}
                    placeholder={documentType === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                    value={registerData.document}
                    onChange={(event) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        document: formatDocument(event.target.value, documentType),
                      }))
                    }
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-stone-700">Telefone</span>
                  <input
                    className={inputClasses}
                    value={registerData.phone}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Endereco</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">CEP</span>
                  <input
                    required
                    className={inputClasses}
                    value={registerData.cep}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, cep: event.target.value }))}
                    onBlur={handleCepBlur}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Rua</span>
                  <input
                    required
                    className={inputClasses}
                    value={registerData.street}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, street: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Numero</span>
                  <input
                    required
                    className={inputClasses}
                    value={registerData.number}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, number: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Complemento</span>
                  <input
                    className={inputClasses}
                    value={registerData.complement}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, complement: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Bairro</span>
                  <input
                    required
                    className={inputClasses}
                    value={registerData.neighborhood}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, neighborhood: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Cidade</span>
                  <input
                    required
                    className={inputClasses}
                    value={registerData.city}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Estado</span>
                  <input
                    required
                    className={inputClasses}
                    maxLength={2}
                    value={registerData.state}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, state: event.target.value.toUpperCase() }))}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">Autenticacao</p>
              <div className="grid gap-4">
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Email</span>
                  <input
                    required
                    type="email"
                    className={inputClasses}
                    value={registerData.email}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Senha</span>
                  <input
                    required
                    minLength={6}
                    type="password"
                    className={inputClasses}
                    value={registerData.password}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-sm font-medium text-stone-700">Confirmar senha</span>
                  <input
                    required
                    minLength={6}
                    type="password"
                    className={inputClasses}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={busyRegister}
              className="group mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-stone-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busyRegister ? "Cadastrando..." : "Criar conta"}
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-px group-hover:translate-x-1">
                ↗
              </span>
            </button>
          </form>

          <p className="mt-5 text-sm text-stone-600">
            Ja tem conta?{" "}
            <Link href="/auth" className="font-medium text-stone-800 hover:text-stone-950 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
