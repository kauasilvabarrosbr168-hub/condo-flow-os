// @ts-nocheck
// Configuração de notificações WhatsApp (Evolution API) por condomínio.
// Os valores ficam em condo_ai_settings — lidos pelo motor de IA ao notificar o síndico.
import { createServerFn } from "@tanstack/react-start";
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

const EMPTY: WhatsAppConfig = {
  evolution_api_url: null,
  evolution_api_key: null,
  evolution_instance: "condoflow",
  evolution_phone: null,
  wa_notify_warning: true,
  wa_notify_critical: true,
  wa_notify_info: false,
};

export const getWhatsAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { condoId: string }) => data)
  .handler(async ({ data }): Promise<WhatsAppConfig> => {
    const { data: row } = await supabaseAdmin
      .from("condo_ai_settings")
      .select("*")
      .eq("condo_id", data.condoId)
      .maybeSingle();

    if (!row) return EMPTY;
    return {
      evolution_api_url: row.evolution_api_url ?? null,
      evolution_api_key: row.evolution_api_key ?? null,
      evolution_instance: row.evolution_instance ?? "condoflow",
      evolution_phone: row.evolution_phone ?? row.whatsapp_phone ?? null,
      wa_notify_warning: row.notify_warning ?? true,
      wa_notify_critical: row.notify_critical ?? true,
      wa_notify_info: row.notify_info ?? false,
    };
  });

export const saveWhatsAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { condoId: string } & Partial<WhatsAppConfig>) => data)
  .handler(async ({ data }) => {
    const { condoId, ...cfg } = data;
    const { error } = await supabaseAdmin
      .from("condo_ai_settings")
      .upsert(
        {
          condo_id: condoId,
          evolution_api_url: cfg.evolution_api_url ?? null,
          evolution_api_key: cfg.evolution_api_key ?? null,
          evolution_instance: cfg.evolution_instance ?? "condoflow",
          evolution_phone: cfg.evolution_phone ?? null,
          whatsapp_phone: cfg.evolution_phone ?? null,
          notify_warning: cfg.wa_notify_warning ?? true,
          notify_critical: cfg.wa_notify_critical ?? true,
          notify_info: cfg.wa_notify_info ?? false,
        },
        { onConflict: "condo_id" },
      );
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const testWhatsAppConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      condoId: string;
      evolution_api_url: string;
      evolution_api_key: string;
      evolution_instance: string;
      evolution_phone: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const number = data.evolution_phone.replace(/\D/g, "");
    const url = `${data.evolution_api_url.replace(/\/$/, "")}/message/sendText/${data.evolution_instance}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: data.evolution_api_key, "Content-Type": "application/json" },
      body: JSON.stringify({
        number,
        text: "✅ *CondoFlow* — conexão de WhatsApp configurada com sucesso!",
        options: { delay: 500, presence: "composing" },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Evolution API respondeu ${res.status}: ${body.slice(0, 200)}`);
    }
    return { success: true };
  });
