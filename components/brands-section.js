const brands = ["Technos", "Condor", "Euro", "Mormaii", "Champion"];

export default function BrandsSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/70 bg-gradient-to-b from-stone-50 to-white p-6 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(217,119,6,0.10),transparent_40%)]" />

      <div className="relative grid items-start gap-8 md:grid-cols-[1.1fr_1.9fr] md:gap-10">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700/85">
            Marcas selecionadas
          </p>

          <h2 className="max-w-sm font-serif text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
            Relógios de marcas que atravessam gerações.
          </h2>

          <p className="max-w-sm text-sm leading-relaxed text-stone-600 sm:text-base">
            Trabalhamos com fabricantes reconhecidos por design, durabilidade e
            assistência no Brasil.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {brands.map((brand, index) => (
            <article
              key={brand}
              className={`group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-px hover:shadow-[0_18px_35px_-25px_rgba(68,64,60,0.45)] sm:p-5 ${
                index % 2 === 0
                  ? "border-stone-200 bg-white"
                  : "border-amber-200/60 bg-amber-50/35"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Marca
                </span>
                <span className="h-2 w-2 rounded-full bg-amber-500/70 transition-colors duration-300 group-hover:bg-amber-600" />
              </div>

              <p className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
                {brand}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
