import crypto from "node:crypto";
import { normalizeDocument } from "@/lib/domain/documents";
import { normalizeEmail } from "@/lib/api/normalize-email";
import { requireSupabaseAdmin } from "@/lib/integrations/supabase-admin";

const USER_TABLE = "usuarios";

export function normalizeCep(value) {
  const onlyNumbers = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return onlyNumbers.slice(0, 8);
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hashBuffer = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });

  return `${salt}:${hashBuffer.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) {
    return false;
  }

  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }

  const hashBuffer = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });

  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== hashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(keyBuffer, hashBuffer);
}

export async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const supabase = requireSupabaseAdmin();

  const emailQuery = await supabase.from(USER_TABLE).select("*").eq("email", normalizedEmail).maybeSingle();

  if (emailQuery.error && emailQuery.error.code !== "PGRST116") {
    throw emailQuery.error;
  }

  return emailQuery.data || null;
}

export async function createUser(payload) {
  // #region agent log
  fetch("http://127.0.0.1:7573/ingest/65feb5ce-7cf6-40ef-b7df-7e3cf80f3de2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5e0082" },
    body: JSON.stringify({
      sessionId: "5e0082",
      runId: "register-debug-1",
      hypothesisId: "H3_H4",
      location: "lib/auth-users.js:createUser",
      message: "Create user entry",
      data: {
        hasEmail: Boolean(payload?.email),
        hasFullName: Boolean(payload?.fullName),
        cepLength: normalizeCep(payload?.cep ?? "").length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  const supabase = requireSupabaseAdmin();

  const email = normalizeEmail(payload.email);
  const existing = await findUserByEmail(email);

  if (existing) {
    const err = new Error("Email ja cadastrado.");
    err.code = "USER_EXISTS";
    throw err;
  }

  const passwordHash = await hashPassword(payload.password);
  const documentType = payload.documentType === "cnpj" ? "cnpj" : "cpf";
  const row = {
    email,
    password_hash: passwordHash,
    full_name: payload.fullName.trim(),
    phone: payload.phone.trim(),
    document: normalizeDocument(payload.document),
    document_type: documentType,
    cep: normalizeCep(payload.cep),
    street: payload.street.trim(),
    number: payload.number.trim(),
    complement: payload.complement.trim(),
    neighborhood: payload.neighborhood.trim(),
    city: payload.city.trim(),
    state: payload.state.trim(),
  };

  const { data, error } = await supabase.from(USER_TABLE).insert(row).select("*").single();
  // #region agent log
  fetch("http://127.0.0.1:7573/ingest/65feb5ce-7cf6-40ef-b7df-7e3cf80f3de2", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5e0082" },
    body: JSON.stringify({
      sessionId: "5e0082",
      runId: "register-debug-1",
      hypothesisId: "H4_H5",
      location: "lib/auth-users.js:createUser",
      message: "Supabase insert result",
      data: {
        hasInsertError: Boolean(error),
        insertErrorCode: error?.code ?? null,
        hasInsertedData: Boolean(data),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (error) {
    throw error;
  }

  return data;
}
