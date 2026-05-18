import Link from "next/link";

export const metadata = {
  title: "Recuperar senha | Luti Relogios",
  description: "Solicite a recuperacao da sua senha na Luti Relogios.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/mao_segunrando_relogio.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-stone-900/45" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full max-w-xl rounded-[2rem] border border-stone-300/70 bg-stone-100/70 p-1.5 shadow-[0_20px_60px_rgba(41,37,36,0.12)]">
          <div className="rounded-[calc(2rem-0.375rem)] border border-white/60 bg-white/70 p-6 backdrop-blur-sm sm:p-7">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Esqueci minha senha</h1>
            <p className="mt-1 text-sm text-stone-600">
              Entre em contato com o suporte da Luti para redefinir sua senha.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700"
              >
                Voltar para login
              </Link>
              <a
                href="mailto:contato@luti.com.br"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                Falar com suporte
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
