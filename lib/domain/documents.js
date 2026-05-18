export function normalizeDocument(value) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

export function formatDocument(value, type = "cpf") {
  const digits = normalizeDocument(value).slice(0, type === "cnpj" ? 14 : 11);

  if (type === "cnpj") {
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function validateDocument(value, type = "cpf") {
  const digits = normalizeDocument(value);
  const expectedLength = type === "cnpj" ? 14 : 11;

  if (!digits) {
    return { ok: false, error: type === "cnpj" ? "Informe o CNPJ." : "Informe o CPF." };
  }

  if (digits.length !== expectedLength) {
    return {
      ok: false,
      error: type === "cnpj" ? "CNPJ deve ter 14 digitos." : "CPF deve ter 11 digitos.",
    };
  }

  return { ok: true, digits };
}
