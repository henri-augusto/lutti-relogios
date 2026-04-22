import Image from "next/image";

const revendedorBlocks = [
  {
    label: "Realize o cadastro",
    title: "Cadastro rápido na base de parceiros.",
    description:
      "Dados comerciais e documentação básica. Validação ágil para começar com suporte dedicado.",
    imageSrc:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Pessoa preenchendo cadastro e documentação em notebook",
  },
  {
    label: "Receba nossos catálogos",
    title: "Materiais com linhas, preços e campanhas.",
    description:
      "Catálogos digitais e orientações de vitrine para apresentar as marcas com clareza.",
    imageSrc:
      "https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Vitrine com vários relógios em exposição",
  },
  {
    label: "Prepare-se para ganhar dinheiro",
    title: "Margem e reposição no ritmo da sua loja.",
    description:
      "Mix de originais, preço de distribuidor e logística para varejo, atacado ou feiras.",
    imageSrc:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Moedas e cédulas simbolizando lucro e crescimento nas vendas",
  },
];

export default function RevendedoresSection() {
  return (
    <section
      aria-labelledby="revendedores-heading"
      className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <header className="max-w-2xl">
          <h2
            id="revendedores-heading"
            data-reveal
            className="font-serif text-2xl font-semibold leading-tight tracking-tight text-[#111111] sm:text-3xl"
          >
            Programa para revendedores
          </h2>
          <p
            data-reveal
            data-reveal-delay={80}
            className="mt-2 text-sm leading-relaxed text-[#787774] sm:text-[15px]"
          >
            Cadastro, catálogos e condições para quem vende no varejo, atacado ou
            em feiras com relógios originais.
          </p>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {revendedorBlocks.map((block, index) => (
            <article
              key={block.label}
              data-reveal
              data-reveal-delay={index * 80}
              className="flex flex-col rounded-lg border border-[#EAEAEA] bg-white p-4"
            >
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-md border border-[#EAEAEA] bg-[#F9F9F8] sm:h-32">
                <Image
                  src={block.imageSrc}
                  alt={block.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                />
              </div>
              <span className="mt-3 inline-flex w-fit rounded-full bg-[#F7F6F3] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#787774]">
                {block.label}
              </span>
              <h3 className="mt-2 text-base font-semibold leading-snug text-[#111111]">
                {block.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#787774] sm:text-[13px]">
                {block.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
