import { NextResponse } from "next/server";

/**
 * Converte erro de domínio (classe com message + status) em NextResponse, ou null.
 */
export function jsonDomainError(error, DomainErrorClass) {
  if (error instanceof DomainErrorClass) {
    return NextResponse.json(
      { error: error.message },
      { status: Number.isFinite(error.status) ? error.status : 400 },
    );
  }
  return null;
}

/** Resposta 503 quando Supabase admin não está configurado. */
export function jsonSupabaseNotConfigured(error, publicMessage) {
  if (error?.code === "SUPABASE_NOT_CONFIGURED") {
    return NextResponse.json({ error: publicMessage }, { status: 503 });
  }
  return null;
}

/**
 * Trata erro de domínio ou retorna 500 com log.
 */
export function handleRouteError(error, { DomainErrorClass, logLabel, publicMessage }) {
  const domainResponse = jsonDomainError(error, DomainErrorClass);
  if (domainResponse) {
    return domainResponse;
  }

  console.error(logLabel, error);
  return NextResponse.json({ error: publicMessage }, { status: 500 });
}
