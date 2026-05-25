
-- 1) Invitations: remove public SELECT, expose token lookup via SECURITY DEFINER fn
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  condo_id uuid,
  email text,
  full_name text,
  unit_label text,
  role public.app_role,
  expires_at timestamptz,
  accepted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, condo_id, email, full_name, unit_label, role, expires_at, accepted_at
  FROM public.invitations
  WHERE token = p_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.invitations;
  v_uid uuid := auth.uid();
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_inv FROM public.invitations WHERE token = p_token;
  IF v_inv.id IS NULL THEN RAISE EXCEPTION 'invalid_token'; END IF;
  IF v_inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'already_used'; END IF;
  IF v_inv.expires_at < now() THEN RAISE EXCEPTION 'expired'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF lower(coalesce(v_email, '')) <> lower(v_inv.email) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  UPDATE public.profiles
    SET condo_id = v_inv.condo_id,
        unit_label = COALESCE(unit_label, v_inv.unit_label)
    WHERE id = v_uid;

  INSERT INTO public.user_roles (user_id, condo_id, role)
    VALUES (v_uid, v_inv.condo_id, v_inv.role)
    ON CONFLICT DO NOTHING;

  UPDATE public.invitations SET accepted_at = now() WHERE id = v_inv.id;

  RETURN v_inv.condo_id;
END;
$$;

-- 2) user_roles self-insert: restrict to bootstrap (creator of the condo becoming sindico)
DROP POLICY IF EXISTS "Admins can assign roles in their condo" ON public.user_roles;

CREATE POLICY "Admins can assign roles in their condo"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_condo_admin(auth.uid(), condo_id)
  OR (
    user_id = auth.uid()
    AND role = 'sindico'::public.app_role
    AND EXISTS (
      SELECT 1 FROM public.condominiums c
      WHERE c.id = user_roles.condo_id AND c.created_by = auth.uid()
    )
  )
);

-- 3) Lock down SECURITY DEFINER functions: revoke from anon/authenticated.
-- Trigger functions never need direct client EXECUTE; RLS helpers are evaluated by the planner with definer rights and don't need EXECUTE either.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_reservation_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_condo_subscription() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_condo_member(uuid, uuid)  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_condo_admin(uuid, uuid)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_condo_id(uuid)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid)      FROM PUBLIC, anon, authenticated;

-- Keep these callable from the client
GRANT EXECUTE ON FUNCTION public.claim_first_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text)       TO authenticated;
