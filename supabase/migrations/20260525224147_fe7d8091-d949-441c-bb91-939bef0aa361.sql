-- Private permission helpers used only by database access rules.
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION app_private.is_condo_member(_user_id uuid, _condo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND condo_id = _condo_id
  )
$$;

CREATE OR REPLACE FUNCTION app_private.is_condo_admin(_user_id uuid, _condo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND condo_id = _condo_id
      AND role IN ('sindico', 'administradora')
  )
$$;

CREATE OR REPLACE FUNCTION app_private.has_role(_user_id uuid, _condo_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND condo_id = _condo_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION app_private.user_condo_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT condo_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

REVOKE ALL ON SCHEMA app_private FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_condo_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_condo_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.user_condo_id(uuid) TO authenticated;

-- activity_events
DROP POLICY IF EXISTS "Members can insert activity in their condo" ON public.activity_events;
DROP POLICY IF EXISTS "Members view condo activity" ON public.activity_events;
DROP POLICY IF EXISTS "Platform admins view all activity" ON public.activity_events;
CREATE POLICY "Members can insert activity in their condo"
ON public.activity_events
FOR INSERT
TO authenticated
WITH CHECK (app_private.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Members view condo activity"
ON public.activity_events
FOR SELECT
TO authenticated
USING (app_private.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Platform admins view all activity"
ON public.activity_events
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));

-- common_areas
DROP POLICY IF EXISTS "Admins manage areas" ON public.common_areas;
DROP POLICY IF EXISTS "Members can view areas" ON public.common_areas;
DROP POLICY IF EXISTS "Platform admins view all areas" ON public.common_areas;
CREATE POLICY "Admins manage areas"
ON public.common_areas
FOR ALL
TO authenticated
USING (app_private.is_condo_admin(auth.uid(), condo_id))
WITH CHECK (app_private.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Members can view areas"
ON public.common_areas
FOR SELECT
TO authenticated
USING (app_private.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Platform admins view all areas"
ON public.common_areas
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));

-- condominiums
DROP POLICY IF EXISTS "Admins can update their condo" ON public.condominiums;
DROP POLICY IF EXISTS "Anyone authenticated can create a condo" ON public.condominiums;
DROP POLICY IF EXISTS "Members can view their condo" ON public.condominiums;
DROP POLICY IF EXISTS "Platform admins update any condo" ON public.condominiums;
DROP POLICY IF EXISTS "Platform admins view all condos" ON public.condominiums;
CREATE POLICY "Admins can update their condo"
ON public.condominiums
FOR UPDATE
TO authenticated
USING (app_private.is_condo_admin(auth.uid(), id));
CREATE POLICY "Anyone authenticated can create a condo"
ON public.condominiums
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());
CREATE POLICY "Platform admins create condos"
ON public.condominiums
FOR INSERT
TO authenticated
WITH CHECK (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Members can view their condo"
ON public.condominiums
FOR SELECT
TO authenticated
USING (app_private.is_condo_member(auth.uid(), id) OR created_by = auth.uid());
CREATE POLICY "Platform admins update any condo"
ON public.condominiums
FOR UPDATE
TO authenticated
USING (app_private.is_platform_admin(auth.uid()))
WITH CHECK (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins view all condos"
ON public.condominiums
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));

