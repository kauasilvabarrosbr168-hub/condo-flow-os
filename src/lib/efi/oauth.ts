import { getEfiChargesBaseUrl, getEfiCredentials } from "./config";

// Token da API de Cobranças (boleto/cartão) — não exige mTLS.
// Cache em memória do isolate; reautentica quando expira.
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getEfiChargesToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = getEfiCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${getEfiChargesBaseUrl()}/v1/authorize`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Efí OAuth falhou (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}
