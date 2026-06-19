/**
 * Notification service — Twilio (SMS + WhatsApp) + Resend (email)
 *
 * All functions fail silently so a notification error never breaks the
 * main business flow. Check server logs for delivery issues.
 *
 * Required env vars (set in .env.local or Lovable/hosting dashboard):
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *   TWILIO_WHATSAPP_FROM   (optional, e.g. "whatsapp:+14155238886")
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL      (e.g. "CondoFlow <noreply@condoflow.app>")
 */

import twilio from "twilio";
import { Resend } from "resend";

// ─── Lazy clients (only created if env vars are present) ──────────────────────

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// ─── Low-level senders ────────────────────────────────────────────────────────

export async function sendSms(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) {
    console.warn("[notify] Twilio not configured — SMS skipped");
    return;
  }
  try {
    await client.messages.create({ from, to, body });
    console.info(`[notify] SMS sent to ${to}`);
  } catch (err) {
    console.error("[notify] SMS failed:", err);
  }
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM ?? `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
  if (!client || !from) {
    console.warn("[notify] Twilio WhatsApp not configured — message skipped");
    return;
  }
  const waTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  try {
    await client.messages.create({ from, to: waTo, body });
    console.info(`[notify] WhatsApp sent to ${to}`);
  } catch (err) {
    console.error("[notify] WhatsApp failed:", err);
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL ?? "CondoFlow <noreply@condoflow.app>";
  if (!resend) {
    console.warn("[notify] Resend not configured — email skipped");
    return;
  }
  try {
    await resend.emails.send({ from, to, subject, react: undefined, html });
    console.info(`[notify] Email sent to ${to}`);
  } catch (err) {
    console.error("[notify] Email failed:", err);
  }
}

// ─── Notification templates ───────────────────────────────────────────────────

export async function notifyMembershipApproved(opts: {
  toEmail: string;
  toPhone?: string | null;
  fullName: string;
  condoName: string;
}) {
  const { toEmail, toPhone, fullName, condoName } = opts;
  const firstName = fullName.split(" ")[0];

  await sendEmail(
    toEmail,
    `✅ Acesso liberado — ${condoName}`,
    emailLayout(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0f172a">Olá, ${firstName}!</h2>
      <p style="margin:0 0 16px;color:#475569">Sua solicitação de acesso ao condomínio <strong>${condoName}</strong> foi <strong style="color:#16a34a">aprovada</strong>.</p>
      <p style="margin:0 0 24px;color:#475569">Você já pode entrar no app e usar todas as funcionalidades disponíveis para moradores.</p>
      <a href="${appUrl()}/app/dashboard" style="${btnStyle}">Acessar o app →</a>
    `),
  );

  if (toPhone) {
    await sendSms(
      toPhone,
      `CondoFlow: Olá ${firstName}! Seu acesso ao ${condoName} foi aprovado. Entre agora em ${appUrl()}/login`,
    );
  }
}

export async function notifyMembershipRejected(opts: {
  toEmail: string;
  toPhone?: string | null;
  fullName: string;
  condoName: string;
  reason?: string | null;
}) {
  const { toEmail, toPhone, fullName, condoName, reason } = opts;
  const firstName = fullName.split(" ")[0];

  await sendEmail(
    toEmail,
    `Solicitação de acesso — ${condoName}`,
    emailLayout(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0f172a">Olá, ${firstName}</h2>
      <p style="margin:0 0 16px;color:#475569">Infelizmente sua solicitação de acesso ao <strong>${condoName}</strong> não foi aprovada.</p>
      ${reason ? `<p style="margin:0 0 16px;color:#475569;background:#fef2f2;border-left:3px solid #ef4444;padding:12px"><strong>Motivo:</strong> ${reason}</p>` : ""}
      <p style="margin:0 0 24px;color:#475569">Em caso de dúvidas, entre em contato com o síndico do condomínio.</p>
    `),
  );

  if (toPhone) {
    await sendSms(
      toPhone,
      `CondoFlow: Olá ${firstName}, sua solicitação ao ${condoName} não foi aprovada.${reason ? " Motivo: " + reason : ""} Dúvidas? Fale com o síndico.`,
    );
  }
}

export async function notifyNewMembershipRequest(opts: {
  toEmail: string;
  toPhone?: string | null;
  sindicoName: string;
  requesterName: string;
  requesterRole: string;
  condoName: string;
  requestId: string;
}) {
  const { toEmail, toPhone, sindicoName, requesterName, requesterRole, condoName } = opts;
  const roleLabel: Record<string, string> = {
    morador: "Morador",
    funcionario: "Funcionário",
    sindico: "Síndico",
    administradora: "Administradora",
  };
  const label = roleLabel[requesterRole] ?? requesterRole;

  await sendEmail(
    toEmail,
    `🔔 Nova solicitação de acesso — ${condoName}`,
    emailLayout(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0f172a">Olá, ${sindicoName.split(" ")[0]}!</h2>
      <p style="margin:0 0 16px;color:#475569">
        <strong>${requesterName}</strong> solicitou acesso ao <strong>${condoName}</strong> como <strong>${label}</strong>.
      </p>
      <p style="margin:0 0 24px;color:#475569">Acesse o painel para aprovar ou recusar a solicitação.</p>
      <a href="${appUrl()}/app/team" style="${btnStyle}">Ver solicitações →</a>
    `),
  );

  if (toPhone) {
    await sendWhatsApp(
      toPhone,
      `*CondoFlow* 🏢\n*${requesterName}* quer entrar no *${condoName}* como ${label}.\nAcesse o app para aprovar: ${appUrl()}/app/team`,
    );
  }
}

