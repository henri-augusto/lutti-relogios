const OLIST_AUTHORIZE_URL =
  "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth";
const DEFAULT_OLIST_TOKEN_URL =
  "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token";

function readRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

export function getOlistOAuthConfig() {
  const clientId = readRequiredEnv("OLIST_CLIENT_ID");
  const clientSecret = readRequiredEnv("OLIST_CLIENT_SECRET");
  const redirectUri = readRequiredEnv("OLIST_REDIRECT_URI");
  const tokenUrl = process.env.OLIST_TOKEN_URL?.trim() || DEFAULT_OLIST_TOKEN_URL;

  return {
    clientId,
    clientSecret,
    redirectUri,
    tokenUrl,
    authorizeUrl: OLIST_AUTHORIZE_URL,
  };
}

export function buildOlistAuthorizeUrl({ state }) {
  const { clientId, redirectUri, authorizeUrl } = getOlistOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid",
    response_type: "code",
    state,
  });

  return `${authorizeUrl}?${params.toString()}`;
}

export async function exchangeCodeForOlistToken(code) {
  if (!code) {
    throw new Error("Codigo de autorizacao ausente.");
  }

  const { clientId, clientSecret, redirectUri, tokenUrl } = getOlistOAuthConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error_description ||
      payload?.error ||
      `Falha ao gerar token OAuth (status ${response.status}).`;
    throw new Error(message);
  }

  if (!payload?.access_token) {
    throw new Error("Resposta de token nao contem access_token.");
  }

  return payload;
}
