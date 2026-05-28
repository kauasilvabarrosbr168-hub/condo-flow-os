
-- 1) Expand common_areas
ALTER TABLE public.common_areas
  ADD COLUMN IF NOT EXISTS rules TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery TEXT[] NOT NULL DEFAULT '{}';

-- 2) Storage bucket for area images
INSERT INTO storage.buckets (id, name, public)
VALUES ('condo-areas', 'condo-areas', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "condo-areas public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'condo-areas');

CREATE POLICY "condo-areas admin upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'condo-areas' AND (
      app_private.is_platform_admin(auth.uid())
      OR app_private.is_condo_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "condo-areas admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'condo-areas' AND (
      app_private.is_platform_admin(auth.uid())
      OR app_private.is_condo_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

CREATE POLICY "condo-areas admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'condo-areas' AND (
      app_private.is_platform_admin(auth.uid())
      OR app_private.is_condo_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

-- 3) service_logs
CREATE TABLE public.service_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condo_id UUID NOT NULL,
  task_id UUID,
  worker_id UUID NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  done_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_service_logs_condo ON public.service_logs(condo_id, done_at DESC);
CREATE INDEX idx_service_logs_worker ON public.service_logs(worker_id, done_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_logs TO authenticated;
GRANT ALL ON public.service_logs TO service_role;

ALTER TABLE public.service_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_logs worker insert"
  ON public.service_logs FOR INSERT TO authenticated
  WITH CHECK (worker_id = auth.uid() AND app_private.is_condo_member(auth.uid(), condo_id));

CREATE POLICY "service_logs worker view own"
  ON public.service_logs FOR SELECT TO authenticated
  USING (worker_id = auth.uid());

CREATE POLICY "service_logs admin view all"
  ON public.service_logs FOR SELECT TO authenticated
  USING (
    app_private.is_condo_admin(auth.uid(), condo_id)
    OR app_private.is_platform_admin(auth.uid())
  );

CREATE POLICY "service_logs admin manage"
  ON public.service_logs FOR DELETE TO authenticated
  USING (
    app_private.is_condo_admin(auth.uid(), condo_id)
    OR app_private.is_platform_admin(auth.uid())
  );

-- 4) membership_requests
CREATE TYPE membership_status AS ENUM ('pending', 'sindico_approved', 'approved', 'rejected');

CREATE TABLE public.membership_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  condo_id UUID,
  proposed_condo_name TEXT,
  proposed_condo_address TEXT,
  requested_role app_role NOT NULL,
  status membership_status NOT NULL DEFAULT 'pending',
  note TEXT,
  unit_label TEXT,
  decided_by_sindico UUID,
  decided_by_admin UUID,
  decided_sindico_at TIMESTAMPTZ,
  decided_admin_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_membership_requests_user ON public.membership_requests(user_id);
CREATE INDEX idx_membership_requests_condo_status ON public.membership_requests(condo_id, status);

GRANT SELECT, INSERT, UPDATE ON public.membership_requests TO authenticated;
GRANT ALL ON public.membership_requests TO service_role;

ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mreq user own select"
  ON public.membership_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "mreq user own insert"
  ON public.membership_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "mreq sindico view condo"
  ON public.membership_requests FOR SELECT TO authenticated
  USING (condo_id IS NOT NULL AND app_private.is_condo_admin(auth.uid(), condo_id));

CREATE POLICY "mreq admin all"
  ON public.membership_requests FOR ALL TO authenticated
  USING (app_private.is_platform_admin(auth.uid()))
  WITH CHECK (app_private.is_platform_admin(auth.uid()));

CREATE TRIGGER tg_mreq_updated_at
  BEFORE UPDATE ON public.membership_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5) Decision RPC (two-level approval)
