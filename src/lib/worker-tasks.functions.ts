import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const UrgencyEnum = z.enum(["baixa", "normal", "urgente"]);
const KindEnum = z.enum(["manutencao", "limpeza", "verificacao", "incidente", "pos_checklist", "pre_checklist"]);

// ─── Criar tarefa avulsa (síndico) ───────────────────────────────────────────

export const createWorkerTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      condoId:           z.string().uuid(),
      title:             z.string().min(1).max(120),
      description:       z.string().max(500).nullable().optional(),
      kind:              KindEnum.default("manutencao"),
      urgency:           UrgencyEnum.default("normal"),
      assigneeId:        z.string().uuid().nullable().optional(),
      dueAt:             z.string().nullable().optional(),
      notifyImmediately: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Verifica que caller é síndico ou administradora
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    const { data: task, error } = await supabaseAdmin.from("tasks").insert({
      condo_id:           data.condoId,
      title:              data.title,
      description:        data.description ?? null,
      kind:               data.kind,
      urgency:            data.urgency,
      assignee_id:        data.assigneeId ?? null,
      due_at:             data.dueAt ?? null,
      status:             "pendente",
      created_by:         context.userId,
      ai_generated:       false,
      notify_immediately: data.urgency === "urgente" || data.notifyImmediately,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: task.id };
  });

// ─── Listar colaboradores do condomínio ───────────────────────────────────────

export const listCondoCollaborators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("condo_id", data.condoId)
      .eq("role", "funcionario");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return [];
    const { data: profiles } = await supabaseAdmin
      .from("profiles").select("id, full_name, email").in("id", ids);
    return profiles ?? [];
  });

// ─── Gerar tarefas com IA ─────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<{ title: string; description: string; kind: string; urgency: string; due_at: string | null }[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content ?? "") as string;
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : (parsed.tasks ?? []);
  } catch {
    return [];
  }
}

export const generateAITasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    // Carrega contexto do condomínio
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 86400_000).toISOString();

    const [condoRes, areasRes, reservationsRes, pendingTasksRes, cleaningRes, serviceRulesRes] = await Promise.all([
      supabaseAdmin.from("condominiums").select("name, description").eq("id", data.condoId).maybeSingle(),
      supabaseAdmin.from("common_areas").select("id, name, rules_summary, requires_checklist").eq("condo_id", data.condoId).eq("active", true).limit(10),
      supabaseAdmin.from("reservations").select("starts_at, ends_at, area_id, cleaning_type").eq("condo_id", data.condoId).neq("status", "cancelada").gte("starts_at", now.toISOString()).lte("starts_at", in7days).order("starts_at", { ascending: true }).limit(10),
      supabaseAdmin.from("tasks").select("title").eq("condo_id", data.condoId).neq("status", "concluida").limit(20),
      supabaseAdmin.from("condo_cleaning_config").select("internal_enabled, price_cents").eq("condo_id", data.condoId).maybeSingle(),
      supabaseAdmin.from("condo_service_rules").select("title, description, frequency, priority, area_id").eq("condo_id", data.condoId).eq("active", true).order("priority", { ascending: false }).limit(30),
    ]);

    const areaMap = Object.fromEntries((areasRes.data ?? []).map((a) => [a.name, a]));
    const reservationsWithArea = (reservationsRes.data ?? []).map((r: any) => {
      const area = areasRes.data?.find((a) => a.id === r.area_id);
      return { ...r, area_name: area?.name ?? "área" };
    });

    const serviceRules = serviceRulesRes.data ?? [];

    // Carrega também o contexto livre do síndico
    const contextRes = await supabaseAdmin.from("condominiums").select("ai_context").eq("id", data.condoId).maybeSingle();
    const aiContext = contextRes.data?.ai_context ?? null;

    const prompt = `Você é o assistente operacional do condomínio "${condoRes.data?.name ?? "CondoFlow"}".
SIGA RIGOROSAMENTE AS REGRAS ABAIXO — elas foram definidas pelo síndico e têm prioridade máxima.

${aiContext ? `CONTEXTO GERAL DO CONDOMÍNIO (explicado pelo síndico):
"""
${aiContext}
"""

