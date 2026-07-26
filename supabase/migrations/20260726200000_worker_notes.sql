-- Tabela de anotações e lembretes dos colaboradores
CREATE TABLE public.worker_notes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  condo_id     uuid        NOT NULL REFERENCES public.condos(id) ON DELETE CASCADE,
  content      text        NOT NULL,
  remind_at    timestamptz,
  completed    boolean     NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage their own notes"
  ON public.worker_notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Índice para busca eficiente de lembretes vencidos
CREATE INDEX worker_notes_remind_idx ON public.worker_notes (user_id, remind_at)
  WHERE remind_at IS NOT NULL AND completed = false;
