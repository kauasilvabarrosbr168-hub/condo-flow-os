// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type WhatsAppConfig = {
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  evolution_instance: string | null;
  evolution_phone: string | null;
  wa_notify_warning: boolean;
  wa_notify_critical: boolean;
  wa_notify_info: boolean;
};

// ─── Envia mensagem via Evolution API ────────────────────────────────────────

export async function sendEvolutionWhatsApp(
  config: { url: string; apiKey: string; instance: string; phone: string },
  message: string
): Promise<boolean> {
  try {
    const base = config.url.replace(/\/$/, "");
    // Normaliza número: remove +, espaços, traços — deixa só dígitos
    const number = config.phone.replace(/\D/g, "");

    const res = await fetch(`${base}/message/sendText/${config.instance}`, {
      method: "POST",
      headers: {
        "apikey": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number,
        text: message,
        options: { delay: 1000, presence: "composing" },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("[evolution] send failed:", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[evolution] send error:", err);
    return false;
  }
}

// ─── Buscar configuração ──────────────────────────────────────────────────────

export const getWhatsAppConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    const { data: settings } = await supabaseAdmin
      .from("condo_ai_settings")
      .select("evolution_api_url,evolution_api_key,evolution_instance,evolution_phone,wa_notify_warning,wa_notify_critical,wa_notify_info")
      .eq("condo_id", data.condoId)
      .maybeSingle();

    return (settings ?? {
      evolution_api_url: null,
      evolution_api_key: null,
      evolution_instance: null,
      evolution_phone: null,
      wa_notify_warning: true,
      wa_notify_critical: true,
      wa_notify_info: false,
    }) as WhatsAppConfig;
  });

// ─── Salvar configuração ──────────────────────────────────────────────────────

export const saveWhatsAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      condoId:              z.string().uuid(),
      evolution_api_url:    z.string().url().or(z.literal("")).nullable(),
      evolution_api_key:    z.string().nullable(),
      evolution_instance:   z.string().nullable(),
      evolution_phone:      z.string().nullable(),
      wa_notify_warning:    z.boolean(),
      wa_notify_critical:   z.boolean(),
      wa_notify_info:       z.boolean(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    const { error } = await supabaseAdmin
      .from("condo_ai_settings")
      .upsert(
        {
          condo_id:              data.condoId,
          evolution_api_url:     data.evolution_api_url || null,
          evolution_api_key:     data.evolution_api_key || null,
          evolution_instance:    data.evolution_instance || null,
          evolution_phone:       data.evolution_phone || null,
          wa_notify_warning:     data.wa_notify_warning,
          wa_notify_critical:    data.wa_notify_critical,
          wa_notify_info:        data.wa_notify_info,
        },
        { onConflict: "condo_id" }
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Testar conexão (envia mensagem de teste) ─────────────────────────────────

export const testWhatsAppConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      condoId:           z.string().uuid(),
      evolution_api_url: z.string().url(),
      evolution_api_key: z.string().min(1),
      evolution_instance: z.string().min(1),
      evolution_phone:   z.string().min(10),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    const ok = await sendEvolutionWhatsApp(
      {
        url:      data.evolution_api_url,
        apiKey:   data.evolution_api_key,
        instance: data.evolution_instance,
        phone:    data.evolution_phone,
      },
      `✅ *CondoFlow conectado!*\n\nSeu WhatsApp está configurado corretamente. A IA do condomínio vai te enviar alertas e análises por aqui. 🏢`
    );

    if (!ok) throw new Error("Não foi possível enviar a mensagem de teste. Verifique a URL, chave e instância.");
    return { ok: true };
  });
