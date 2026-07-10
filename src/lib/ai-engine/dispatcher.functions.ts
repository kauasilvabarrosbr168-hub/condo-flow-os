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

async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886'
  if (!sid || !token) return

  const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`

  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${sid}:${token}`)}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: message }).toString(),
    })
  } catch {
    // falha silenciosa — notificação não deve travar o fluxo
  }
}

function buildWhatsAppMessage(severity: AISeverity, summary: string, recommendation: string, eventType: string): string {
  const emoji = severity === 'critical' ? '🚨' : '⚠️'
  const eventLabel: Record<string, string> = {
    reservation_created: 'Reserva criada',
    reservation_cancelled: 'Reserva cancelada',
    task_status_changed: 'Tarefa atualizada',
    cleaning_requested: 'Limpeza solicitada',
    service_completed: 'Serviço concluído',
    incident_reported: 'Incidente reportado',
  }
  const label = eventLabel[eventType] ?? eventType

  let msg = `${emoji} *CondoFlow — ${label}*\n\n${summary}`
  if (recommendation) msg += `\n\n💡 *Recomendação:* ${recommendation}`
  msg += '\n\n_Acesse o app para mais detalhes._'
  return msg
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

    const settings: CondoAISettings & {
      whatsapp_phone?: string | null
      notify_warning?: boolean
      notify_critical?: boolean
    } = settingsRow ?? DEFAULT_SETTINGS

    if (!settings.enabled) return { success: true, skipped: true }

    const rulesResult = runRulesEngine(data, settings)
    const actionsExecuted: string[] = rulesResult.actions.map((a) => a.description)

    let aiAnalysis: string | null = null
    let aiCalled = false
    let finalSeverity = rulesResult.severity
    let finalSummary = rulesResult.summary
    let finalRecommendation = ''

    if (rulesResult.needsAI) {
      aiCalled = true
      const aiResult = await callAI(data, rulesResult.summary)
      aiAnalysis = aiResult.analysis
      finalSeverity = (aiResult.severity ?? finalSeverity) as AISeverity
      finalSummary = aiResult.analysis
      finalRecommendation = aiResult.recommendation ?? ''
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

    // WhatsApp — só envia para warning/critical se o síndico configurou o número
    const phone = settings.whatsapp_phone
    const shouldNotify =
      phone &&
      ((finalSeverity === 'warning' && settings.notify_warning !== false) ||
        (finalSeverity === 'critical' && settings.notify_critical !== false))

    if (shouldNotify) {
      const msg = buildWhatsAppMessage(finalSeverity, finalSummary, finalRecommendation, data.eventType)
      void sendWhatsApp(phone, msg)
    }

    return { success: true }
  })
