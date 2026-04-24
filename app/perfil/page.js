"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  document: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export default function PerfilPage() {
  const { status } = useSession();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoading(false);
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function fetchProfile() {
      try {
        const response = await fetch("/api/user/profile");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || "Nao foi possivel carregar o perfil.");
        }

        if (!isMounted) {
          return;
        }

        setForm({
          full_name: result.profile?.full_name ?? "",
          email: result.profile?.email ?? "",
          phone: result.profile?.phone ?? "",
          document: result.profile?.document ?? "",
          cep: result.profile?.cep ?? "",
          street: result.profile?.street ?? "",
          number: result.profile?.number ?? "",
          complement: result.profile?.complement ?? "",
          neighborhood: result.profile?.neighborhood ?? "",
          city: result.profile?.city ?? "",
          state: result.profile?.state ?? "",
        });
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Nao foi possivel carregar o perfil.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [status]);

  function onFieldChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const payload = {
        full_name: form.full_name,
        phone: form.phone,
        document: form.document,
        cep: form.cep,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
      };

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Nao foi possivel salvar o perfil.");
      }

      setForm((previous) => ({
        ...previous,
        full_name: result.profile?.full_name ?? previous.full_name,
        phone: result.profile?.phone ?? previous.phone,
        document: result.profile?.document ?? previous.document,
        cep: result.profile?.cep ?? previous.cep,
        street: result.profile?.street ?? previous.street,
        number: result.profile?.number ?? previous.number,
        complement: result.profile?.complement ?? previous.complement,
        neighborhood: result.profile?.neighborhood ?? previous.neighborhood,
        city: result.profile?.city ?? previous.city,
        state: result.profile?.state ?? previous.state,
      }));
      setSuccessMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar o perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onDeleteAccount() {
    setErrorMessage("");
    setSuccessMessage("");

    const firstConfirm = window.confirm(
      "Tem certeza que deseja encerrar sua conta? Esta acao e permanente.",
    );
    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm("Confirmacao final: deseja encerrar a conta agora?");
    if (!secondConfirm) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/account", { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Nao foi possivel encerrar a conta.");
      }

      await signOut({ callbackUrl: "/" });
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel encerrar a conta.");
      setIsDeleting(false);
    }
  }

  if (status === "loading" || isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-10">Carregando perfil...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-[#2F3437]">Voce precisa estar logado para acessar o perfil.</p>
        <Link href="/auth" className="mt-3 inline-block text-sm font-semibold text-[#2F3437]">
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[#2F3437]">Perfil</h1>
      <p className="mt-2 text-sm text-stone-600">
        Atualize seus dados pessoais e de entrega. Campos com * sao obrigatorios.
      </p>

      {errorMessage ? (
        <p className="mt-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B42318]">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mt-4 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-sm text-[#166534]">
          {successMessage}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-lg border border-[#EAEAEA] p-5">
        <div className="grid gap-1">
          <label className="text-sm font-medium text-[#2F3437]" htmlFor="full_name">
            Nome completo *
          </label>
          <input
            id="full_name"
            name="full_name"
            value={form.full_name}
            onChange={onFieldChange}
            required
            className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium text-[#2F3437]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            value={form.email}
            disabled
            className="h-10 rounded-md border border-[#EAEAEA] bg-[#F7F6F3] px-3 text-sm text-stone-600"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={onFieldChange}
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="document">
              Documento
            </label>
            <input
              id="document"
              name="document"
              value={form.document}
              onChange={onFieldChange}
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="cep">
              CEP *
            </label>
            <input
              id="cep"
              name="cep"
              value={form.cep}
              onChange={onFieldChange}
              required
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="street">
              Rua *
            </label>
            <input
              id="street"
              name="street"
              value={form.street}
              onChange={onFieldChange}
              required
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="number">
              Numero *
            </label>
            <input
              id="number"
              name="number"
              value={form.number}
              onChange={onFieldChange}
              required
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="complement">
              Complemento
            </label>
            <input
              id="complement"
              name="complement"
              value={form.complement}
              onChange={onFieldChange}
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="neighborhood">
              Bairro
            </label>
            <input
              id="neighborhood"
              name="neighborhood"
              value={form.neighborhood}
              onChange={onFieldChange}
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="city">
              Cidade
            </label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={onFieldChange}
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm outline-none focus:border-[#2F3437]"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-[#2F3437]" htmlFor="state">
              Estado
            </label>
            <input
              id="state"
              name="state"
              value={form.state}
              onChange={onFieldChange}
              className="h-10 rounded-md border border-[#EAEAEA] px-3 text-sm uppercase outline-none focus:border-[#2F3437]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-2 h-10 rounded-md bg-[#111111] px-4 text-sm font-medium text-white transition-colors hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Salvando..." : "Salvar alteracoes"}
        </button>
      </form>

      <section className="mt-8 rounded-lg border border-[#FECACA] bg-[#FFF8F8] p-5">
        <h2 className="text-base font-semibold text-[#B42318]">Encerrar conta</h2>
        <p className="mt-2 text-sm text-[#7A271A]">
          Esta acao remove seu cadastro de forma permanente e encerra sua sessao.
        </p>
        <button
          type="button"
          onClick={onDeleteAccount}
          disabled={isDeleting}
          className="mt-4 h-10 rounded-md border border-[#B42318] px-4 text-sm font-medium text-[#B42318] transition-colors hover:bg-[#FEF3F2] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isDeleting ? "Encerrando..." : "Encerrar conta"}
        </button>
      </section>
    </div>
  );
}
