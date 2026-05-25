import Image from "next/image";
import { createWhatsAppCustomLink } from "@/lib/domain/whatsapp";

const catalogoRevendaWhatsHref = createWhatsAppCustomLink(
  "Olá! Gostaria de ter acesso ao catálogo de revendedores.",
);

const revendedorBlocks = [
  {
    label: "Cadastre-se e comece a vender.",
    title: "Seja nosso parceiro em poucos cliques.",
    description:
      "Faça seu cadastro é libere acesso a milhares de relógios originais a preço de fábrica, melhores condições do mercado e suporte especializado para seu negócio decolar.",
    imageSrc:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Pessoa preenchendo cadastro e documentação em notebook",
  },
  {
    label: "Receba nossos catálogos",
    title: "Estude, separe e economize.",
    description:
      "Analise nosso catálogo, separe os relógios conforme a demanda do seu negócio, ative descontos progressivos para grandes volumes e aproveite frete grátis após análise do pedido",
    imageSrc:
      "https://images.unsplash.com/photo-1526045431048-f857369baa09?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Vitrine com vários relógios em exposição",
  },
  {
    label: "Prepare-se para ganhar dinheiro",
    title: "Margens atrativase reposição no ritmo da sua loja.",
    description:
      "Trabalhe com relógios originais, tenha total segurança no negócio e ofereça garantia aos seus clientes.",
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
            Se você é lojista, sacoleiro ou feirante, chegou ao lugar certo.
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

        <div
          data-reveal
          data-reveal-delay={100}
          className="mt-10 rounded-xl border border-[#EAEAEA] bg-[#F9F9F8] p-8 transition-[box-shadow] duration-200 sm:mt-12 sm:p-10 lg:flex lg:items-end lg:justify-between lg:gap-12 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-[#EDF3EC] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#346538]">
              Catálogo
            </span>
            <p className="mt-3 font-serif text-xl font-semibold leading-tight tracking-tight text-[#111111] sm:text-2xl">
              Quer receber o catálogo atualizado?
            </p>
            <p className="mt-2 text-sm leading-[1.6] text-[#787774] sm:text-[15px]">
              Mande uma mensagem no whatsapp agora e solicite.
            </p>
          </div>
          <a
            href={catalogoRevendaWhatsHref}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-md bg-[#111111] px-5 py-3 text-sm font-medium text-white transition-[color,transform] duration-200 hover:bg-[#333333] active:scale-[0.98] sm:w-auto lg:mt-0 lg:px-6 lg:py-3.5"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EDF3EC] text-[#346538]"
              aria-hidden="true"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </span>
            Solicitar pelo WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
