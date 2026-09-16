// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/lib/supabase-auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { runRulesEngine } from './rules-engine'
import type { AIEventInput, CondoAISettings, AISeverity } from './types'

const DEFAULT_SETTINGS: CondoAISettings = {
  enabled: true,
  can_create_tasks: true,
  can_change_priority: true,
  can_create_reminders: true,
  can_redistribute_tasks: false,
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
        model: 'google/gemini-2.5-flash',
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

// IA redige o texto do aviso de WhatsApp a partir dos dados reais do evento — nunca inventa informação
async function writeWhatsAppText(eventType: string, context: Record<string, unknown>, fallback: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY
  if (!apiKey) return fallback

  const prompt = `Você escreve avisos por WhatsApp para o síndico/moradores de um condomínio, a partir de um evento do sistema CondoFlow.

Tipo de evento: ${eventType}
Dados do evento (use SOMENTE o que está aqui, nunca invente nada que não esteja nos dados): ${JSON.stringify(context)}

Escreva uma mensagem em português do Brasil que seja bem explicativa — conte claramente o que aconteceu, quem fez, quando e outros detalhes relevantes disponíveis nos dados (quantidade, área, observações etc.) — mas sem ficar longa: no máximo 3 frases curtas (~50 palavras). Use 2 a 4 emojis espalhados no texto para dar destaque aos pontos principais (ex.: 📅 para data/horário, 👤 para quem fez, 👥 para quantidade de pessoas, 🧹 para limpeza, ⚠️ para atenção), sempre combinando com o conteúdo da frase — não jogue emojis aleatórios. Pode usar *negrito* do WhatsApp com moderação para destacar o principal. Não use títulos nem hashtags. Responda APENAS com o texto da mensagem, sem aspas.`

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return fallback
    const data = await res.json()
    const text = ((data.choices?.[0]?.message?.content ?? '') as string).trim()
    return text || fallback
  } catch {
    return fallback
  }
}

// WhatsApp via Evolution API — credenciais por variável de ambiente, número vem do condo_ai_settings
async function sendEvolutionWhatsApp(phone: string, message: string): Promise<string> {
  const url      = process.env.EVOLUTION_API_URL
  const apiKey   = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE ?? 'condoflow'
  if (!url || !apiKey) {
    console.error('[WhatsApp] EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados nas variáveis de ambiente')
    return 'WhatsApp: não enviado — credenciais ausentes (EVOLUTION_API_URL/EVOLUTION_API_KEY)'
  }

  const number = phone.replace(/\D/g, '')
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, text: message, options: { delay: 1000, presence: 'composing' } }),
    })
    const body = await res.text()
    if (!res.ok) {
      console.error(`[WhatsApp] Evolution API respondeu ${res.status}: ${body}`)
      return `WhatsApp: falhou — HTTP ${res.status} (${body.slice(0, 200)})`
    }
    return 'WhatsApp: enviado'
  } catch (e: any) {
    console.error('[WhatsApp] erro de rede ao chamar Evolution API:', e?.message ?? e)
    return `WhatsApp: falhou — ${e?.message ?? 'erro de rede'}`
  }
}

function buildWhatsAppMessage(severity: AISeverity, body: string, eventType: string): string {
  const emoji =
    severity === 'critical' ? '🚨'
    : severity === 'warning' ? '⚠️'
    : eventType === 'reservation_created' ? '📅'
    : eventType === 'reservation_cancelled' ? '🗑️'
    : 'ℹ️'
  const eventLabel: Record<string, string> = {
    reservation_created: 'Reserva criada',
    reservation_cancelled: 'Reserva cancelada',
    task_status_changed: 'Tarefa atualizada',
    task_overdue: 'Tarefa atrasada',
    cleaning_requested: 'Limpeza solicitada',
    service_completed: 'Serviço concluído',
    incident_reported: 'Incidente reportado',
  }
  const label = eventLabel[eventType] ?? eventType

  let msg = `${emoji} *CondoFlow — ${label}*\n\n${body}`
  msg += '\n\n_Acesse o app para mais detalhes._'
  return msg
}

// Lógica de fato — extraída para ser chamada tanto pelo server fn público quanto
// diretamente por outras rotinas do servidor (ex.: checagem periódica de tarefas atrasadas).
export async function dispatchAIEventInternal(data: AIEventInput) {
    const adminSb = supabaseAdmin

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

    // WhatsApp via Evolution API — número do síndico cadastrado em Monitor de IA
    const phone = settings.whatsapp_phone
    const isReservationEvent = data.eventType === 'reservation_created' || data.eventType === 'reservation_cancelled'
    const shouldNotify =
      phone &&
      ((finalSeverity === 'warning'  && settings.notify_warning  !== false) ||
       (finalSeverity === 'critical' && settings.notify_critical !== false) ||
       isReservationEvent)

    if (shouldNotify) {
      const fallbackBody = finalRecommendation ? `${finalSummary}\n\n💡 *Recomendação:* ${finalRecommendation}` : finalSummary
      const body = await writeWhatsAppText(
        data.eventType,
        { ...data.context, situacao: finalSummary, recomendacao: finalRecommendation || undefined },
        fallbackBody,
      )
      actionsExecuted.push(`WhatsApp (texto): ${body}`)
      const msg = buildWhatsAppMessage(finalSeverity, body, data.eventType)
      actionsExecuted.push(await sendEvolutionWhatsApp(phone, msg))
    } else if (!phone) {
      actionsExecuted.push('WhatsApp: não enviado — nenhum número cadastrado em IA Operacional')
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
}

export const dispatchAIEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AIEventInput) => input)
  .handler(async ({ data }: { data: AIEventInput }) => dispatchAIEventInternal(data))
