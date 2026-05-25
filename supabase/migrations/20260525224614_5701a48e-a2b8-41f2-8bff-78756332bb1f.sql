REVOKE ALL ON FUNCTION public.accept_invitation(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC, anon, authenticated;