-- invitations
DROP POLICY IF EXISTS "Admins manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Platform admins view all invitations" ON public.invitations;
CREATE POLICY "Admins manage invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (app_private.is_condo_admin(auth.uid(), condo_id))
WITH CHECK (app_private.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Platform admins manage all invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (app_private.is_platform_admin(auth.uid()))
WITH CHECK (app_private.is_platform_admin(auth.uid()));

-- plans
DROP POLICY IF EXISTS "Authenticated read active plans" ON public.plans;
DROP POLICY IF EXISTS "Platform admins manage plans" ON public.plans;
CREATE POLICY "Authenticated read active plans"
ON public.plans
FOR SELECT
TO authenticated
USING (is_active OR app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins manage plans"
ON public.plans
FOR ALL
TO authenticated
USING (app_private.is_platform_admin(auth.uid()))
WITH CHECK (app_private.is_platform_admin(auth.uid()));

-- platform_admins
DROP POLICY IF EXISTS "Platform admins can view themselves" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins manage other admins" ON public.platform_admins;
CREATE POLICY "Platform admins can view themselves"
ON public.platform_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins manage other admins"
ON public.platform_admins
FOR ALL
TO authenticated
USING (app_private.is_platform_admin(auth.uid()))
WITH CHECK (app_private.is_platform_admin(auth.uid()));

-- platform_audit_logs
DROP POLICY IF EXISTS "Platform admins read audit" ON public.platform_audit_logs;
DROP POLICY IF EXISTS "Platform admins write audit" ON public.platform_audit_logs;
CREATE POLICY "Platform admins read audit"
ON public.platform_audit_logs
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins write audit"
ON public.platform_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (app_private.is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

-- profiles
DROP POLICY IF EXISTS "Members can view profiles in same condo" ON public.profiles;
DROP POLICY IF EXISTS "Platform admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Members can view profiles in same condo"
ON public.profiles
FOR SELECT
TO authenticated
USING (condo_id IS NOT NULL AND app_private.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Platform admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- reservations
DROP POLICY IF EXISTS "Members view reservations in their condo" ON public.reservations;
DROP POLICY IF EXISTS "Platform admins view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Residents create their own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Residents delete own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Residents update own pending reservations" ON public.reservations;
CREATE POLICY "Members view reservations in their condo"
ON public.reservations
FOR SELECT
TO authenticated
USING (app_private.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Platform admins view all reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Residents create their own reservations"
ON public.reservations
FOR INSERT
TO authenticated
WITH CHECK (resident_id = auth.uid() AND app_private.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Residents delete own reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (resident_id = auth.uid() OR app_private.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Residents update own pending reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (resident_id = auth.uid() OR app_private.is_condo_admin(auth.uid(), condo_id));

-- subscriptions
DROP POLICY IF EXISTS "Members view own condo subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Platform admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Members view own condo subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (app_private.is_condo_member(auth.uid(), condo_id) OR app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins manage subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (app_private.is_platform_admin(auth.uid()))
WITH CHECK (app_private.is_platform_admin(auth.uid()));

-- support_sessions
DROP POLICY IF EXISTS "Platform admins manage support sessions" ON public.support_sessions;
CREATE POLICY "Platform admins manage support sessions"
ON public.support_sessions
FOR ALL
TO authenticated
USING (app_private.is_platform_admin(auth.uid()))
WITH CHECK (app_private.is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

-- support_tickets
DROP POLICY IF EXISTS "Admins of condo create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Members view own condo tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Platform admins manage tickets" ON public.support_tickets;
CREATE POLICY "Admins of condo create tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (opened_by = auth.uid() AND app_private.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Members view own condo tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (app_private.is_condo_member(auth.uid(), condo_id) OR app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins manage tickets"
ON public.support_tickets
FOR ALL
TO authenticated
USING (app_private.is_platform_admin(auth.uid()))
WITH CHECK (app_private.is_platform_admin(auth.uid()));

-- tasks
DROP POLICY IF EXISTS "Admins manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Assignees update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Members view tasks in their condo" ON public.tasks;
DROP POLICY IF EXISTS "Platform admins view all tasks" ON public.tasks;
CREATE POLICY "Admins manage tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (app_private.is_condo_admin(auth.uid(), condo_id))
WITH CHECK (app_private.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Assignees update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (assignee_id = auth.uid());
CREATE POLICY "Members view tasks in their condo"
ON public.tasks
FOR SELECT
TO authenticated
USING (app_private.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Platform admins view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Admins can assign roles in their condo" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can remove roles in their condo" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view roles in their condo" ON public.user_roles;
DROP POLICY IF EXISTS "Platform admins view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Admins can assign roles in their condo"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  app_private.is_condo_admin(auth.uid(), condo_id)
  OR (
    user_id = auth.uid()
    AND role = 'sindico'::public.app_role
    AND EXISTS (
      SELECT 1
      FROM public.condominiums c
      WHERE c.id = user_roles.condo_id
        AND c.created_by = auth.uid()
    )
  )
);
CREATE POLICY "Platform admins assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Admins can remove roles in their condo"
ON public.user_roles
FOR DELETE
TO authenticated
USING (app_private.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Platform admins remove roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Admins can view roles in their condo"
ON public.user_roles
FOR SELECT
TO authenticated
USING (app_private.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Platform admins view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (app_private.is_platform_admin(auth.uid()));
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());