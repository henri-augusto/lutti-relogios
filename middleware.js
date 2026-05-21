import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminEmail } from "@/lib/domain/admin-auth";
import { isMaintenanceModeEnabled } from "@/lib/domain/maintenance-mode";

const ADMIN_LOGIN = "/admin/login";
const MAINTENANCE_PATH = "/manutencao";

function tokenIsAdmin(token) {
  if (!token) {
    return false;
  }
  if (token.isAdmin === true) {
    return true;
  }
  return isAdminEmail(token.email);
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif)$/i.test(pathname)
  );
}

function isMaintenanceBypass(pathname) {
  if (pathname === MAINTENANCE_PATH) {
    return true;
  }
  if (pathname.startsWith("/api")) {
    return true;
  }
  if (pathname.startsWith("/admin")) {
    return true;
  }
  if (isStaticAsset(pathname)) {
    return true;
  }
  return false;
}

function handleMaintenanceRedirect(request) {
  if (!isMaintenanceModeEnabled()) {
    return null;
  }

  const { pathname } = request.nextUrl;

  if (isMaintenanceBypass(pathname)) {
    return null;
  }

  return NextResponse.redirect(new URL(MAINTENANCE_PATH, request.url));
}

async function handleAdminProtection(request) {
  const { pathname } = request.nextUrl;
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === ADMIN_LOGIN;

  if (!isApiAdmin && !isAdminArea) {
    return null;
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

export async function middleware(request) {
  const maintenanceResponse = handleMaintenanceRedirect(request);
  if (maintenanceResponse) {
    return maintenanceResponse;
  }

  const adminResponse = await handleAdminProtection(request);
  if (adminResponse) {
    return adminResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif)$).*)",
  ],
};
