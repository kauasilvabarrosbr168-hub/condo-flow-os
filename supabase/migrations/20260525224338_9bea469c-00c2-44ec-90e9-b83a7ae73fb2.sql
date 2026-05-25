REVOKE ALL ON FUNCTION app_private.is_platform_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.is_condo_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.is_condo_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.has_role(uuid, uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app_private.user_condo_id(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION app_private.is_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_condo_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_condo_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.user_condo_id(uuid) TO authenticated;