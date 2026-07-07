// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { runRulesEngine } from './rules-engine'
import type { AIEventInput, CondoAISettings, AISeverity } from './types'

const DEFAULT_SETTINGS: CondoAISettings = {
  enabled: true,
  can_create_tasks: true,
  can_change_priority: true,
  can_create_reminders: true,
  can_redistribute_tasks: false,
}

function getAdminClient() {
  const url = (import.meta.env?.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL) as string
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  return createClient(url, key)
}

async function callAI(event: AIEventInput, rulesSummary: string): Promise<{ severity: AISeverity; analysis: string; recommendation: string }> {
  const apiKey = process.env.LOVABLE_API_KEY
  if (!apiKey) return { severity: 'warning', analysis: rulesSummary, recommendation: '' }

  const prompt = `Você é o Motor de Inteligência Operacional do CondoFlow — um gerente operacional virtual que analisa eventos de condomínio.

Evento: ${event.eventType}
Contexto: ${JSON.stringify(event.context)}
Situação identificada pelas regras: ${rulesSummary}

Analise e responda APENAS com JSON válido (sem markdown):
{"severity":"warning","analysis":"análise em português (máx 60 palavras)","recommendation":"ação recomendada (máx 30 palavras)"}`

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        max_tokens: 250,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return { severity: 'warning', analysis: rulesSummary, recommendation: '' }
    const data = await res.json()
    const text = (data.choices?.[0]?.message?.content ?? '') as string
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {
    // fallback silencioso — rules engine já tratou
  }
  return { severity: 'warning', analysis: rulesSummary, recommendation: '' }
}

export const dispatchAIEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }: { data: AIEventInput }) => {
    const adminSb = getAdminClient()

    const { data: settingsRow } = await adminSb
      .from('condo_ai_settings')
      .select('*')
      .eq('condo_id', data.condoId)
      .maybeSingle()

    const settings: CondoAISettings = settingsRow ?? DEFAULT_SETTINGS
    if (!settings.enabled) return { success: true, skipped: true }

    const rulesResult = runRulesEngine(data, settings)
    const actionsExecuted: string[] = rulesResult.actions.map((a) => a.description)

    let aiAnalysis: string | null = null
    let aiCalled = false
    let finalSeverity = rulesResult.severity
    let finalSummary = rulesResult.summary

    if (rulesResult.needsAI) {
      aiCalled = true
      const aiResult = await callAI(data, rulesResult.summary)
      aiAnalysis = aiResult.analysis
      finalSeverity = (aiResult.severity ?? finalSeverity) as AISeverity
      finalSummary = aiResult.analysis
      if (aiResult.recommendation) actionsExecuted.push(`IA: ${aiResult.recommendation}`)
    }

    await adminSb.from('ai_event_log').insert({
      condo_id: data.condoId,
      event_type: data.eventType,
      entity_type: data.entityType,
      entity_id: data.entityId,
      event_context: data.context,
      rules_handled: rulesResult.handled,
      rules_actions: rulesResult.actions,
      ai_called: aiCalled,
      ai_analysis: aiAnalysis,
      ai_actions: [],
      severity: finalSeverity,
      summary: finalSummary,
      actions_taken: actionsExecuted,
    })

    return { success: true }
  })
