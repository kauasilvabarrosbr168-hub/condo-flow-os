export type AIEventType =
  | 'reservation_created'
  | 'reservation_cancelled'
  | 'task_created'
  | 'task_status_changed'
  | 'cleaning_requested'
  | 'service_completed'
  | 'incident_reported'

export type AISeverity = 'info' | 'warning' | 'critical'

export type AIActionType = 'create_task' | 'update_priority' | 'add_recommendation'

export type AIAction = {
  type: AIActionType
  description: string
  payload?: Record<string, unknown>
}

export type AIEventInput = {
  condoId: string
  eventType: AIEventType
  entityType: string
  entityId: string
  context: Record<string, unknown>
}

export type CondoAISettings = {
  enabled: boolean
  can_create_tasks: boolean
  can_change_priority: boolean
  can_create_reminders: boolean
  can_redistribute_tasks: boolean
}

export type RulesResult = {
  handled: boolean
  needsAI: boolean
  severity: AISeverity
  summary: string
  actions: AIAction[]
}
