import Link from "next/link";
import { createWhatsAppCheckoutSuccessLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Compra realizada | Luti Relogios",
  description: "Pagamento concluido com sucesso.",
};

export default async function SucessoPage({ searchParams }) {
  const resolvedParams = await Promise.resolve(searchParams);
  const sessionId =
    typeof resolvedParams?.session_id === "string"
      ? resolvedParams.session_id
      : "";
  const whatsappHref = createWhatsAppCheckoutSuccessLink(sessionId);

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
            <p className="text-center text-base font-semibold leading-relaxed text-slate-900 sm:text-left sm:text-lg">
              Fique atento! Entraremos em contato em breve para confirmar os detalhes do seu pedido.
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-600">
          Confira também seu e-mail cadastrado na compra — você pode receber uma confirmação automática do
          pagamento.
        </p>

        <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-4 sm:px-5">
          <p className="text-sm font-medium text-slate-800">
            Prefere falar agora? Envie uma mensagem pelo WhatsApp para confirmar seu pedido.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_rgba(5,150,105,0.55)] transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 sm:w-auto"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Enviar mensagem no WhatsApp
          </a>
        </div>

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