import type { AIEventInput, CondoAISettings, RulesResult, AIAction } from './types'

function formatDateBR(iso?: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}`
}

function formatGuests(guests?: number): string {
  if (typeof guests !== 'number') return ''
  return ` para ${guests} convidado${guests === 1 ? '' : 's'}`
}

export function runRulesEngine(event: AIEventInput, settings: CondoAISettings): RulesResult {
  const actions: AIAction[] = []

  switch (event.eventType) {
    case 'reservation_created': {
      const ctx = event.context as {
        areaName?: string; cleaningServiceId?: string | null; residentName?: string
        guests?: number; date?: string; startTime?: string; endTime?: string
      }
      if (ctx.cleaningServiceId) {
        actions.push({ type: 'add_recommendation', description: `Limpeza pós-evento agendada para ${ctx.areaName ?? 'a área'}` })
      }
      const who = ctx.residentName ?? 'Um morador'
      const when = ctx.date && ctx.startTime ? ` em ${formatDateBR(ctx.date)} às ${ctx.startTime}${ctx.endTime ? ` (até ${ctx.endTime})` : ''}` : ''
      return {
        handled: true,
        needsAI: false,
        severity: 'info',
        summary: `${who} fez uma reserva de ${ctx.areaName ?? 'área'}${when}${formatGuests(ctx.guests)}.${ctx.cleaningServiceId ? ' Limpeza pós-evento solicitada.' : ''}`,
        actions,
      }
    }

    case 'reservation_cancelled': {
      const ctx = event.context as { areaName?: string; residentName?: string; startsAt?: string }
      actions.push({ type: 'add_recommendation', description: 'Revisar tarefas vinculadas à reserva cancelada' })
      const who = ctx.residentName ?? 'Um morador'
      const when = ctx.startsAt ? ` marcada para ${new Date(ctx.startsAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''
      return {
        handled: true,
        needsAI: false,
        severity: 'info',
        summary: `${who} cancelou a reserva de ${ctx.areaName ?? 'área'}${when}. Tarefas associadas devem ser revisadas.`,
        actions,
      }
    }

    case 'task_status_changed': {
      const ctx = event.context as { title?: string; newStatus?: string; wasOverdue?: boolean; actorName?: string }
      const who = ctx.actorName ?? 'Alguém'
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
          summary: `Tarefa "${ctx.title}" está atrasada (atualizada por ${who}). ${settings.can_change_priority ? 'Prioridade escalada automaticamente.' : 'Requer atenção do síndico.'}`,
          actions,
        }
      }
      if (ctx.newStatus === 'concluida') {
        return { handled: true, needsAI: false, severity: 'info', summary: `${who} concluiu a tarefa "${ctx.title}".`, actions }
      }
      return { handled: true, needsAI: false, severity: 'info', summary: `${who} atualizou a tarefa "${ctx.title}" → ${ctx.newStatus}.`, actions }
    }

    case 'task_overdue': {
      const ctx = event.context as { title?: string; dueAt?: string; assigneeName?: string | null }
      actions.push({ type: 'update_priority', description: `Tarefa "${ctx.title}" escalada para urgente por atraso` })
      const when = ctx.dueAt ? ` (prazo era ${new Date(ctx.dueAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})` : ''
      const who = ctx.assigneeName ? ` Atribuída a ${ctx.assigneeName}.` : ''
      return {
        handled: true,
        needsAI: false,
        severity: 'warning',
        summary: `Tarefa "${ctx.title}" está atrasada${when} e foi marcada como urgente automaticamente.${who}`,
        actions,
      }
    }

    case 'task_created': {
      const ctx = event.context as { title?: string; kind?: string; creatorName?: string; assigneeName?: string | null }
      const who = ctx.creatorName ?? 'Alguém'
      const assignee = ctx.assigneeName ? ` Responsável: ${ctx.assigneeName}.` : ''
      return { handled: true, needsAI: false, severity: 'info', summary: `${who} criou a tarefa "${ctx.title}"${ctx.kind ? ` (${ctx.kind})` : ''}.${assignee}`, actions }
    }

    case 'cleaning_requested': {
      const ctx = event.context as { serviceName?: string; areaName?: string; residentName?: string; date?: string; startTime?: string }
      const when = ctx.date && ctx.startTime ? ` para ${formatDateBR(ctx.date)} às ${ctx.startTime}` : ''
      const who = ctx.residentName ? ` (reserva de ${ctx.residentName})` : ''
      return {
        handled: true,
        needsAI: false,
        severity: 'info',
        summary: `Limpeza solicitada: ${ctx.serviceName ?? 'prestador'} para ${ctx.areaName ?? 'área'}${when}${who}. Tarefa criada automaticamente.`,
        actions,
      }
    }

    case 'service_completed': {
      const ctx = event.context as { taskTitle?: string; workerName?: string; notes?: string | null }
      const who = ctx.workerName ?? 'Um colaborador'
      const notes = ctx.notes ? ` Obs: ${ctx.notes}` : ''
      return { handled: true, needsAI: false, severity: 'info', summary: `${who} concluiu o serviço "${ctx.taskTitle ?? 'tarefa'}".${notes}`, actions }
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
