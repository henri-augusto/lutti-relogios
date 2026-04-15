const items = [
  {
    title: "Garantia de 12 meses",
    description: "Suporte especializado e garantia para sua compra com tranquilidade.",
  },
  {
    title: "Envio rapido",
    description: "Pedidos aprovados ate meio-dia saem no mesmo dia util.",
  },
  {
    title: "Atendimento premium",
    description: "Equipe pronta para tirar duvidas e recomendar o modelo ideal.",
  },
];

export default function Benefits() {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
        </article>
      ))}
    </section>
  );
}
