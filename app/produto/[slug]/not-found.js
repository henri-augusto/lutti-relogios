import Link from "next/link";

export default function NotFoundProduto() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-serif text-3xl font-bold text-slate-900">Produto nao encontrado</h1>
      <p className="mt-3 text-slate-600">
        O produto solicitado nao existe ou nao esta mais disponivel.
      </p>
      <Link
        href="/catalogo"
        className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Voltar para o catalogo
      </Link>
    </div>
  );
}
