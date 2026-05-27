import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
<<<<<<< HEAD
import { buildOlistAuthorizeUrl } from "@/lib/olist-oauth";
=======
import { buildOlistAuthorizeUrl } from "@/lib/integrations/olist-oauth";
>>>>>>> main

const STATE_COOKIE_NAME = "olist_oauth_state";
const STATE_COOKIE_MAX_AGE_SECONDS = 60 * 10;

export async function GET() {
  try {
    const state = randomUUID();
    const authorizeUrl = buildOlistAuthorizeUrl({ state });
    const response = NextResponse.redirect(authorizeUrl);

    response.cookies.set(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    const url = new URL("/olist/oauth", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");
    url.searchParams.set("error", error.message || "Falha ao iniciar autorizacao OAuth.");
    return NextResponse.redirect(url);
  }
}
