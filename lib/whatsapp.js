const DEFAULT_WHATSAPP_NUMBER = "5500000000000";

function getWhatsAppNumber() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER;
  const digits = String(raw).replace(/\D/g, "");
  return digits || String(DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");
}

export function createWhatsAppLink(productName) {
  const number = getWhatsAppNumber();
  const name = typeof productName === "string" ? productName.trim() : "";
  const message = name
    ? `Olá! Tenho interesse no produto: ${name}`
    : "Olá! Tenho interesse em um produto do site.";
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${number}?text=${encodedMessage}`;
}

/** Link global do botão flutuante (mensagem genérica do site). */
export function createWhatsAppFloatLink() {
  const number = getWhatsAppNumber();
  const message = "Olá! Tenho interesse nos relógios.";
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${number}?text=${encodedMessage}`;
}
