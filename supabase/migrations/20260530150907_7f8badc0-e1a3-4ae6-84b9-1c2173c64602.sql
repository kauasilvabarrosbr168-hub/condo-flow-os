-- Extend condominiums with branding/info fields
ALTER TABLE public.condominiums
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS towers_count integer,
  ADD COLUMN IF NOT EXISTS blocks_count integer,
  ADD COLUMN IF NOT EXISTS rules text,
  ADD COLUMN IF NOT EXISTS contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS general_info text;

-- Storage bucket for condo branding (logo, cover)
INSERT INTO storage.buckets (id, name, public)
VALUES ('condo-branding', 'condo-branding', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "condo-branding public read" ON storage.objects;
CREATE POLICY "condo-branding public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'condo-branding');

-- Admins (super admin or condo admin) can upload/update/delete; path is "{condoId}/..."
DROP POLICY IF EXISTS "condo-branding admin write" ON storage.objects;
CREATE POLICY "condo-branding admin write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'condo-branding' AND (
      app_private.is_platform_admin(auth.uid())
      OR app_private.is_condo_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

DROP POLICY IF EXISTS "condo-branding admin update" ON storage.objects;
CREATE POLICY "condo-branding admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'condo-branding' AND (
      app_private.is_platform_admin(auth.uid())
      OR app_private.is_condo_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

DROP POLICY IF EXISTS "condo-branding admin delete" ON storage.objects;
CREATE POLICY "condo-branding admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'condo-branding' AND (
      app_private.is_platform_admin(auth.uid())
      OR app_private.is_condo_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );