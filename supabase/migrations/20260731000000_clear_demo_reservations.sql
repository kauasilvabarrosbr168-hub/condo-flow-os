-- Remove demo/seed reservation entries that were created during development.
-- Tasks linked to these reservations cascade-delete via the FK ON DELETE CASCADE.
DELETE FROM public.reservations;
