// Configuração e URLs base da API do Efí Bank (ex-Gerencianet).
// Docs: https://dev.efipay.com.br

export function isEfiConfigured(): boolean {
  return Boolean(process.env.EFI_CLIENT_ID && process.env.EFI_CLIENT_SECRET);
}

export function isEfiSandbox(): boolean {
  return process.env.EFI_SANDBOX !== "false";
}

export function getEfiCredentials() {
  const clientId = process.env.EFI_CLIENT_ID;
  const clientSecret = process.env.EFI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EFI_CLIENT_ID / EFI_CLIENT_SECRET não configurados.");
  }
  return { clientId, clientSecret };
}

// Cobranças (boleto/cartão) — Basic Auth, sem mTLS.
export function getEfiChargesBaseUrl(): string {
  return isEfiSandbox()
    ? "https://cobrancas-h.api.efipay.com.br"
    : "https://cobrancas.api.efipay.com.br";
}

// Pix — exige certificado mTLS em toda chamada (inclusive /oauth/token).
export function getEfiPixBaseUrl(): string {
  return isEfiSandbox() ? "https://pix-h.api.efipay.com.br" : "https://pix.api.efipay.com.br";
}

export function getEfiPixKey(): string {
  const key = process.env.EFI_PIX_KEY;
  if (!key) throw new Error("EFI_PIX_KEY não configurada.");
  return key;
}
