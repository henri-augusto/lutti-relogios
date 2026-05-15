import { normalizeCep } from "@/lib/auth-users";

/**
 * @typedef {object} CheckoutAddressInput
 * @property {unknown} cep
 * @property {unknown} street
 * @property {unknown} number
 * @property {unknown} complement
 * @property {unknown} neighborhood
 * @property {unknown} city
 * @property {unknown} state
 */

/**
 * @typedef {object} CheckoutBuyerInput
 * @property {unknown} fullName
 * @property {unknown} email
 * @property {unknown} document
 * @property {unknown} phone
 * @property {CheckoutAddressInput} address
 */

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidEmail(value) {
  const v = trim(value);
  return v.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Apenas digitos, 10 ou 11 digitos (fixo ou celular BR). */
export function isValidBrazilPhoneDigits(value) {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return digits.length >= 10 && digits.length <= 11;
}

/** CEP com 8 digitos apos normalizacao. */
export function isValidCep(value) {
  return normalizeCep(value).length === 8;
}

/**
 * Valida CPF (11 digitos + digitos verificadores).
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidCpf(value) {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  if (digits.length !== 11) {
    return false;
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number.parseInt(digits[i], 10) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) {
    rest = 0;
  }
  if (rest !== Number.parseInt(digits[9], 10)) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number.parseInt(digits[i], 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) {
    rest = 0;
  }
  if (rest !== Number.parseInt(digits[10], 10)) {
    return false;
  }

  return true;
}

/**
 * UF com 2 letras.
 * @param {unknown} value
 */
export function isValidUf(value) {
  const v = trim(value).toUpperCase();
  return /^[A-Z]{2}$/.test(v);
}

/**
 * @param {CheckoutBuyerInput} input
 * @returns {{ ok: true, errors: [] } | { ok: false, errors: string[] }}
 */
export function validateCheckoutBuyer(input) {
  /** @type {string[]} */
  const errors = [];

  const fullName = trim(input?.fullName);
  if (!fullName) {
    errors.push("Informe o nome completo.");
  }

  const email = trim(input?.email);
  if (!email) {
    errors.push("Informe o e-mail.");
  } else if (!isValidEmail(email)) {
    errors.push("E-mail invalido.");
  }

  const document = trim(input?.document);
  if (!document) {
    errors.push("Informe o CPF.");
  } else if (!isValidCpf(document)) {
    errors.push("CPF invalido.");
  }

  const phone = trim(input?.phone);
  if (!phone) {
    errors.push("Informe o telefone.");
  } else if (!isValidBrazilPhoneDigits(phone)) {
    errors.push("Telefone invalido. Use DDD + numero (10 ou 11 digitos).");
  }

  const addr = input?.address && typeof input.address === "object" ? input.address : {};
  const cep = normalizeCep(addr?.cep);
  if (cep.length !== 8) {
    errors.push("CEP invalido (8 digitos).");
  }

  const street = trim(addr?.street);
  const number = trim(addr?.number);
  const neighborhood = trim(addr?.neighborhood);
  const city = trim(addr?.city);
  const state = trim(addr?.state);

  if (!street) {
    errors.push("Informe a rua.");
  }
  if (!number) {
    errors.push("Informe o numero.");
  }
  if (!neighborhood) {
    errors.push("Informe o bairro.");
  }
  if (!city) {
    errors.push("Informe a cidade.");
  }
  if (!isValidUf(state)) {
    errors.push("Informe a UF com 2 letras (ex.: SP).");
  }

  if (errors.length) {
    return { ok: false, errors };
  }

  return { ok: true, errors: [] };
}

/**
 * @param {CheckoutBuyerInput} input
 * @returns {string | null} primeira mensagem ou null
 */
export function firstCheckoutValidationError(input) {
  const result = validateCheckoutBuyer(input);
  if (result.ok) {
    return null;
  }
  return result.errors[0] ?? "Dados do checkout invalidos.";
}
