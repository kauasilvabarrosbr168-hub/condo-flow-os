import type { AIEventInput, CondoAISettings, RulesResult, AIAction } from './types'

export function runRulesEngine(event: AIEventInput, settings: CondoAISettings): RulesResult {
  const actions: AIAction[] = []

  switch (event.eventType) {
    case 'reservation_created': {
      const ctx = event.context as { areaName?: string; cleaningServiceId?: string | null }
      if (ctx.cleaningServiceId) {
        actions.push({ type: 'add_recommendation', description: `Limpeza pós-evento agendada para ${ctx.areaName ?? 'a área'}` })
      }
      return {
        handled: true,
        needsAI: false,
        severity: 'info',
        summary: `Reserva criada: ${ctx.areaName ?? 'área'}${ctx.cleaningServiceId ? ' · limpeza solicitada' : ''}`,
        actions,
      }
    }

    case 'reservation_cancelled': {
      const ctx = event.context as { areaName?: string }
      actions.push({ type: 'add_recommendation', description: 'Revisar tarefas vinculadas à reserva cancelada' })
      return {
        handled: true,
        needsAI: false,
        severity: 'info',
        summary: `Reserva cancelada: ${ctx.areaName ?? 'área'}. Tarefas associadas devem ser revisadas.`,
        actions,
      }
    }

    case 'task_status_changed': {
      const ctx = event.context as { title?: string; newStatus?: string; wasOverdue?: boolean }
      if (ctx.wasOverdue && ctx.newStatus !== 'concluida') {
        if (settings.can_change_priority) {
          actions.push({
            type: 'update_priority',
            description: `Prioridade escalada: "${ctx.title}" está atrasada`,
            payload: { taskId: event.entityId },
          })
        }
        return {
          handled: settings.can_change_priority,
          needsAI: !settings.can_change_priority,
          severity: 'warning',
          summary: `Tarefa "${ctx.title}" está atrasada. ${settings.can_change_priority ? 'Prioridade escalada automaticamente.' : 'Requer atenção do síndico.'}`,
          actions,
        }
      }
      if (ctx.newStatus === 'concluida') {
        return { handled: true, needsAI: false, severity: 'info', summary: `Tarefa "${ctx.title}" concluída.`, actions }
      }
      return { handled: true, needsAI: false, severity: 'info', summary: `Tarefa "${ctx.title}" → ${ctx.newStatus}.`, actions }
    }

    case 'task_created': {
      const ctx = event.context as { title?: string; kind?: string }
      return { handled: true, needsAI: false, severity: 'info', summary: `Tarefa criada: "${ctx.title}"${ctx.kind ? ` (${ctx.kind})` : ''}.`, actions }
    }

    case 'cleaning_requested': {
      const ctx = event.context as { serviceName?: string; areaName?: string }
      return {
        handled: true,
        needsAI: false,
        severity: 'info',
        summary: `Limpeza solicitada: ${ctx.serviceName ?? 'prestador'} para ${ctx.areaName ?? 'área'}. Tarefa criada automaticamente.`,
        actions,
      }
    }

    case 'service_completed': {
      const ctx = event.context as { taskTitle?: string }
      return { handled: true, needsAI: false, severity: 'info', summary: `Serviço concluído: "${ctx.taskTitle ?? 'tarefa'}".`, actions }
    }

    case 'incident_reported': {
      return {
        handled: false,
        needsAI: true,
        severity: 'critical',
        summary: 'Incidente reportado — análise de IA necessária.',
        actions,
      }
    }

    default:
      return { handled: true, needsAI: false, severity: 'info', summary: 'Evento registrado.', actions }
  }
}
