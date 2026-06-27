
-- RPC to assign a user to a condo with a role.
-- SECURITY DEFINER so it can update other users' profiles and insert roles.
-- Only callable by platform admins or sindico/administradora of the target condo.
CREATE OR REPLACE FUNCTION public.assign_member_to_condo(
  p_user_id UUID,
  p_condo_id UUID,
  p_role TEXT,
  p_unit_label TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_is_platform_admin BOOLEAN;
  v_is_condo_admin BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  v_is_platform_admin := EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = v_caller);
  v_is_condo_admin := EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_caller AND condo_id = p_condo_id AND role IN ('sindico','administradora')
  );

  IF NOT (v_is_platform_admin OR v_is_condo_admin) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Update the member's profile
  UPDATE public.profiles
    SET condo_id = p_condo_id,
        unit_label = COALESCE(p_unit_label, unit_label)
    WHERE id = p_user_id;

  -- Insert role (ignore if already exists)
  INSERT INTO public.user_roles (user_id, condo_id, role)
    VALUES (p_user_id, p_condo_id, p_role::app_role)
    ON CONFLICT DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_member_to_condo(UUID, UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_member_to_condo(UUID, UUID, TEXT, TEXT) TO authenticated;
