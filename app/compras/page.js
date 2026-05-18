"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ComprasPage() {
  const { status } = useSession();

  if (status === "loading") {
    return <div className="mx-auto max-w-4xl px-4 py-10">Carregando compras...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-[#2F3437]">Você precisa estar logado para ver suas compras.</p>
        <Link href="/auth" className="mt-3 inline-block text-sm font-semibold text-[#2F3437]">
          Ir para login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[#2F3437]">Compras</h1>
      <p className="mt-2 text-sm text-stone-600">
        Aqui você vai acompanhar compras anteriores e pedidos realizados.
      </p>
      <div className="mt-6 rounded-lg border border-[#EAEAEA] bg-white p-5 text-sm text-stone-600">
        Ainda não há histórico de compras conectado para esta conta.
      </div>
    </div>
  );
}
