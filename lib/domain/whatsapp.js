function getWhatsAppNumber() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511988856382";
  const digits = String(raw).replace(/\D/g, "");
  return digits;
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

export function createWhatsAppCustomLink(message) {
  const number = getWhatsAppNumber();
  const content = typeof message === "string" && message.trim()
    ? message.trim()
    : "Olá! Tenho interesse nos produtos.";
  const encodedMessage = encodeURIComponent(content);

  return `https://wa.me/${number}?text=${encodedMessage}`;
}

/** Link após checkout concluído (confirmação do pedido com referência opcional). */
export function createWhatsAppCheckoutSuccessLink(sessionId) {
  const ref =
    typeof sessionId === "string" && sessionId.trim() ? sessionId.trim() : "";
  const lines = [
    "Olá! Acabei de finalizar uma compra no site da Luti Relógios.",
    "Gostaria de confirmar os detalhes do meu pedido.",
  ];
  if (ref) {
    lines.push(`Referência do pedido: ${ref}`);
  }
  return createWhatsAppCustomLink(lines.join("\n"));
}

/** Link global do botão flutuante (mensagem genérica do site). */
export function createWhatsAppFloatLink() {
  const number = getWhatsAppNumber();
  const message = "Olá! Tenho interesse nos relógios.";
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${number}?text=${encodedMessage}`;
}
