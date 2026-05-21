import Image from "next/image";
import Link from "next/link";
import { createWhatsAppCustomLink } from "@/lib/domain/whatsapp";

export const metadata = {
  title: "Manutenção | Luti Relógios",
  description:
    "Estamos realizando melhorias no site. Voltamos em breve com a mesma experiência premium.",
};

const statusItems = [
  {
    label: "Atendimento",
    status: "Disponível",
    detail: "WhatsApp ativo para dúvidas urgentes.",
    available: true,
  },
  {
    label: "Catálogo",
    status: "Indisponível",
    detail: "Navegação e busca temporariamente pausadas.",
    available: false,
  },
  {
    label: "Pedidos",
    status: "Indisponível",
    detail: "Checkout online retorna após a manutenção.",
    available: false,
  },
];

const whatsappHref = createWhatsAppCustomLink(
  "Olá! Vi o aviso de manutenção no site da Luti Relógios e gostaria de mais informações.",
);

export default function ManutencaoPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 14% 18%, rgba(201, 169, 110, 0.14) 0, rgba(201, 169, 110, 0) 34%), radial-gradient(circle at 82% 8%, rgba(120, 113, 108, 0.08) 0, rgba(120, 113, 108, 0) 30%), linear-gradient(160deg, #ffffff 0%, #fafaf8 55%, #f5f3ef 100%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(26, 21, 16, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 21, 16, 0.03) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-8 lg:py-24">
        <section className="max-w-xl lg:flex-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#EAEAEA] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#78716C] backdrop-blur-sm">
            <span
              className="inline-block h-2 w-2 rounded-full bg-amber-500"
              aria-hidden="true"
            />
            Manutenção programada
          </p>

          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-[#1A1510] sm:text-5xl">
            Voltamos em breve
          </h1>

          <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-[#78716C]">
            Estamos atualizando a Luti Relógios para entregar uma experiência
            ainda mais fluida. Durante este período, o catálogo e o checkout
            online ficam temporariamente indisponíveis.
          </p>

          <p className="mt-4 text-sm text-[#78716C]">
            Previsão de retorno:{" "}
            <span className="font-semibold text-[#1A1510]">em até 24 horas</span>
            . Agradecemos a compreensão.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#333333] active:scale-[0.98]"
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#EAEAEA] bg-white px-6 py-3 text-sm font-semibold text-[#1A1510] transition hover:bg-[#F7F6F3] active:scale-[0.98]"
            >
              Tentar página inicial
            </Link>
          </div>
        </section>

        <section className="w-full max-w-lg lg:flex-1">
          <div className="rounded-[2rem] border border-[#EAEAEA]/80 bg-white/90 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center gap-4 border-b border-[#EAEAEA] pb-6">
              <Image
                src="/image-nossa-historia.jpeg"
                alt="Luti Relógios"
                width={56}
                height={56}
                className="h-14 w-14 rounded-md border border-[#EAEAEA] object-cover"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#78716C]">
                  Status do sistema
                </p>
                <p className="font-serif text-xl font-bold text-[#1A1510]">
                  Luti Relógios
                </p>
              </div>
            </div>

            <ul className="space-y-4">
              {statusItems.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start justify-between gap-4 border-b border-[#EAEAEA]/70 pb-4 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1A1510]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#78716C]">
                      {item.detail}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.available
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs leading-relaxed text-[#78716C]">
              Atualizado automaticamente durante a manutenção. Para pedidos
              urgentes, utilize o WhatsApp.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
