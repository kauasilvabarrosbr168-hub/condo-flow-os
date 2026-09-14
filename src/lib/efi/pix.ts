// Pix — API v2, exige certificado mTLS em TODA chamada (inclusive /oauth/token).
// Docs: https://dev.efipay.com.br/docs/api-pix/credenciais
//
// O `fetch` global do Cloudflare Workers não suporta certificado de cliente (mTLS).
// Isso é feito via um "mTLS Certificate binding", configurado uma única vez:
//
//   1. Gerar o certificado .p12 no painel do Efí (Pix > Minhas Aplicações > Certificados)
//   2. Converter para PEM:
//        openssl pkcs12 -in certificado.p12 -out efi-cert.pem -clcerts -nokeys -passin pass:''
//        openssl pkcs12 -in certificado.p12 -out efi-key.pem -nocerts -nodes -passin pass:''
//   3. Enviar para a Cloudflare:
//        npx wrangler cert upload mtls-certificate --cert efi-cert.pem --key efi-key.pem --name efi-pix-cert
//      (guarde o `certificate_id` retornado)
//   4. Adicionar em wrangler.jsonc:
//        "mtls_certificates": [{ "binding": "EFI_MTLS", "certificate_id": "<id do passo 3>" }]
//   5. Deploy. Em dev local (`vite dev` / `wrangler dev` sem o binding) as funções deste
//      arquivo lançam erro explicando o que falta — o fluxo de boleto (src/lib/efi/boleto.ts)
//      não depende disso e funciona normalmente.

import { getEfiPixBaseUrl, getEfiCredentials, getEfiPixKey } from "./config";

type MtlsFetcher = { fetch: typeof fetch };

async function getMtlsFetcher(): Promise<MtlsFetcher> {
  try {
    // Construído em runtime para o bundler do cliente não tentar resolver
    // "cloudflare:workers" (só existe no workerd em produção).
    const specifier = ["cloudflare", "workers"].join(":");
    const mod: any = await import(/* @vite-ignore */ specifier);
    const binding = mod?.env?.EFI_MTLS as MtlsFetcher | undefined;
    if (!binding) throw new Error("missing binding");
    return binding;
  } catch {
    throw new Error(
      "Pix indisponível: binding mTLS 'EFI_MTLS' não configurado. Veja o comentário no topo de src/lib/efi/pix.ts para o passo a passo. Enquanto isso, use cobrança por boleto."
    );
  }
}

let cachedPixToken: { value: string; expiresAt: number } | null = null;

async function getEfiPixToken(fetcher: MtlsFetcher): Promise<string> {
  if (cachedPixToken && cachedPixToken.expiresAt > Date.now() + 30_000) {
    return cachedPixToken.value;
  }
  const { clientId, clientSecret } = getEfiCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetcher.fetch(`${getEfiPixBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Efí Pix OAuth falhou (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedPixToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export type PixChargeResult = {
  txid: string;
  status: string;
  pixCopiaECola: string;
  locId: number;
};

export async function createPixCharge(opts: {
  txid: string; // 26–35 chars alfanuméricos — gerado por nós, vira a chave de idempotência
  amount: string; // formato "123.45"
  expiracaoSeconds: number;
  devedorNome: string;
  devedorCpf?: string;
  devedorCnpj?: string;
  solicitacaoPagador: string;
}): Promise<PixChargeResult> {
  const fetcher = await getMtlsFetcher();
  const token = await getEfiPixToken(fetcher);

  const devedor = opts.devedorCnpj
    ? { cnpj: opts.devedorCnpj, nome: opts.devedorNome }
    : opts.devedorCpf
      ? { cpf: opts.devedorCpf, nome: opts.devedorNome }
      : undefined;

  const res = await fetcher.fetch(`${getEfiPixBaseUrl()}/v2/cob/${opts.txid}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      calendario: { expiracao: opts.expiracaoSeconds },
      devedor,
      valor: { original: opts.amount },
      chave: getEfiPixKey(),
      solicitacaoPagador: opts.solicitacaoPagador,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Efí Pix cob falhou (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    txid: string;
    status: string;
    pixCopiaECola: string;
    loc: { id: number };
  };
  return { txid: json.txid, status: json.status, pixCopiaECola: json.pixCopiaECola, locId: json.loc.id };
}

// Usado pelo webhook para confirmar o status real antes de marcar como pago —
// nunca confie só no corpo do POST recebido.
export async function getPixCharge(txid: string) {
  const fetcher = await getMtlsFetcher();
  const token = await getEfiPixToken(fetcher);
  const res = await fetcher.fetch(`${getEfiPixBaseUrl()}/v2/cob/${txid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Efí Pix consulta falhou (${res.status})`);
  return (await res.json()) as { txid: string; status: string; valor: { original: string } };
}

export async function isPixAvailable(): Promise<boolean> {
  try {
    await getMtlsFetcher();
    return true;
  } catch {
    return false;
  }
}
