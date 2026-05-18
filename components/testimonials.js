"use client";

import { useEffect, useRef, useState } from "react";

/** @typedef {{ name: string; rating: number; comment: string }} TestimonialItem */

const DEFAULT_TESTIMONIALS = /** @type {const} */ (
  [
    {
      name: "Gustavo Salomão",
      rating: 5,
      comment:
        "Ótimo atendimento, marcas e relógios excelentes!!!",
    },
    {
      name: "Ana C",
      rating: 5,
      comment:
        "Ótimo atendimendo e relógios com preço bom e garantia.",
    },
    {
      name: "Carlos Albino Simões",
      rating: 5,
      comment:
        "Excelentes Profissionais...",
    },
    {
      name: "Jurema Cristiane Bastos Moscogliato",
      rating: 5,
      comment:
        "Preço acessível, variedade de modelos, produtos originais...",
    },
    {
      name: "Enzo H",
      rating: 5,
      comment:
        "Loja boa e bons produtos!",
    },
  ]
);

const AVATAR_PALETTES = [
  "bg-amber-100 text-amber-900 ring-amber-200/60",
  "bg-stone-200 text-stone-800 ring-stone-300/50",
  "bg-emerald-100 text-emerald-900 ring-emerald-200/60",
  "bg-sky-100 text-sky-900 ring-sky-200/60",
  "bg-rose-100 text-rose-900 ring-rose-200/60",
  "bg-violet-100 text-violet-900 ring-violet-200/60",
];

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function paletteIndex(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h + name.charCodeAt(i) * (i + 1)) % 997;
  return h % AVATAR_PALETTES.length;
}

function clampRating(n) {
  if (Number.isNaN(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(Number(n))));
}

/**
 * @param {{ value: number; perfect?: boolean }} props
 */
