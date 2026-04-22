"use client";

import { useMemo, useState } from "react";
import { createWhatsAppCustomLink } from "@/lib/whatsapp";

const baseInputClasses =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200";

export default function RegistrationForm() {
  const [customerType, setCustomerType] = useState("retail");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    document: "",
    businessName: "",
    companyName: "",
    contactName: "",
  });

  const labels = useMemo(() => {
    if (customerType === "reseller") {
      return {
        title: "Cadastro de revendedor",
        subtitle: "Preencha os dados para receber o catálogo de revenda no WhatsApp.",
        document: "CNPJ",
        entityName: "Razao social",
        extraName: "Nome fantasia",
        person: "Responsavel pela compra",
      };
    }

    return {
      title: "Cadastro de cliente",
      subtitle: "Cadastro opcional para agilizar seu atendimento.",
      document: "CPF",
      entityName: "Cidade/Estado",
      extraName: "Como encontrou a Luti?",
      person: "Nome completo",
    };
  }, [customerType]);

  const onTypeChange = (nextType) => {
    setCustomerType(nextType);
  };

  const onFieldChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const lines = [
      "Olá! Quero realizar meu cadastro no site da Luti.",
      `Tipo de cliente: ${customerType === "reseller" ? "Revendedor" : "Cliente varejo"}`,
      `Nome: ${formData.fullName || formData.contactName || "-"}`,
      `Email: ${formData.email || "-"}`,
      `Telefone: ${formData.phone || "-"}`,
      `${labels.document}: ${formData.document || "-"}`,
      `${labels.entityName}: ${formData.companyName || "-"}`,
      `${labels.extraName}: ${formData.businessName || "-"}`,
      `${labels.person}: ${formData.contactName || formData.fullName || "-"}`,
    ];

    window.open(createWhatsAppCustomLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="mx-auto w-full max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-serif text-3xl font-bold text-stone-900">{labels.title}</h1>
      <p className="mt-2 text-sm text-stone-600">{labels.subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onTypeChange("retail")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            customerType === "retail"
              ? "bg-stone-900 text-white"
              : "border border-stone-300 bg-white text-stone-700"
          }`}
        >
          Cliente comum
        </button>
        <button
          type="button"
          onClick={() => onTypeChange("reseller")}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            customerType === "reseller"
              ? "bg-emerald-700 text-white"
              : "border border-stone-300 bg-white text-stone-700"
          }`}
        >
          Revendedor
        </button>
      </div>

      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-stone-700">{labels.person}</span>
          <input className={baseInputClasses} value={formData.fullName} onChange={onFieldChange("fullName")} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-stone-700">Email</span>
          <input type="email" className={baseInputClasses} value={formData.email} onChange={onFieldChange("email")} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-stone-700">Telefone</span>
          <input className={baseInputClasses} value={formData.phone} onChange={onFieldChange("phone")} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-stone-700">{labels.document}</span>
          <input className={baseInputClasses} value={formData.document} onChange={onFieldChange("document")} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium text-stone-700">{labels.entityName}</span>
          <input className={baseInputClasses} value={formData.companyName} onChange={onFieldChange("companyName")} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-stone-700">{labels.extraName}</span>
          <input className={baseInputClasses} value={formData.businessName} onChange={onFieldChange("businessName")} />
        </label>

        <div className="sm:col-span-2 mt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Enviar cadastro via WhatsApp
          </button>
        </div>
      </form>
    </section>
  );
}
