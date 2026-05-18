import { getToken } from "next-auth/jwt";

/**
 * Retorna o id do usuário autenticado (JWT NextAuth) ou null.
 */
export async function getSessionUserId(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  return token?.userId ? String(token.userId) : null;
}
