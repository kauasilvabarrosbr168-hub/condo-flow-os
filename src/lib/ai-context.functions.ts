// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return "";
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (data.choices?.[0]?.message?.content ?? "") as string;
  } catch {
    return "";
  }
}

// ─── Salvar contexto e gerar regras operacionais ──────────────────────────────

export const saveCondoAiContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      condoId: z.string().uuid(),
      context: z.string().min(20).max(8000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Verifica que caller é síndico ou administradora
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    // 1. Salva o texto livre no campo ai_context do condomínio
    const { error: ctxErr } = await supabaseAdmin
      .from("condominiums")
      .update({ ai_context: data.context, ai_onboarded_at: new Date().toISOString() })
      .eq("id", data.condoId);
    if (ctxErr) throw new Error(ctxErr.message);

    // 2. Pede para a IA extrair regras operacionais estruturadas do texto
    const prompt = `Você é um assistente de gestão condominial. O síndico descreveu abaixo como o condomínio funciona.
Extraia as REGRAS OPERACIONAIS relevantes para tarefas de manutenção, limpeza e verificação rotineiras.

DESCRIÇÃO DO SÍNDICO:
"""
${data.context}
"""

Responda APENAS com JSON válido (array), sem markdown:
[
  {
    "title": "título curto da regra (máx 80 chars)",
    "description": "detalhes do que deve ser feito",
    "frequency": "diária | semanal | quinzenal | mensal | após cada reserva | sob demanda",
    "priority": "baixa | normal | alta"
  }
]

Extraia no mínimo 3 e no máximo 15 regras. Foque em tarefas concretas e recorrentes.`;

    const raw = await callAI(prompt);
    let rules: { title: string; description: string; frequency: string; priority: string }[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) rules = JSON.parse(match[0]);
    } catch { rules = []; }

    if (rules.length > 0) {
      // Remove regras antigas antes de inserir as novas
      await supabaseAdmin.from("condo_service_rules").delete().eq("condo_id", data.condoId);

      const validPriorities = ["baixa", "normal", "alta"];
      await supabaseAdmin.from("condo_service_rules").insert(
        rules.slice(0, 15).map((r) => ({
          condo_id:    data.condoId,
          title:       String(r.title).slice(0, 80),
          description: r.description ? String(r.description).slice(0, 500) : null,
          frequency:   r.frequency ?? "semanal",
          priority:    validPriorities.includes(r.priority) ? r.priority : "normal",
          active:      true,
        })),
      );
    }

    return { ok: true, rulesCreated: rules.length };
  });

// ─── Ler contexto atual ───────────────────────────────────────────────────────

export const getCondoAiContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    const [condoRes, rulesRes] = await Promise.all([
      supabaseAdmin.from("condominiums").select("ai_context, ai_onboarded_at").eq("id", data.condoId).maybeSingle(),
      supabaseAdmin.from("condo_service_rules").select("id,title,description,frequency,priority,active").eq("condo_id", data.condoId).order("priority", { ascending: false }),
    ]);

    return {
      aiContext:     condoRes.data?.ai_context ?? null,
      onboardedAt:   condoRes.data?.ai_onboarded_at ?? null,
      serviceRules:  rulesRes.data ?? [],
    };
  });

// ─── Aprovar proposta de tarefa ───────────────────────────────────────────────

export const approveAiProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      proposalId: z.string().uuid(),
      assigneeId: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: proposal } = await supabaseAdmin
      .from("ai_task_proposals").select("*").eq("id", data.proposalId).maybeSingle();
    if (!proposal) throw new Error("Proposta não encontrada");
    if (proposal.status !== "pending") throw new Error("Proposta já foi revisada");

    // Verifica que caller é síndico do condo desta proposta
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", proposal.condo_id).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    // Cria a tarefa real
    const { data: task, error } = await supabaseAdmin.from("tasks").insert({
      condo_id:     proposal.condo_id,
      title:        proposal.title,
      description:  proposal.description,
      kind:         proposal.kind,
      urgency:      proposal.urgency,
      due_at:       proposal.due_at,
      assignee_id:  data.assigneeId ?? null,
      status:       "pendente",
      ai_generated: true,
      created_by:   context.userId,
      notify_immediately: proposal.urgency === "urgente",
    }).select("id").single();
    if (error) throw new Error(error.message);

    // Marca proposta como aprovada
    await supabaseAdmin.from("ai_task_proposals").update({
      status:      "approved",
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
      task_id:     task.id,
    }).eq("id", data.proposalId);

    return { taskId: task.id };
  });

// ─── Rejeitar proposta de tarefa ──────────────────────────────────────────────

export const rejectAiProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ proposalId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: proposal } = await supabaseAdmin
      .from("ai_task_proposals").select("condo_id, status").eq("id", data.proposalId).maybeSingle();
    if (!proposal) throw new Error("Proposta não encontrada");
    if (proposal.status !== "pending") throw new Error("Proposta já foi revisada");

    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", proposal.condo_id).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    await supabaseAdmin.from("ai_task_proposals").update({
      status:      "rejected",
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", data.proposalId);

    return { ok: true };
  });
