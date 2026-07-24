ALTER TABLE tasks ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'normal'
  CHECK (urgency IN ('baixa','normal','urgente'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notify_immediately boolean NOT NULL DEFAULT false;

-- Índice para listar tarefas por colaborador ordenadas por urgência
CREATE INDEX IF NOT EXISTS tasks_urgency_idx ON tasks (condo_id, urgency DESC, due_at ASC);
