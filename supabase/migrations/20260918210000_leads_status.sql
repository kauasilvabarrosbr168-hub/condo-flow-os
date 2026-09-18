-- Status de atendimento dos leads (pendente → atendendo → concluído).
-- Aplicado manualmente pelo usuário via SQL Editor do painel do Supabase.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente'
  CHECK (status IN ('pendente', 'atendendo', 'concluido'));

CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
