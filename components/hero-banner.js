import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-16 text-white sm:px-10">
      <p className="mb-3 inline-flex rounded-full border border-white/30 px-4 py-1 text-xs uppercase tracking-widest text-white/80">
        Nova colecao
      </p>
      <h1 className="max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
        Relogios de luxo e estilo para todas as ocasioes.
      </h1>
      <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
        Escolha modelos premium com envio rapido, garantia e atendimento direto no WhatsApp.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/catalogo"
          className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
        >
          Ver catalogo
        </Link>
        <a
          href="https://wa.me/5500000000000"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          Falar com consultor
        </a>
      </div>
    </section>
  );
}
