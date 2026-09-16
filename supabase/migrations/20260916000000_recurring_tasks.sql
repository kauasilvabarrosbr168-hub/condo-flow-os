-- Tarefas diárias (recorrentes): o síndico marca uma tarefa como "diária" e o sistema
-- passa a recriar automaticamente uma instância pendente todos os dias para o colaborador,
-- sem precisar recriar manualmente. O síndico pode cancelar a recorrência quando quiser.

CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  kind public.task_kind NOT NULL DEFAULT 'manutencao',
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('baixa','normal','urgente')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_generated_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS recurring_tasks_condo_active_idx ON public.recurring_tasks (condo_id, active);

DROP POLICY IF EXISTS "Admins manage recurring tasks" ON public.recurring_tasks;
CREATE POLICY "Admins manage recurring tasks"
ON public.recurring_tasks
FOR ALL
TO authenticated
USING (public.is_condo_admin(auth.uid(), condo_id))
WITH CHECK (public.is_condo_admin(auth.uid(), condo_id));

DROP POLICY IF EXISTS "Members view recurring tasks in their condo" ON public.recurring_tasks;
CREATE POLICY "Members view recurring tasks in their condo"
ON public.recurring_tasks
FOR SELECT
TO authenticated
USING (public.is_condo_member(auth.uid(), condo_id));

-- Liga a instância diária gerada de volta ao modelo que a originou
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurring_task_id UUID REFERENCES public.recurring_tasks(id) ON DELETE SET NULL;
