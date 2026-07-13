// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { WeekSchedule } from "@/components/condo/area-schedule-picker";
import type { AreaType } from "@/lib/area-catalog";

export type AIAreaConfig = {
  requires_reservation: boolean;
  operating_hours: WeekSchedule;
  max_simultaneous: number | null;
  requires_approval: boolean;
  requires_checklist: boolean;
  slot_duration_hours: number | null;
  checklist_items: string[];
  rules_summary: string;
  ai_interpretation: string;
};

async function callAI(areaType: AreaType, userRules: string): Promise<AIAreaConfig> {
  const apiKey = process.env.LOVABLE_API_KEY;

  const fallback: AIAreaConfig = {
    requires_reservation: areaType.defaultChecklist,
    operating_hours: areaType.defaultSchedule,
    max_simultaneous: areaType.defaultCapacity,
    requires_approval: areaType.key === "salao_festas" || areaType.key === "apto_hospedes",
    requires_checklist: areaType.defaultChecklist,
    slot_duration_hours: null,
    checklist_items: [],
    rules_summary: userRules,
    ai_interpretation: "Configuração padrão aplicada.",
  };

  if (!apiKey) return fallback;

  const prompt = `Você é um assistente de configuração de áreas comuns de condomínios brasileiros.

Tipo de área: ${areaType.name}
Contexto padrão desse tipo: ${areaType.contextSignal}
Regras definidas pelo síndico: "${userRules || "Sem regras específicas definidas."}"

Com base nas regras do síndico, configure esta área. Responda APENAS com JSON válido (sem markdown, sem explicação):

{
  "requires_reservation": boolean (true se precisa reservar, false se é uso livre),
  "requires_approval": boolean (true se síndico precisa aprovar cada reserva),
  "requires_checklist": boolean (true se há checklist de entrega/devolução),
  "slot_duration_hours": number ou null (duração de cada slot em horas, null se não for por slot),
  "max_simultaneous": number ou null (máximo de pessoas simultâneas, null se sem limite),
  "checklist_items": array de strings (itens do checklist, vazio se não tiver),
  "operating_hours": {
    "seg": {"from":"HH:MM","to":"HH:MM"} ou null,
    "ter": {"from":"HH:MM","to":"HH:MM"} ou null,
    "qua": {"from":"HH:MM","to":"HH:MM"} ou null,
    "qui": {"from":"HH:MM","to":"HH:MM"} ou null,
    "sex": {"from":"HH:MM","to":"HH:MM"} ou null,
    "sab": {"from":"HH:MM","to":"HH:MM"} ou null,
    "dom": {"from":"HH:MM","to":"HH:MM"} ou null
  },
  "rules_summary": "resumo das regras em português para exibir aos moradores (máx 200 caracteres)",
  "ai_interpretation": "o que a IA entendeu das regras em 1 frase curta"
}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content ?? "") as string;
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        requires_reservation: parsed.requires_reservation ?? fallback.requires_reservation,
        operating_hours: parsed.operating_hours ?? fallback.operating_hours,
        max_simultaneous: parsed.max_simultaneous ?? fallback.max_simultaneous,
        requires_approval: parsed.requires_approval ?? fallback.requires_approval,
        requires_checklist: parsed.requires_checklist ?? fallback.requires_checklist,
        slot_duration_hours: parsed.slot_duration_hours ?? fallback.slot_duration_hours,
        checklist_items: parsed.checklist_items ?? [],
        rules_summary: parsed.rules_summary ?? userRules,
        ai_interpretation: parsed.ai_interpretation ?? "Configuração aplicada.",
      };
    }
  } catch {
    // fallback silencioso
  }

  return fallback;
}

export const configureAreaWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }: { data: { areaType: AreaType; userRules: string } }) => {
    const config = await callAI(data.areaType, data.userRules);
    return config;
  });