export async function notifyReservationConfirmed(opts: {
  toEmail: string;
  toPhone?: string | null;
  fullName: string;
  areaName: string;
  date: string;
  condoName: string;
}) {
  const { toEmail, toPhone, fullName, areaName, date, condoName } = opts;
  const firstName = fullName.split(" ")[0];

  await sendEmail(
    toEmail,
    `✅ Reserva confirmada — ${areaName}`,
    emailLayout(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0f172a">Reserva confirmada!</h2>
      <p style="margin:0 0 16px;color:#475569">Olá, ${firstName}. Sua reserva foi confirmada:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px">Área</td><td style="padding:8px 0;font-weight:600;color:#0f172a">${areaName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px">Data/Hora</td><td style="padding:8px 0;font-weight:600;color:#0f172a">${date}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;font-size:14px">Condomínio</td><td style="padding:8px 0;font-weight:600;color:#0f172a">${condoName}</td></tr>
      </table>
      <a href="${appUrl()}/app/reservations" style="${btnStyle}">Ver minha reserva →</a>
    `),
  );

  if (toPhone) {
    await sendSms(
      toPhone,
      `CondoFlow ✅ Reserva confirmada!\n${areaName} · ${date} · ${condoName}\nVer detalhes: ${appUrl()}/app/reservations`,
    );
  }
}

export async function notifyTaskAssigned(opts: {
  toEmail: string;
  toPhone?: string | null;
  fullName: string;
  taskTitle: string;
  dueAt?: string | null;
  condoName: string;
}) {
  const { toEmail, toPhone, fullName, taskTitle, dueAt, condoName } = opts;
  const firstName = fullName.split(" ")[0];

  await sendEmail(
    toEmail,
    `📋 Nova tarefa atribuída — ${taskTitle}`,
    emailLayout(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#0f172a">Olá, ${firstName}!</h2>
      <p style="margin:0 0 16px;color:#475569">Uma nova tarefa foi atribuída a você em <strong>${condoName}</strong>:</p>
      <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px">
        <p style="margin:0 0 4px;font-weight:600;color:#0f172a;font-size:16px">${taskTitle}</p>
        ${dueAt ? `<p style="margin:0;color:#64748b;font-size:14px">Prazo: ${dueAt}</p>` : ""}
      </div>
      <a href="${appUrl()}/app/tasks" style="${btnStyle}">Ver tarefa →</a>
    `),
  );

  if (toPhone) {
    await sendWhatsApp(
      toPhone,
      `*CondoFlow* 📋\nNova tarefa: *${taskTitle}*${dueAt ? `\nPrazo: ${dueAt}` : ""}\nVer: ${appUrl()}/app/tasks`,
    );
  }
}

// ─── Email layout ─────────────────────────────────────────────────────────────

function appUrl() {
  return process.env.APP_URL ?? "https://condoflow.app";
}

const btnStyle = [
  "display:inline-block",
  "background:linear-gradient(135deg,#6366f1,#8b5cf6)",
  "color:#ffffff",
  "text-decoration:none",
  "padding:12px 24px",
  "border-radius:10px",
  "font-weight:600",
  "font-size:14px",
].join(";");

function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">
              🏢 CondoFlow
            </h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              Você recebe este e-mail porque tem uma conta no CondoFlow.<br>
              <a href="${appUrl()}/app/settings" style="color:#6366f1;text-decoration:none">Gerenciar notificações</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