` : ""}REGRAS OPERACIONAIS DO CONDOMÍNIO (definidas pelo síndico):
${serviceRules.length
  ? serviceRules.map((r: any) => {
      const area = areasRes.data?.find((a) => a.id === r.area_id);
      const parts = [
        `- [${r.priority === "alta" ? "⚠️ ALTA" : r.priority === "normal" ? "NORMAL" : "BAIXA"}] ${r.title}`,
        r.description ? `: ${r.description}` : "",
        r.frequency   ? ` (Frequência: ${r.frequency})` : "",
        area          ? ` — Área: ${area.name}` : "",
      ];
      return parts.join("");
    }).join("\n")
  : "Nenhuma regra operacional cadastrada — use boas práticas gerais de condomínio."}

ÁREAS COMUNS E REGRAS ESPECÍFICAS DE CADA ÁREA:
${(areasRes.data ?? []).map((a) => `- ${a.name}: ${a.rules_summary ?? "sem regras especiais"}${a.requires_checklist ? " (requer checklist)" : ""}`).join("\n") || "Nenhuma área cadastrada."}

RESERVAS DOS PRÓXIMOS 7 DIAS:
${reservationsWithArea.length ? reservationsWithArea.map((r) => `- ${r.area_name}: ${new Date(r.starts_at).toLocaleString("pt-BR")} → ${new Date(r.ends_at).toLocaleString("pt-BR")}`).join("\n") : "Nenhuma reserva nos próximos 7 dias."}

TAREFAS JÁ EM ABERTO (não duplicar):
${(pendingTasksRes.data ?? []).map((t) => `- ${t.title}`).join("\n") || "Nenhuma tarefa pendente."}

DATA/HORA ATUAL: ${now.toLocaleString("pt-BR")}

Com base nessas informações, sugira de 3 a 6 tarefas/serviços para o colaborador do condomínio.
Priorize: limpeza entre reservas, verificações de segurança, manutenções preventivas, preparação de áreas.
Não repita tarefas já em aberto. Identifique serviços que podem estar faltando ou atrasados.

Responda APENAS com JSON válido (sem markdown):
[
  {
    "title": "título curto da tarefa (máx 80 chars)",
    "description": "detalhes em 1-2 frases",
    "kind": "limpeza | manutencao | verificacao | pre_checklist | pos_checklist",
    "urgency": "baixa | normal | urgente",
    "due_at": "ISO 8601 ou null",
    "reasoning": "por que esta tarefa é necessária agora (1 frase)"
  }
]`;

    const suggestions = await callAI(prompt);
    if (!suggestions.length) return { created: 0, proposals: [] };

    const validKinds = ["limpeza", "manutencao", "verificacao", "pre_checklist", "pos_checklist", "incidente"];
    const validUrgencies = ["baixa", "normal", "urgente"];

    const toInsert = suggestions.map((s) => ({
      condo_id:     data.condoId,
      title:        String(s.title).slice(0, 120),
      description:  s.description ? String(s.description).slice(0, 500) : null,
      kind:         validKinds.includes(s.kind) ? s.kind : "manutencao",
      urgency:      validUrgencies.includes(s.urgency) ? s.urgency : "normal",
      due_at:       s.due_at ?? null,
      ai_reasoning: s.reasoning ? String(s.reasoning).slice(0, 300) : null,
      status:       "pending",
    }));

    const { data: created, error } = await supabaseAdmin.from("ai_task_proposals").insert(toInsert).select("id, title, urgency");
    if (error) throw new Error(error.message);
    return { created: created?.length ?? 0, proposals: created ?? [] };
  });
