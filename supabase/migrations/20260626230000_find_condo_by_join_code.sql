
-- RPC to find a condo by join_code without exposing the full condominiums table.
-- SECURITY DEFINER so authenticated users can look up a condo by code
-- even if they don't have a direct SELECT policy on condominiums yet.
CREATE OR REPLACE FUNCTION public.find_condo_by_join_code(p_code TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.condominiums c
  WHERE c.join_code = upper(trim(p_code))
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_condo_by_join_code(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.find_condo_by_join_code(TEXT) TO authenticated;
