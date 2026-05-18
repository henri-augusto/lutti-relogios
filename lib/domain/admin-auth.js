import { normalizeEmail } from "@/lib/api/normalize-email";

/** E-mails com acesso ao painel (variável ADMIN_EMAILS, separados por vírgula). */
export function getAdminEmailAllowlist() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

export function isAdminEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  const allowlist = getAdminEmailAllowlist();
  if (allowlist.length === 0) {
    return false;
  }

  return allowlist.includes(normalized);
}

export function resolveAdminFromUser(user) {
  const email = normalizeEmail(user?.email);
  return {
    isAdmin: isAdminEmail(email),
    email,
  };
}
