-- Contexto livre do síndico para a IA aprender a rotina do condomínio
ALTER TABLE public.condominiums
  ADD COLUMN IF NOT EXISTS ai_context       TEXT,
  ADD COLUMN IF NOT EXISTS ai_onboarded_at  TIMESTAMPTZ;

-- Sugestões de tarefas geradas pela IA, aguardando aprovação do síndico
CREATE TABLE IF NOT EXISTS public.ai_task_proposals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id      UUID        NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  description   TEXT,
  kind          TEXT        NOT NULL DEFAULT 'manutencao',
  urgency       TEXT        NOT NULL DEFAULT 'normal',
  ai_reasoning  TEXT,
  due_at        TIMESTAMPTZ,
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   UUID        REFERENCES auth.users(id),
  reviewed_at   TIMESTAMPTZ,
  task_id       UUID        REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_task_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sindico gerencia propostas ia"
  ON public.ai_task_proposals FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.condo_id = ai_task_proposals.condo_id
        AND ur.role IN ('sindico', 'administradora')
    )
  );

CREATE INDEX IF NOT EXISTS ai_task_proposals_condo_status_idx
  ON public.ai_task_proposals(condo_id, status, created_at DESC);

-- Adiciona campos de notificação ao condo_ai_settings (se ainda não existirem)
ALTER TABLE public.condo_ai_settings
  ADD COLUMN IF NOT EXISTS whatsapp_phone  TEXT,
  ADD COLUMN IF NOT EXISTS notify_warning  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_critical BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_generate   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_auto_gen_at TIMESTAMPTZ;