function StarRating({ value, perfect = false }) {
  const v = clampRating(value);
  const size = perfect ? "h-4 w-4 sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" : "h-3.5 w-3.5 sm:h-4 sm:w-4";
  return (
    <div
      className="flex items-center justify-start gap-0.5 sm:gap-1"
      role="img"
      aria-label={`Nota ${v} de 5`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < v;
        return (
          <span
            key={i}
            className={
              filled
                ? perfect
                  ? "text-amber-500 drop-shadow-[0_1px_2px_rgba(217,119,6,0.35)]"
                  : "text-amber-500 drop-shadow-sm"
                : "text-stone-200"
            }
            aria-hidden
          >
            <svg className={size} viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

function GoogleIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * @param {{
 *  testimonial: TestimonialItem;
 *  index: number;
 *  visible: boolean;
 *  stagger?: boolean;
 * }} props
 */
function TestimonialCard({ testimonial, index, visible, stagger = true }) {
  const { name, rating, comment } = testimonial;
  const initials = getInitials(name);
  const palette = AVATAR_PALETTES[paletteIndex(name)];
  const isPerfect = clampRating(rating) === 5;

  return (
    <article
      className={[
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white/95 p-5 sm:p-7",
        "shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.05)]",
        "transition-all duration-500 ease-out will-change-transform motion-reduce:translate-y-0 motion-reduce:opacity-100",
        "hover:-translate-y-1.5 hover:shadow-[0_1px_0_rgba(0,0,0,0.04),0_20px_48px_rgba(0,0,0,0.09)]",
        isPerfect
          ? "border-amber-200/80 ring-1 ring-amber-300/30 hover:border-amber-300/90"
          : "border-stone-200/80 hover:border-stone-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      ].join(" ")}
      style={{
        transitionDelay:
          stagger && visible ? `${index * 80}ms` : "0ms",
      }}
    >
      {isPerfect ? (
        <div
          className="absolute right-0 top-0 h-20 w-20 rounded-bl-[100%] bg-gradient-to-br from-amber-400/10 via-amber-500/5 to-transparent"
          aria-hidden
        />
      ) : null}
      {isPerfect ? (
        <div className="mb-3.5 flex flex-wrap items-center justify-start gap-2">
          <span className="inline-flex items-center rounded-full border border-amber-200/90 bg-amber-50/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-900/90 sm:text-[10px] sm:tracking-[0.12em]">
            Nota máxima
          </span>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-inset sm:h-12 sm:w-12 sm:text-sm ${
              isPerfect ? "ring-amber-200/50" : ""
            } ${palette}`}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <h3 className="line-clamp-3 text-left text-sm font-medium leading-snug tracking-tight text-stone-900 sm:line-clamp-2 sm:text-base sm:font-semibold">
              {name}
            </h3>
            <div className="mt-2 flex justify-start sm:mt-1.5">
              <StarRating value={rating} perfect={isPerfect} />
            </div>
          </div>
        </div>
        <div
          className={`shrink-0 self-start rounded-full border p-1.5 ${
            isPerfect
              ? "border-amber-200/60 bg-amber-50/60"
              : "border-stone-100 bg-stone-50/80"
          }`}
          title="Avaliação no Google"
        >
          <GoogleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>

      <p
        className={[
          "mt-4 flex-1 text-left font-serif text-[0.9375rem] font-normal not-italic leading-[1.75] sm:mt-5 sm:text-base sm:leading-[1.7]",
          isPerfect ? "text-stone-700" : "text-stone-600",
        ].join(" ")}
      >
        &ldquo;{comment}&rdquo;
      </p>

      <p className="mt-4 border-t border-stone-100/90 pt-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-400 sm:mt-5 sm:pt-4 sm:text-[10px] sm:tracking-[0.16em]">
        Verificado no Google
      </p>
    </article>
  );
}

const DEFAULT_GOOGLE_REVIEWS_URL =
  "https://www.google.com/search?q=Luti+Rel%C3%B3gios+avalia%C3%A7%C3%B5es+Google";

/**
 * Depoimentos de clientes: faixa horizontal infinita (mesmo padrão de `brands-section.js` / `.brands-marquee` em `globals.css`).
 * @param {{
 *  testimonials?: TestimonialItem[];
 *  className?: string;
 *  title?: string;
 *  id?: string;
 *  googleReviewsUrl?: string;
 *  subtitle?: string;
 * }} [props]
 */
export default function Testimonials({
  testimonials = DEFAULT_TESTIMONIALS,
  className = "",
  title = "Confiança que se constrói com cada venda",
  id = "depoimentos",
  googleReviewsUrl = DEFAULT_GOOGLE_REVIEWS_URL,
  subtitle = "Depoimentos reais de quem comprou e recomenda a Luti Relógios.",
}) {
  const list =
    Array.isArray(testimonials) && testimonials.length > 0
      ? testimonials
      : DEFAULT_TESTIMONIALS;
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  const duplicatedTestimonials = list.length > 1 ? [...list, ...list] : list;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={`${id}-heading`}
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      <div className="mx-auto w-full max-w-6xl">
        <div
          className={[
            "relative overflow-hidden rounded-2xl border border-stone-200/70",
            "sm:rounded-[1.35rem]",
            "bg-gradient-to-b from-white via-stone-50/50 to-[#F9F7F4]",
            "px-4 py-10 sm:px-9 sm:py-16 lg:px-14 lg:py-[5.5rem]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.04),0_24px_64px_rgba(0,0,0,0.05)]",
          ].join(" ")}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_280px_at_50%_-8%,rgba(201,169,110,0.12),transparent)] sm:bg-[radial-gradient(600px_320px_at_50%_-10%,rgba(201,169,110,0.12),transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-2xl text-balance sm:max-w-3xl">
            <p className="text-center text-[9px] font-medium uppercase leading-normal tracking-[0.24em] text-stone-500 sm:text-[11px] sm:font-semibold sm:tracking-[0.28em]">
              Google Reviews
            </p>
            <h2
              id={`${id}-heading`}
              className="mt-2.5 text-center font-serif text-[1.5rem] font-normal leading-[1.22] tracking-[-0.02em] text-stone-900 sm:mt-3.5 sm:text-3xl sm:leading-[1.2] sm:tracking-[-0.01em] lg:mt-4 lg:text-[2.125rem] lg:leading-[1.18]"
            >
              {title}
            </h2>
            <p className="mx-auto mt-3 max-w-[36ch] text-center text-[0.8125rem] font-normal leading-[1.7] text-stone-600 sm:mt-5 sm:max-w-2xl sm:text-base sm:leading-[1.65] sm:text-pretty">
              {subtitle}
            </p>
            <div className="mx-auto mt-6 flex w-full max-w-sm flex-col items-stretch sm:mt-7 sm:max-w-none sm:items-center">
              <div className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-stone-200/80 bg-white/85 px-3.5 py-3 text-center text-xs font-normal leading-snug text-stone-600 shadow-sm backdrop-blur-sm sm:rounded-full sm:px-4 sm:py-2.5 sm:text-left sm:text-sm sm:font-normal sm:leading-normal">
                <GoogleIcon className="h-4 w-4 shrink-0 self-start pt-0.5 sm:h-5 sm:w-5 sm:pt-0" />
                <span className="min-w-0 text-balance sm:text-pretty">
                  Origem: Google (avaliações verificadas)
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-10 w-full max-w-5xl sm:mt-16 lg:mt-[4.5rem]">
            {list.length === 1 ? (
              <div className="mx-auto max-w-xl sm:max-w-2xl lg:max-w-xl">
                <TestimonialCard
                  testimonial={list[0]}
                  index={0}
                  visible={visible}
                  stagger={false}
                />
              </div>
            ) : (
              <div
                className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white/75 p-3"
                id={`${id}-carousel`}
                role="region"
                aria-label="Depoimentos de clientes do Google em rolagem contínua"
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent" />

                <div className="brands-marquee flex w-max gap-4 py-1 will-change-transform sm:gap-5">
                  {duplicatedTestimonials.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="w-[min(20rem,calc(100vw-3.5rem))] shrink-0 sm:w-[22rem] md:w-[24rem]"
                    >
                      <TestimonialCard
                        testimonial={item}
                        index={index}
                        visible={visible}
                        stagger={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export { DEFAULT_TESTIMONIALS, getInitials, clampRating };
