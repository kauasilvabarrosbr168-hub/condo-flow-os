
-- 1) Restrict membership_requests insert
DROP POLICY IF EXISTS "mreq user own insert" ON public.membership_requests;

CREATE POLICY "mreq user own insert"
ON public.membership_requests
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND requested_role IN ('morador','funcionario','sindico')
  AND (
    -- regular members must target an existing condo
    (requested_role IN ('morador','funcionario')
      AND condo_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = condo_id))
    OR
    -- síndico requests: either target an existing condo, or propose a new one
    (requested_role = 'sindico'
      AND (
        (condo_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.condominiums c WHERE c.id = condo_id))
        OR (condo_id IS NULL AND proposed_condo_name IS NOT NULL AND length(btrim(proposed_condo_name)) > 0)
      ))
  )
);

-- 2) Remove broad listing on public storage buckets.
-- Public URLs continue to work via the storage CDN; only API enumeration is removed.
DROP POLICY IF EXISTS "condo-areas public read" ON storage.objects;
DROP POLICY IF EXISTS "condo-branding public read" ON storage.objects;
