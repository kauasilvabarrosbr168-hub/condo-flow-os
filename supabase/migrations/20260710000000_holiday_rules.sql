CREATE TABLE IF NOT EXISTS condo_holiday_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  holiday_key text NOT NULL,
  blocked boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (condo_id, holiday_key)
);

ALTER TABLE condo_holiday_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros do condo podem ler feriados"
  ON condo_holiday_rules FOR SELECT
  USING (condo_id IN (
    SELECT condo_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Sindico pode gerenciar feriados"
  ON condo_holiday_rules FOR ALL
  USING (condo_id IN (
    SELECT condo_id FROM profiles
    WHERE id = auth.uid() AND role IN ('sindico', 'administradora')
  ));
