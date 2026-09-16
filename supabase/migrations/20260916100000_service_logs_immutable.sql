-- Histórico de serviços/manutenção: precisa existir mesmo que a migração original
-- (que criava esta tabela) nunca tenha sido de fato aplicada, e as políticas não podem
-- usar o schema app_private (não existe em produção — ver 20260916000000_recurring_tasks.sql).
-- Além disso, NINGUÉM — nem síndico, nem colaborador — pode apagar um registro do histórico.

CREATE TABLE IF NOT EXISTS public.service_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condo_id UUID NOT NULL,
  task_id UUID,
  worker_id UUID NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  done_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_logs_condo ON public.service_logs(condo_id, done_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_logs_worker ON public.service_logs(worker_id, done_at DESC);

ALTER TABLE public.service_logs ENABLE ROW LEVEL SECURITY;

-- Remove qualquer política de DELETE que possa existir (histórico é permanente)
DROP POLICY IF EXISTS "service_logs admin manage" ON public.service_logs;
REVOKE DELETE ON public.service_logs FROM authenticated;
GRANT SELECT, INSERT ON public.service_logs TO authenticated;
GRANT ALL ON public.service_logs TO service_role;

DROP POLICY IF EXISTS "service_logs worker insert" ON public.service_logs;
CREATE POLICY "service_logs worker insert"
  ON public.service_logs FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid() AND public.is_condo_member(auth.uid(), condo_id));

DROP POLICY IF EXISTS "service_logs worker view own" ON public.service_logs;
CREATE POLICY "service_logs worker view own"
  ON public.service_logs FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

DROP POLICY IF EXISTS "service_logs admin view all" ON public.service_logs;
CREATE POLICY "service_logs admin view all"
  ON public.service_logs FOR SELECT TO authenticated
  USING (public.is_condo_admin(auth.uid(), condo_id) OR public.is_platform_admin(auth.uid()));
