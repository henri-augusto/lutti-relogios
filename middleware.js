import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminEmail } from "@/lib/domain/admin-auth";

const ADMIN_LOGIN = "/admin/login";

function tokenIsAdmin(token) {
  if (!token) {
    return false;
  }
  if (token.isAdmin === true) {
    return true;
  }
  return isAdminEmail(token.email);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === ADMIN_LOGIN;

  if (!isApiAdmin && !isAdminArea) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (isLoginPage) {
    if (token && tokenIsAdmin(token)) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/admin";
      const safeCallback = callbackUrl.startsWith("/admin") ? callbackUrl : "/admin";
      return NextResponse.redirect(new URL(safeCallback, request.url));
    }
    return NextResponse.next();
  }

  if (!token?.userId) {
    if (isApiAdmin) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!tokenIsAdmin(token)) {
    if (isApiAdmin) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    loginUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
