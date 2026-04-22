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
      <div className="mb-10 flex items-center gap-4 border-t border-stone-200/60 pt-10">
        <p
          id="benefits-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400"
        >
          Por que escolher a Luti
        </p>
        <div className="flex-1 border-t border-stone-200/40" aria-hidden="true" />
      </div>

      <div className="grid gap-10 sm:grid-cols-3">
        {items.map((item) => (
          <article key={item.number} className="group">
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
