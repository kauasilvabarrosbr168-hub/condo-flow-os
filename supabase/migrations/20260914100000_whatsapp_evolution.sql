-- Adiciona suporte à Evolution API no condo_ai_settings
ALTER TABLE public.condo_ai_settings
  ADD COLUMN IF NOT EXISTS evolution_api_url   TEXT,        -- https://xxx.railway.app
  ADD COLUMN IF NOT EXISTS evolution_api_key   TEXT,        -- chave da Evolution API
  ADD COLUMN IF NOT EXISTS evolution_instance  TEXT,        -- nome da instância (ex: condoflow)
  ADD COLUMN IF NOT EXISTS evolution_phone     TEXT,        -- número do síndico (55119...)
  ADD COLUMN IF NOT EXISTS wa_notify_warning   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wa_notify_critical  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS wa_notify_info      BOOLEAN NOT NULL DEFAULT false;
