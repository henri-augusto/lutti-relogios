import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
<<<<<<< HEAD
import { findUserByEmail, verifyPassword } from "@/lib/auth-users";
=======
import { resolveAdminFromUser } from "@/lib/domain/admin-auth";
import { findUserByEmail, verifyPassword } from "@/lib/domain/auth-users";
>>>>>>> main

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

<<<<<<< HEAD
=======
          const { isAdmin } = resolveAdminFromUser({ email: user.email });

>>>>>>> main
          return {
            id: String(user.id),
            name: user.full_name,
            email: user.email,
<<<<<<< HEAD
=======
            isAdmin,
>>>>>>> main
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
<<<<<<< HEAD
=======
        token.isAdmin = Boolean(user.isAdmin);
>>>>>>> main
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
<<<<<<< HEAD
=======
        session.user.isAdmin = Boolean(token.isAdmin);
>>>>>>> main
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
