const items = [
  {
    number: "01",
    title: "Garantia de 12 meses",
    description:
      "Suporte especializado e garantia completa para sua compra. Qualquer problema, estamos aqui.",
    detail: "Sem burocracia.",
  },
  {
    number: "02",
    title: "Envio no mesmo dia",
    description:
      "Pedidos aprovados até meio-dia saem no mesmo dia útil para todo o Brasil. Rastreamento em tempo real.",
    detail: "Frete rápido incluso.",
  },
  {
    number: "03",
    title: "Atendimento personalizado",
    description:
      "Consultor exclusivo disponível para tirar dúvidas, recomendar modelos e acompanhar seu pedido.",
    detail: "Via WhatsApp.",
  },
];

export default function Benefits() {
  return (
    <section aria-labelledby="benefits-heading">
      <div data-reveal className="mb-10 space-y-3">
        <p
          data-reveal
          data-reveal-delay={40}
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400"
        >
          Por que escolher a Luti
        </p>
        <h2
          id="benefits-heading"
          data-reveal
          data-reveal-delay={90}
          className="max-w-xl font-serif text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl"
        >
          Benefícios reais para quem compra com confiança.
        </h2>
      </div>

      <div className="grid gap-10 sm:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={item.number}
            data-reveal
            data-reveal-delay={index * 100}
            className="group"
          >
            <span
              className="font-serif text-5xl font-bold text-stone-200 transition-colors duration-300 group-hover:text-amber-200/70"
              aria-hidden="true"
            >
              {item.number}
            </span>
            <h3 className="mt-3 text-base font-semibold text-stone-900">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              {item.description}
            </p>
            <p className="mt-2 text-xs font-semibold text-amber-600/75">
              {item.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
