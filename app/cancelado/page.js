import Link from "next/link";

export const metadata = {
  title: "Pagamento cancelado | Luti Relogios",
  description: "O pagamento nao foi concluido.",
};

export default function CanceladoPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center px-4 py-16 text-center sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">Pagamento cancelado</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Voce cancelou o checkout ou o pagamento nao foi concluido. Nenhuma cobranca foi efetuada.
          Pode tentar novamente quando quiser.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/catalogo"
            className="inline-flex justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Ver produtos
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
