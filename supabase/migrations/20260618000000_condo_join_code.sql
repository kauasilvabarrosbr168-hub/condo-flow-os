-- Add join_code to condominiums: random 8-char uppercase alphanumeric code
ALTER TABLE public.condominiums
  ADD COLUMN IF NOT EXISTS join_code text;

-- Generate codes for existing condominiums
UPDATE public.condominiums
  SET join_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  WHERE join_code IS NULL;

ALTER TABLE public.condominiums
  ALTER COLUMN join_code SET NOT NULL,
  ALTER COLUMN join_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

ALTER TABLE public.condominiums
  DROP CONSTRAINT IF EXISTS condominiums_join_code_unique;
ALTER TABLE public.condominiums
  ADD CONSTRAINT condominiums_join_code_unique UNIQUE (join_code);

-- Function to regenerate a condo's join code (síndico or platform admin only)
CREATE OR REPLACE FUNCTION public.regenerate_condo_join_code(p_condo_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_new_code text;
  v_user_id  uuid := auth.uid();
BEGIN
  -- permission check: platform admin or condo sindico/administradora
  IF NOT (
    app_private.is_platform_admin(v_user_id)
    OR app_private.is_condo_admin(v_user_id, p_condo_id)
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  UPDATE public.condominiums
    SET join_code = v_new_code
    WHERE id = p_condo_id;

  RETURN v_new_code;
END;
$$;
