-- Adiciona grade de horários disponíveis por área
ALTER TABLE common_areas
  ADD COLUMN IF NOT EXISTS available_slots jsonb DEFAULT NULL;

-- Tabela de avisos do síndico por área
CREATE TABLE IF NOT EXISTS area_notices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id     uuid NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
  condo_id    uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users(id),
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE area_notices ENABLE ROW LEVEL SECURITY;

-- Membros do condomínio podem ler avisos
CREATE POLICY "members_read_area_notices" ON area_notices
  FOR SELECT USING (
    condo_id IN (
      SELECT condo_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Síndico e administradora podem criar avisos
CREATE POLICY "sindico_insert_area_notices" ON area_notices
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    condo_id IN (
      SELECT condo_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('sindico', 'administradora')
    )
  );

-- Síndico pode deletar qualquer aviso do seu condo; autor pode deletar o próprio
CREATE POLICY "sindico_delete_area_notices" ON area_notices
  FOR DELETE USING (
    auth.uid() = author_id OR
    condo_id IN (
      SELECT condo_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('sindico', 'administradora')
    )
  );

-- Habilitar Realtime para avisos
ALTER PUBLICATION supabase_realtime ADD TABLE area_notices;
