
-- 1) activity_events: enforce actor_id = auth.uid() on insert
DROP POLICY IF EXISTS "Members can insert activity in their condo" ON public.activity_events;
CREATE POLICY "Members can insert activity in their condo"
  ON public.activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    app_private.is_condo_member(auth.uid(), condo_id)
    AND actor_id = auth.uid()
  );

-- 2) user_roles: remove self-sindico branch; sindico is granted only via
--    decide_membership_request (SECURITY DEFINER, bypasses RLS) or by a platform admin.
DROP POLICY IF EXISTS "Admins can assign roles in their condo" ON public.user_roles;
CREATE POLICY "Admins can assign roles in their condo"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.is_condo_admin(auth.uid(), condo_id));
