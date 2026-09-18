/**
 * Planilha de leads (Google Sheets) — envia cada lead pra uma planilha via um
 * Web App do Google Apps Script, sem precisar de banco de dados.
 *
 * Configuração (ver instruções completas em docs/leads-sheet-setup.md):
 *   LEADS_SHEET_WEBHOOK_URL — URL do Web App gerado no Apps Script
 *
 * Falha silenciosamente se não configurado, seguindo o mesmo padrão de
 * src/lib/notify.server.ts — um canal indisponível nunca deve travar o envio
 * do formulário.
 */

export async function notifyLeadSheet(data: Record<string, unknown>): Promise<void> {
  const url = process.env.LEADS_SHEET_WEBHOOK_URL;
  if (!url) {
    console.warn("[sheets] LEADS_SHEET_WEBHOOK_URL não configurada — planilha pulada");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    console.info("[sheets] Lead enviado pra planilha");
  } catch (err) {
    console.error("[sheets] Falha ao enviar lead pra planilha:", err);
  }
}
