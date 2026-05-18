"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function AdminPage() {
  const { data: session } = useSession();
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-stone-900">Painel administrativo</h1>
        <p className="mt-2 text-sm text-stone-600">
          Gerencie produtos e acompanhe pedidos pagos da loja.
        </p>
        {session?.user?.email ? (
          <p className="mt-3 text-xs text-stone-500">
            Conectado como {session.user.email}.{" "}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="font-medium text-stone-700 underline-offset-2 hover:underline"
            >
              Sair
            </button>
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Verificar pedidos
          </Link>

          <Link
            href="/admin/produtos"
            className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Acessar produtos
          </Link>
        </div>
      </section>
    </main>
  );
}
