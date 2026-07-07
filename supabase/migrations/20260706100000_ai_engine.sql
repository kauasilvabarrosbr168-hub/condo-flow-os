-- Motor de Inteligência Operacional — tabelas de suporte

CREATE TABLE IF NOT EXISTS ai_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  event_context jsonb DEFAULT '{}',
  triggered_at timestamptz DEFAULT now(),
  rules_handled boolean DEFAULT false,
  rules_actions jsonb DEFAULT '[]',
  ai_called boolean DEFAULT false,
  ai_analysis text,
  ai_actions jsonb DEFAULT '[]',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  summary text NOT NULL DEFAULT '',
  actions_taken jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS condo_ai_settings (
  condo_id uuid PRIMARY KEY REFERENCES condominiums(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true,
  can_create_tasks boolean DEFAULT true,
  can_change_priority boolean DEFAULT true,
  can_create_reminders boolean DEFAULT true,
  can_redistribute_tasks boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_event_log_condo_created_idx ON ai_event_log(condo_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_event_log_severity_idx ON ai_event_log(condo_id, severity);

ALTER TABLE ai_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE condo_ai_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "sindico ve log ia" ON ai_event_log
    FOR SELECT USING (
      condo_id IN (
        SELECT ur.condo_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('sindico', 'administradora')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service insere log ia" ON ai_event_log
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "sindico ve config ia" ON condo_ai_settings
    FOR ALL USING (
      condo_id IN (
        SELECT ur.condo_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('sindico', 'administradora')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
