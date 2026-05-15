import Link from "next/link";

export const metadata = {
  title: "Compra realizada | Luti Relogios",
  description: "Pagamento concluido com sucesso.",
};

export default function SucessoPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-4 py-16 text-center sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">Compra realizada</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Obrigado pela sua compra. Seu pagamento foi processado com sucesso.
        </p>

        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-2xl border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-teal-50/80 to-emerald-50/90 px-4 py-4 text-left shadow-md ring-1 ring-emerald-900/5 sm:px-6 sm:py-5"
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4 sm:text-left">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </span>
            <p className="text-center text-base font-semibold leading-relaxed tracking-tight text-slate-900 sm:text-left sm:text-lg">
              Fique atento! Entraremos em contato em breve para confirmar os detalhes do seu pedido.
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          Confira também seu e-mail cadastrado na compra — você pode receber uma confirmação automática do
          pagamento.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/catalogo"
            className="inline-flex justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Voltar ao catalogo
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