CREATE OR REPLACE FUNCTION public.decide_membership_request(p_request_id UUID, p_decision TEXT, p_reason TEXT DEFAULT NULL)
RETURNS public.membership_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_req public.membership_requests;
  v_is_admin BOOLEAN;
  v_is_sindico BOOLEAN;
  v_new_condo_id UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_decision NOT IN ('approve', 'reject') THEN RAISE EXCEPTION 'invalid_decision'; END IF;

  SELECT * INTO v_req FROM public.membership_requests WHERE id = p_request_id FOR UPDATE;
  IF v_req.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_req.status IN ('approved', 'rejected') THEN RAISE EXCEPTION 'already_decided'; END IF;

  v_is_admin := app_private.is_platform_admin(v_uid);
  v_is_sindico := (v_req.condo_id IS NOT NULL AND app_private.is_condo_admin(v_uid, v_req.condo_id));

  IF p_decision = 'reject' THEN
    IF NOT (v_is_admin OR v_is_sindico) THEN RAISE EXCEPTION 'forbidden'; END IF;
    UPDATE public.membership_requests
      SET status = 'rejected', rejection_reason = p_reason,
          decided_by_admin = CASE WHEN v_is_admin THEN v_uid ELSE decided_by_admin END,
          decided_admin_at = CASE WHEN v_is_admin THEN now() ELSE decided_admin_at END,
          decided_by_sindico = CASE WHEN v_is_sindico AND NOT v_is_admin THEN v_uid ELSE decided_by_sindico END,
          decided_sindico_at = CASE WHEN v_is_sindico AND NOT v_is_admin THEN now() ELSE decided_sindico_at END
      WHERE id = p_request_id
      RETURNING * INTO v_req;
    RETURN v_req;
  END IF;

  -- APPROVE flow
  IF v_req.requested_role = 'funcionario' THEN
    -- Need sindico THEN admin
    IF v_req.status = 'pending' THEN
      IF NOT v_is_sindico THEN RAISE EXCEPTION 'sindico_required'; END IF;
      UPDATE public.membership_requests
        SET status = 'sindico_approved', decided_by_sindico = v_uid, decided_sindico_at = now()
        WHERE id = p_request_id RETURNING * INTO v_req;
      RETURN v_req;
    ELSIF v_req.status = 'sindico_approved' THEN
      IF NOT v_is_admin THEN RAISE EXCEPTION 'admin_required'; END IF;
    END IF;
  ELSIF v_req.requested_role = 'sindico' THEN
    -- Only super admin
    IF NOT v_is_admin THEN RAISE EXCEPTION 'admin_required'; END IF;
    -- Create condo if proposed
    IF v_req.condo_id IS NULL AND v_req.proposed_condo_name IS NOT NULL THEN
      INSERT INTO public.condominiums(name, address, created_by)
      VALUES (v_req.proposed_condo_name, v_req.proposed_condo_address, v_req.user_id)
      RETURNING id INTO v_new_condo_id;
      UPDATE public.membership_requests SET condo_id = v_new_condo_id WHERE id = p_request_id;
      v_req.condo_id := v_new_condo_id;
    END IF;
  ELSIF v_req.requested_role = 'morador' THEN
    IF NOT (v_is_sindico OR v_is_admin) THEN RAISE EXCEPTION 'forbidden'; END IF;
  END IF;

  -- Final approve
  UPDATE public.profiles
    SET condo_id = v_req.condo_id,
        unit_label = COALESCE(unit_label, v_req.unit_label)
    WHERE id = v_req.user_id;

  INSERT INTO public.user_roles(user_id, condo_id, role)
    VALUES (v_req.user_id, v_req.condo_id, v_req.requested_role)
    ON CONFLICT DO NOTHING;

  UPDATE public.membership_requests
    SET status = 'approved',
        decided_by_admin = CASE WHEN v_is_admin THEN v_uid ELSE decided_by_admin END,
        decided_admin_at = CASE WHEN v_is_admin THEN now() ELSE decided_admin_at END
    WHERE id = p_request_id
    RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decide_membership_request(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.decide_membership_request(UUID, TEXT, TEXT) TO authenticated;

-- 6) Public list condos for signup (only id + name)
CREATE OR REPLACE FUNCTION public.list_condos_for_signup()
RETURNS TABLE(id UUID, name TEXT, address TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, address FROM public.condominiums ORDER BY name ASC LIMIT 500;
$$;
REVOKE EXECUTE ON FUNCTION public.list_condos_for_signup() FROM anon;
GRANT EXECUTE ON FUNCTION public.list_condos_for_signup() TO authenticated;
