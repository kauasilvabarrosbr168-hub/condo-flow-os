-- Regras operacionais do condomínio definidas pelo síndico
-- A IA lê esta tabela ao gerar tarefas automáticas
CREATE TABLE public.condo_service_rules (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id    uuid        NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  frequency   text,        -- ex: "diária", "semanal", "após cada reserva"
  area_id     uuid        REFERENCES public.common_areas(id) ON DELETE SET NULL,
  priority    text        NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('baixa', 'normal', 'alta')),
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.condo_service_rules ENABLE ROW LEVEL SECURITY;

-- Apenas síndico e administradora podem gerenciar as regras
CREATE POLICY "condo admins manage service rules"
  ON public.condo_service_rules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.condo_id = condo_service_rules.condo_id
        AND ur.role IN ('sindico', 'administradora')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.condo_id = condo_service_rules.condo_id
        AND ur.role IN ('sindico', 'administradora')
    )
  );

CREATE INDEX condo_service_rules_condo_idx
  ON public.condo_service_rules (condo_id, active, priority DESC);
