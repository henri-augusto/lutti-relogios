import Link from "next/link";
import Image from "next/image";

const whatsappHref = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5500000000000"}`;

export default function HeroBanner() {
  return (
    <section className="flex min-h-dvh w-full flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-14 pt-24 sm:px-6 sm:py-16 sm:pt-28 lg:px-8 lg:py-20 lg:pt-32">
      <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-0">

        {/* ── Text column ── */}
        <div className="flex-1 space-y-8">

          {/* Eyebrow badge */}
          <div className="anim-fade-up anim-delay-1 inline-flex items-center gap-2 rounded-full border border-stone-300/50 bg-stone-100/60 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Curadoria Premium · since 1994
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

        {/* ── Hero collage: shell + Z-axis cascade (lg+); sem núcleo interno ── */}
        <div className="anim-fade-up anim-delay-5 relative w-full min-w-0 lg:-ml-8 lg:w-[min(100%,26.5rem)] lg:flex-[0_0_auto] lg:shrink-0 xl:-ml-11">
            <div className="relative h-[340px] w-full overflow-hidden rounded-[calc(2rem-5px)] sm:h-[400px] lg:h-[500px]">
              <div className="absolute left-1 top-2 z-0 h-[52%] w-[56%] sm:left-1.5 sm:top-2.5 lg:left-2 lg:top-3 lg:-rotate-[1.1deg]">
                <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] shadow-[0_28px_72px_-40px_rgba(28,25,23,0.14)]">
                  <Image
                    src="/image-hero.jpeg"
                    alt="Relógio premium em destaque"
                    fill
                    priority
                    className="object-cover object-[28%_22%]"
                    sizes="(min-width: 1024px) 20rem, 45vw"
                  />
                </div>
              </div>
              <div className="absolute bottom-2 right-4 z-10 h-[52%] w-[56%] sm:bottom-2.5 sm:right-5 lg:bottom-3 lg:right-7 lg:rotate-[1.1deg]">
                <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] shadow-[0_32px_80px_-42px_rgba(28,25,23,0.16)]">
                  <Image
                    src="/image-nossa-historia.jpeg"
                    alt="Nossa história"
                    fill
                    className="object-cover object-center"
                    sizes="(min-width: 1024px) 20rem, 45vw"
                  />
                </div>
              </div>
            </div>
        </div>

      </div>
      </div>
    </section>
  );
}
