const brands = [
  {
    name: "Technos",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/97/Technos_logo.png",
  },
  {
    name: "Condor",
    logo: "https://assets.zyrosite.com/mePvoPwON5CpE8GZ/blend171024182016-YrDl84OwPoI9X4VR.png",
  },
  {
    name: "Euro",
    logo: "https://assets.zyrosite.com/mePvoPwON5CpE8GZ/relogio-euro-original-revenda-atacado-Yg2Wo48MBLFn96Bl.png",
  },
  {
    name: "Mormaii",
    logo: "https://assets.zyrosite.com/mePvoPwON5CpE8GZ/revenda-relogio-mormaii-autorizada-m7VwPDJLpKCPrVeW.png",
  },
  {
    name: "Champion",
    logo: "/champion-logo.png",
  },
  {
    name: "Smartwatch",
    logo: "https://www.svgrepo.com/show/424992/smartwatch.svg",
  }
];

const duplicatedBrands = [...brands, ...brands];

export default function BrandsSection() {
  return (
    <section
      aria-labelledby="brands-heading"
      className="relative overflow-hidden p-6 sm:p-8 lg:p-10"
    >

      <div className="relative grid items-start gap-8 md:grid-cols-[1fr_2fr] md:gap-10">
        <div className="space-y-4">
          <h2
            id="brands-heading"
            data-reveal
            className="max-w-sm font-serif text-3xl font-bold leading-tight text-stone-900 sm:text-4xl"
          >
            Relógios de marcas que atravessam gerações.
          </h2>

          <p
            data-reveal
            data-reveal-delay={80}
            className="max-w-sm text-sm leading-relaxed text-stone-600 sm:text-base"
          >
            Trabalhamos com fabricantes reconhecidos por design, durabilidade e
            assistência no Brasil.
          </p>
        </div>

        <div
          data-reveal
          data-reveal-delay={140}
          className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white/75 p-3"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent" />

          <div className="brands-marquee flex w-max gap-3 py-1 will-change-transform">
            {duplicatedBrands.map((brand, index) => (
              <article
                key={`${brand.name}-${index}`}
                className="group flex h-[164px] w-[220px] shrink-0 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 transition-transform duration-300 hover:-translate-y-[1px]"
              >
                <div className="flex h-16 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={`Logo ${brand.name}`}
                      className="max-h-10 w-auto object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-stone-400">
                      Espaço da logo
                    </span>
                  )}
                </div>

                <p className="text-xl font-semibold tracking-tight text-stone-900">
                  {brand.name}
                </p>
              </article>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
