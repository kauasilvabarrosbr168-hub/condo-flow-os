// Webhook público do Efí — Pix e Boleto.
// Registro do lado do Efí:
//   - Pix:    PUT /v2/webhook/:chave  →  URL cadastrada deve incluir "?hmac=<EFI_WEBHOOK_HMAC>"
//             https://dev.efipay.com.br/docs/api-pix/webhooks
//   - Boleto: campo "notificacao" ao criar a cobrança, ou /v1/charge/:id/metadata
//             https://dev.efipay.com.br/docs/api-cobrancas/notificacoes
//
// Segurança: a Efí não assina o corpo do POST. Validamos por HMAC na query string
// (URL secreta) e, além disso, NUNCA confiamos no valor recebido — sempre consultamos
// de volta a API do Efí (getPixCharge / getBoletoNotification) antes de marcar como pago.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getPixCharge } from "@/lib/efi/pix";
import { getBoletoNotification } from "@/lib/efi/boleto";

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient("https://jqcipbecgxssbjayusci.supabase.co", key);
}

function hmacIsValid(request: Request): boolean {
  const expected = process.env.EFI_WEBHOOK_HMAC;
  if (!expected) return false;
  const url = new URL(request.url);
  const provided = url.searchParams.get("hmac") ?? "";
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function markPaid(txidOrChargeId: string, column: "efi_txid" | "efi_charge_id") {
  const admin = getAdminClient();
  await admin
    .from("condo_charges")
    .update({ status: "pago", paid_at: new Date().toISOString() })
    .eq(column, txidOrChargeId)
    .eq("status", "pendente");
}

export const Route = createFileRoute("/api/webhooks/efi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hmacIsValid(request)) {
          return new Response("unauthorized", { status: 401 });
        }

        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response("bad request", { status: 400 });
        }

        try {
          if (Array.isArray(body?.pix)) {
            for (const entry of body.pix) {
              const txid = entry?.txid;
              if (!txid) continue;
              const confirmed = await getPixCharge(txid);
              if (confirmed.status === "CONCLUIDA") {
                await markPaid(txid, "efi_txid");
              }
            }
          } else if (body?.notification) {
            const notif = await getBoletoNotification(body.notification);
            for (const change of notif.data ?? []) {
              if (change.status === "paid" && change.identifiers?.charge_id) {
                await markPaid(String(change.identifiers.charge_id), "efi_charge_id");
              }
            }
          }
        } catch (err) {
          console.error("[efi webhook]", err instanceof Error ? err.message : err);
          // Ainda respondemos 200 — a Efí reenvia notificações de boleto por até 3 dias
          // caso o token não seja consultado com sucesso; erros aqui já ficam logados.
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
