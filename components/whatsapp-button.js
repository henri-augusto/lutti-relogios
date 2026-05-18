import { createWhatsAppLink } from "@/lib/domain/whatsapp";

export default function WhatsAppButton({ productName }) {
  const href = createWhatsAppLink(productName);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center rounded-full border border-emerald-600/20 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-14px_rgba(5,150,105,0.55)] transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 sm:w-auto"
    >
      Comprar via WhatsApp
    </a>
  );
}
