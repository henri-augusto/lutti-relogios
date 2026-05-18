export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongEnoughPassword(value) {
  return typeof value === "string" && value.length >= 6;
}

/** CEP já normalizado (apenas dígitos). */
export function isValidCepDigits(cepDigits) {
  return typeof cepDigits === "string" && cepDigits.length === 8;
}
