import { createWhatsAppLink } from "@/lib/whatsapp";

export default function WhatsAppButton({ productName }) {
  const href = createWhatsAppLink(productName);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:w-auto"
    >
      Comprar via WhatsApp
    </a>
  );
}
