import Link from "next/link";

export const metadata = {
  title: "Compra realizada | Luti Relogios",
  description: "Pagamento concluido com sucesso.",
};

export default function SucessoPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center px-4 py-16 text-center sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
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
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
        Verifique seu e-mail: enviamos a confirmação e os detalhes do pedido para a caixa de entrada
        cadastrada na compra.
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
