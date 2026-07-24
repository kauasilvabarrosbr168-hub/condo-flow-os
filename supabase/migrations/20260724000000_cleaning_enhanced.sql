-- Configuração de limpeza interna do condomínio
CREATE TABLE IF NOT EXISTS condo_cleaning_config (
  condo_id    uuid PRIMARY KEY REFERENCES condominiums(id) ON DELETE CASCADE,
  internal_enabled boolean NOT NULL DEFAULT false,
  price_cents  integer NOT NULL DEFAULT 0,
  worker_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE condo_cleaning_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "membros veem config limpeza" ON condo_cleaning_config
    FOR SELECT USING (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "sindico gerencia config limpeza" ON condo_cleaning_config
    FOR ALL USING (
      condo_id IN (
        SELECT ur.condo_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('sindico', 'administradora')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pedidos de limpeza interna
CREATE TABLE IF NOT EXISTS cleaning_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id     uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id),
  worker_id    uuid REFERENCES profiles(id),
  unit_label   text,
  notes        text,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','accepted','done','cancelled')),
  price_cents  integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  done_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE cleaning_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "membros veem pedidos limpeza" ON cleaning_requests
    FOR SELECT USING (condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "membros criam pedido limpeza" ON cleaning_requests
    FOR INSERT WITH CHECK (
      requested_by = auth.uid() AND
      condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "solicitante cancela proprio pedido" ON cleaning_requests
    FOR UPDATE USING (requested_by = auth.uid() AND status = 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "sindico e funcionario gerenciam pedidos" ON cleaning_requests
    FOR ALL USING (
      condo_id IN (
        SELECT ur.condo_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('sindico','administradora','funcionario')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Qualquer membro do condomínio pode sugerir um prestador externo
DO $$ BEGIN
  CREATE POLICY "membros sugerem prestadores" ON cleaning_services
    FOR INSERT WITH CHECK (
      condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
