import { NextResponse } from "next/server";
import { exchangeCodeForOlistToken } from "@/lib/olist-oauth";

const STATE_COOKIE_NAME = "olist_oauth_state";

function buildUiUrl(pathname = "/olist/oauth") {
  return new URL(pathname, process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
}

function clearStateCookie(response) {
  response.cookies.set(STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function GET(request) {
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get("code");
  const stateFromQuery = callbackUrl.searchParams.get("state");
  const stateFromCookie = request.cookies.get(STATE_COOKIE_NAME)?.value;

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    const redirectUrl = buildUiUrl();
    redirectUrl.searchParams.set("error", "State OAuth invalido. Tente novamente.");
    const response = NextResponse.redirect(redirectUrl);
    clearStateCookie(response);
    return response;
  }

  if (!code) {
    const redirectUrl = buildUiUrl();
    redirectUrl.searchParams.set("error", "Codigo de autorizacao ausente no callback.");
    const response = NextResponse.redirect(redirectUrl);
    clearStateCookie(response);
    return response;
  }

  try {
    const tokenPayload = await exchangeCodeForOlistToken(code);
    const fragment = new URLSearchParams({
      access_token: tokenPayload.access_token,
      token_type: tokenPayload.token_type || "Bearer",
      expires_in: String(tokenPayload.expires_in || ""),
      scope: tokenPayload.scope || "",
    });
    const redirectUrl = `${buildUiUrl().toString()}#${fragment.toString()}`;
    const response = NextResponse.redirect(redirectUrl);
    clearStateCookie(response);
    return response;
  } catch (error) {
    const redirectUrl = buildUiUrl();
    redirectUrl.searchParams.set(
      "error",
      error?.message || "Falha ao trocar o codigo por token de acesso.",
    );
    const response = NextResponse.redirect(redirectUrl);
    clearStateCookie(response);
    return response;
  }
}
