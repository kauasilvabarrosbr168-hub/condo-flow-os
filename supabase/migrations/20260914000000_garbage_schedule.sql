-- Tabela de configuração de coleta de lixo por condomínio
CREATE TABLE IF NOT EXISTS condo_garbage_schedule (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id           uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  days_of_week       int[] NOT NULL DEFAULT '{}',  -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  collection_time    time NOT NULL DEFAULT '07:00', -- horário da coleta (horário de Brasília)
  notify_8h_before   boolean NOT NULL DEFAULT true,
  notify_1h_before   boolean NOT NULL DEFAULT true,
  active             boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(condo_id)
);

-- Registro de notificações já enviadas (evita duplicatas)
CREATE TABLE IF NOT EXISTS condo_garbage_notifications_sent (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id         uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  scheduled_date   date NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('8h', '1h')),
  sent_at          timestamptz NOT NULL DEFAULT now(),
  recipients_count int NOT NULL DEFAULT 0,
  UNIQUE(condo_id, scheduled_date, notification_type)
);

ALTER TABLE condo_garbage_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE condo_garbage_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Qualquer membro do condomínio pode ler o cronograma
CREATE POLICY "membro le coleta de lixo"
  ON condo_garbage_schedule FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND condo_id = condo_garbage_schedule.condo_id
    )
  );

-- Apenas síndico/administradora pode criar/editar
CREATE POLICY "sindico gerencia coleta de lixo"
  ON condo_garbage_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND condo_id = condo_garbage_schedule.condo_id
        AND role IN ('sindico', 'administradora')
    )
  );

-- Síndico pode ver histórico de notificações enviadas
CREATE POLICY "sindico ve notificacoes de lixo"
  ON condo_garbage_notifications_sent FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND condo_id = condo_garbage_notifications_sent.condo_id
        AND role IN ('sindico', 'administradora')
    )
  );
