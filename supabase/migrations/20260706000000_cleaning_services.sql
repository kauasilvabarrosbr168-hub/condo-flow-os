-- Tabela de empresas/diaristas de limpeza cadastradas pelo síndico
CREATE TABLE IF NOT EXISTS cleaning_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  price_cents integer NOT NULL DEFAULT 0,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Coluna na reserva para registrar qual serviço foi solicitado
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS cleaning_service_id uuid REFERENCES cleaning_services(id) DEFAULT NULL;

-- RLS
ALTER TABLE cleaning_services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "membros veem servicos de limpeza" ON cleaning_services
    FOR SELECT USING (
      condo_id IN (SELECT condo_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "sindico gerencia servicos de limpeza" ON cleaning_services
    FOR ALL USING (
      condo_id IN (
        SELECT ur.condo_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('sindico', 'administradora')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
