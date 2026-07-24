-- Rastreia se a limpeza escolhida na reserva é externa (prestador) ou interna (colaborador)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS cleaning_type text NOT NULL DEFAULT 'none'
  CHECK (cleaning_type IN ('none', 'external', 'internal'));
