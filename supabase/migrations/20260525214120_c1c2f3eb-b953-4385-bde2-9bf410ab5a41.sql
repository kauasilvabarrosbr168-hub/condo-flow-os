CREATE OR REPLACE FUNCTION public.claim_first_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  uemail TEXT;
  uname TEXT;
BEGIN
  IF uid IS NULL THEN RETURN FALSE; END IF;
  IF EXISTS (SELECT 1 FROM public.platform_admins) THEN RETURN FALSE; END IF;
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', email)
    INTO uemail, uname FROM auth.users WHERE id = uid;
  INSERT INTO public.platform_admins (user_id, email, full_name)
    VALUES (uid, uemail, uname);
  RETURN TRUE;
END $$;

REVOKE EXECUTE ON FUNCTION public.claim_first_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_platform_admin() TO authenticated;