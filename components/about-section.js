import Image from "next/image";

const aboutBlocks = [
  {
    label: "Nossa História",
    title: "Desde 1994 no mercado de relógios originais.",
    description:
      "Desde 1994, iniciamos nossa trajetória no tradicional Shopping Mundo Oriental, sempre dedicados ao mercado de relógios originais. Atuavamos com vendas no atacado e varejo, consolidando nossa reputação como referência em qualidade e confiança.",
    imageSrc: "/image-nossa-historia.jpeg",
    imageAlt: "Vitrine de relógios originais em exposição",
  },
  {
    label: "Quem somos hoje",
    title: "Distribuição oficial com preço direto de fábrica.",
    description:
      "Com o passar do tempo, evoluimos e expandimos nossas operações. Hoje, somos distribuidores oficiais de diversas marcas renomadas, oferecendo uma ampla seleção de relógios originais com preços diretos de fábrica. Nosso compromisso é entregar produtos de alta qualidade, atendendo tanto lojistas quanto sacoleiros e feirantes. Sempre com excelência e com as melhores condições do mercado.",
    imageSrc: "/image-quem-somos-hoje.avif",
    imageAlt: "Equipe separando pedidos e relógios para distribuição",
  },
];

export default function AboutSection() {
  return (
    <section
      aria-labelledby="about-heading"
      className="p-6 sm:p-8 lg:p-10"
    >
      <div className="max-w-3xl">
        <h2
          id="about-heading"
          data-reveal
          className="font-serif text-3xl font-bold leading-tight text-stone-900 sm:text-4xl"
        >
          História, consistência e confiança para quem vive de relógios.
        </h2>
      </div>

      <div className="mt-10 space-y-6">
        {aboutBlocks.map((block, index) => (
          <article
            key={block.label}
            data-reveal
            data-reveal-delay={index * 100}
            className="grid items-stretch gap-6 rounded-xl border border-[#EAEAEA] bg-white p-5 md:grid-cols-2 md:p-7"
          >
            <div
              className={`relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#EAEAEA] bg-[#F9F9F8] ${
                index % 2 === 0 ? "md:order-1" : "md:order-2"
              }`}
            >
              <Image
                src={block.imageSrc}
                alt={block.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div
              className={`flex flex-col justify-center ${
                index % 2 === 0 ? "md:order-2" : "md:order-1"
              }`}
            >
              <span
                className="inline-flex w-fit rounded-full bg-[#F7F6F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#787774]"
              >
                {block.label}
              </span>
              <h3 className="mt-5 text-xl font-semibold leading-snug text-[#111111]">
                {block.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#787774]">
                {block.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
