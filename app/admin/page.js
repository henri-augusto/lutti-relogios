import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-stone-900">Painel administrativo</h1>
        <p className="mt-2 text-sm text-stone-600">
          Acesse as acoes principais do painel para conectar a Olist e gerenciar os produtos.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/olist/oauth"
            className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Conectar com Olist
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
