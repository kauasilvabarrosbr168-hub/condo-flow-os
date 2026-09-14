// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWhatsApp, sendSms, sendEmail } from "@/lib/notify.server";

export type GarbageSchedule = {
  id: string;
  condo_id: string;
  days_of_week: number[];
  collection_time: string;
  notify_8h_before: boolean;
  notify_1h_before: boolean;
  active: boolean;
};

// ─── Buscar cronograma ────────────────────────────────────────────────────────

export const getGarbageSchedule = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: schedule } = await supabaseAdmin
      .from("condo_garbage_schedule")
      .select("*")
      .eq("condo_id", data.condoId)
      .maybeSingle();
    return (schedule ?? null) as GarbageSchedule | null;
  });

// ─── Salvar cronograma (síndico) ──────────────────────────────────────────────

export const saveGarbageSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      condoId:           z.string().uuid(),
      days_of_week:      z.array(z.number().int().min(0).max(6)),
      collection_time:   z.string().regex(/^\d{2}:\d{2}$/),
      notify_8h_before:  z.boolean(),
      notify_1h_before:  z.boolean(),
      active:            z.boolean(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("condo_id", data.condoId)
      .maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role))
      throw new Error("forbidden");

    const { error } = await supabaseAdmin
      .from("condo_garbage_schedule")
      .upsert(
        {
          condo_id:          data.condoId,
          days_of_week:      data.days_of_week,
          collection_time:   data.collection_time,
          notify_8h_before:  data.notify_8h_before,
          notify_1h_before:  data.notify_1h_before,
          active:            data.active,
          updated_at:        new Date().toISOString(),
        },
        { onConflict: "condo_id" }
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Verificar e enviar notificações (idempotente) ────────────────────────────

export const checkGarbageNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: schedule } = await supabaseAdmin
      .from("condo_garbage_schedule")
      .select("*")
      .eq("condo_id", data.condoId)
      .eq("active", true)
      .maybeSingle();

    if (!schedule || !schedule.days_of_week?.length) return { sent: 0 };

    const nowMs = Date.now();
    // Horário de Brasília = UTC-3
    const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;
    const nowBRT = new Date(nowMs + BRT_OFFSET_MS); // getUTC* returns BRT values

    const [schedHour, schedMin] = (schedule.collection_time as string).split(":").map(Number);

    for (const dayOffset of [0, 1]) {
      const candidateBRT = new Date(nowBRT);
      candidateBRT.setUTCDate(nowBRT.getUTCDate() + dayOffset);
      const candidateDow = candidateBRT.getUTCDay();

      if (!(schedule.days_of_week as number[]).includes(candidateDow)) continue;

      // Horário da coleta em UTC real
      const collectionBRT = new Date(Date.UTC(
        candidateBRT.getUTCFullYear(),
        candidateBRT.getUTCMonth(),
        candidateBRT.getUTCDate(),
        schedHour,
        schedMin,
        0, 0,
      ));
      const collectionUTC = new Date(collectionBRT.getTime() - BRT_OFFSET_MS);

      if (collectionUTC.getTime() <= nowMs) continue;

      const hoursDiff = (collectionUTC.getTime() - nowMs) / 3_600_000;

      let notificationType: "8h" | "1h" | null = null;
      if (schedule.notify_8h_before && hoursDiff >= 7.5 && hoursDiff <= 8.5)  notificationType = "8h";
      if (schedule.notify_1h_before && hoursDiff >= 0.5 && hoursDiff <= 1.5)  notificationType = "1h";

      if (!notificationType) continue;

      const scheduledDateStr = [
        candidateBRT.getUTCFullYear(),
        String(candidateBRT.getUTCMonth() + 1).padStart(2, "0"),
        String(candidateBRT.getUTCDate()).padStart(2, "0"),
      ].join("-");

      // Verifica se já enviou para evitar duplicata
      const { data: alreadySent } = await supabaseAdmin
        .from("condo_garbage_notifications_sent")
        .select("id")
        .eq("condo_id", data.condoId)
        .eq("scheduled_date", scheduledDateStr)
        .eq("notification_type", notificationType)
        .maybeSingle();

      if (alreadySent) return { sent: 0, already: true };

      // Busca nome do condo e contatos dos moradores
      const [condoRes, rolesRes] = await Promise.all([
        supabaseAdmin.from("condominiums").select("name").eq("id", data.condoId).maybeSingle(),
        supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("condo_id", data.condoId)
          .in("role", ["morador", "sindico", "administradora"]),
      ]);

      const condoName = condoRes.data?.name ?? "CondoFlow";
      const userIds = (rolesRes.data ?? []).map((r) => r.user_id);
      if (!userIds.length) return { sent: 0 };

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("email, phone, full_name")
        .in("id", userIds);

      const labelTime = schedHour.toString().padStart(2, "0") + ":" + schedMin.toString().padStart(2, "0");
      const labelBefore = notificationType === "8h" ? "8 horas" : "1 hora";
      const whatsMsg = `🗑️ *${condoName} — Coleta de lixo*\n\nLembrete: o lixeiro passa em *${labelBefore}* (às ${labelTime}h).\n\nColoque o lixo na área designada antes do horário! ♻️`;
      const emailSubject = `🗑️ Coleta de lixo em ${labelBefore} — ${condoName}`;
      const emailHtml = `<p style="font-family:sans-serif">Olá! A coleta de lixo passa em <strong>${labelBefore}</strong> (às <strong>${labelTime}h</strong>).<br>Por favor, coloque o lixo na área designada antes do horário.</p><p style="font-family:sans-serif;color:#6b7280;font-size:13px">— ${condoName} via CondoFlow ♻️</p>`;

      let sent = 0;
      for (const p of profiles ?? []) {
        if (p.phone) {
          await sendWhatsApp(p.phone, whatsMsg);
          sent++;
        } else if (p.email) {
          await sendEmail(p.email, emailSubject, emailHtml);
          sent++;
        }
      }

      // Registra envio (ignora conflito de concorrência)
      try {
        await supabaseAdmin.from("condo_garbage_notifications_sent").insert({
          condo_id:          data.condoId,
          scheduled_date:    scheduledDateStr,
          notification_type: notificationType,
          recipients_count:  sent,
        });
      } catch {
        // unique constraint = outra instância já enviou, tudo certo
      }

      return { sent, notificationType };
    }

    return { sent: 0 };
  });
