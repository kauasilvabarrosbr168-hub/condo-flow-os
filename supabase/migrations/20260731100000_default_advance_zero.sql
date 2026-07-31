-- Muda o default de min_advance_hours para 0 (sem exigência de antecedência).
-- Atualiza todas as áreas existentes para 0 também.
ALTER TABLE public.common_areas
  ALTER COLUMN min_advance_hours SET DEFAULT 0;

UPDATE public.common_areas
  SET min_advance_hours = 0
  WHERE min_advance_hours > 0;
