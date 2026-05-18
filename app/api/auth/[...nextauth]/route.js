import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { resolveAdminFromUser } from "@/lib/domain/admin-auth";
import { findUserByEmail, verifyPassword } from "@/lib/domain/auth-users";

const handler = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.trim();
          const password = credentials?.password;

          if (!email || !password) {
            return null;
          }

          const user = await findUserByEmail(email);
          if (!user?.password_hash) {
            return null;
          }

          const passwordOk = await verifyPassword(password, user.password_hash);
          if (!passwordOk) {
            return null;
          }

          const { isAdmin } = resolveAdminFromUser({ email: user.email });

          return {
            id: String(user.id),
            name: user.full_name,
            email: user.email,
            isAdmin,
          };
        } catch (error) {
          console.error("Erro no login com credenciais:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.isAdmin = Boolean(user.isAdmin);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
