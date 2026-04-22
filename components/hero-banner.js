import Link from "next/link";

const whatsappHref = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5500000000000"}`;

export default function HeroBanner() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
      <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-10">

        {/* ── Text column ── */}
        <div className="flex-1 space-y-8">

          {/* Eyebrow badge */}
          <div className="anim-fade-up anim-delay-1 inline-flex items-center gap-2 rounded-full border border-stone-300/50 bg-stone-100/60 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Curadoria Premium · 2025
            </span>
          </div>

          {/* Headline */}
          <h1 className="anim-fade-up anim-delay-2 max-w-xl font-serif text-5xl font-bold leading-[1.08] text-stone-900 sm:text-6xl lg:text-[4.25rem]">
            O relógio certo<br />
            <em className="not-italic text-amber-700/75">transforma</em><br />
            quem você é.
          </h1>

          {/* Body copy */}
          <p className="anim-fade-up anim-delay-3 max-w-md text-base leading-relaxed text-stone-500 sm:text-[1.0625rem]">
            Seleção com garantia de 12 meses, envio expresso e suporte exclusivo.
            Do clássico ao contemporâneo — encontre o modelo que fala por você.
          </p>

          {/* CTAs */}
          <div className="anim-fade-up anim-delay-4 flex flex-wrap items-center gap-3">

            {/* Primary — button-in-button */}
            <Link
              href="/catalogo"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-stone-700 active:scale-[0.97]"
            >
              Explorar Catálogo
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>

            {/* Secondary — WhatsApp */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-300/60 px-5 py-3 text-sm font-medium text-stone-700 transition-all duration-300 hover:border-stone-400 hover:bg-stone-100/60"
            >
              <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Falar com especialista
            </a>
          </div>
        </div>

        {/* ── Feature cards — Z-Cascade, Double-Bezel ── */}
        <div className="anim-fade-up anim-delay-5 hidden w-[17.5rem] shrink-0 flex-col gap-4 lg:flex">

          {/* Card 1 — Garantia */}
          <div className="rounded-[1.75rem] border border-stone-200/50 bg-stone-100/60 p-1.5">
            <div className="rounded-[calc(1.75rem-0.375rem)] bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="font-serif text-2xl font-bold text-stone-900">12 meses</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600/80">de garantia</p>
              <p className="mt-2.5 text-sm leading-relaxed text-stone-400">Suporte especializado incluso em toda compra.</p>
            </div>
          </div>

          {/* Card 2 — Envio (offset right for Z-cascade depth) */}
          <div className="ml-6 rounded-[1.75rem] border border-amber-100/60 bg-amber-50/50 p-1.5">
            <div className="rounded-[calc(1.75rem-0.375rem)] bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-50">
                <svg className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <p className="font-serif text-2xl font-bold text-stone-900">Mesmo dia</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600/80">envio expresso</p>
              <p className="mt-2.5 text-sm leading-relaxed text-stone-400">Pedidos aprovados até meio-dia saem hoje.</p>
            </div>
          </div>

          {/* Card 3 — Atendimento (slight mid-offset) */}
          <div className="ml-3 rounded-[1.75rem] border border-stone-200/50 bg-stone-50/60 p-1.5">
            <div className="rounded-[calc(1.75rem-0.375rem)] bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="font-serif text-2xl font-bold text-stone-900">Premium</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600/80">atendimento</p>
              <p className="mt-2.5 text-sm leading-relaxed text-stone-400">Consultor exclusivo pelo WhatsApp para cada cliente.</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
