-- Adiciona flag para síndico ativar/desativar a opção de limpeza nas reservas.
ALTER TABLE public.condominiums
  ADD COLUMN IF NOT EXISTS cleaning_enabled BOOLEAN NOT NULL DEFAULT true;
