const aboutBlocks = [
  {
    label: "Nossa Historia",
    title: "Desde 1994 no mercado de relogios originais.",
    description:
      "Desde 1994, iniciamos nossa trajetoria no tradicional Shopping Mundo Oriental, sempre dedicados ao mercado de relogios originais. Atuavamos com vendas no atacado e varejo, consolidando nossa reputacao como referencia em qualidade e confianca.",
    accentClass: "bg-[#FBF3DB] text-[#956400]",
  },
  {
    label: "Quem somos hoje",
    title: "Distribuicao oficial com preco direto de fabrica.",
    description:
      "Com o passar do tempo, evoluimos e expandimos nossas operacoes. Hoje, somos distribuidores oficiais de diversas marcas renomadas, oferecendo uma ampla selecao de relogios originais com precos diretos de fabrica. Nosso compromisso e entregar produtos de alta qualidade, atendendo tanto lojistas quanto sacoleiros e feirantes. Sempre com excelencia e com as melhores condicoes do mercado.",
    accentClass: "bg-[#EDF3EC] text-[#346538]",
  },
];

export default function AboutSection() {
  return (
    <section
      aria-labelledby="about-heading"
      className="rounded-xl border border-[#EAEAEA] bg-[#FBFBFA] px-6 py-12 sm:px-8 lg:px-10"
    >
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          About
        </p>
        <h2
          id="about-heading"
          className="mt-3 font-serif text-3xl tracking-tight text-[#111111] sm:text-4xl"
        >
          Historia, consistencia e confianca para quem vive de relogios.
        </h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_1.15fr]">
        {aboutBlocks.map((block) => (
          <article
            key={block.label}
            className="flex h-full flex-col rounded-xl border border-[#EAEAEA] bg-white p-7"
          >
            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${block.accentClass}`}
            >
              {block.label}
            </span>
            <h3 className="mt-5 text-xl font-semibold leading-snug text-[#111111]">
              {block.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-[#787774]">
              {block.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
