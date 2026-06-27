-- Add admin@condoflow.com to platform_admins so all RLS policies,
-- RPCs, and server functions treat this user as a super admin.
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email = 'admin@condoflow.com'
ON CONFLICT DO NOTHING;
