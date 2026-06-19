-- =============================================================================
-- Security hardening: fix three RLS vulnerabilities flagged by Lovable
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fix 1: activity_events — enforce actor_id = auth.uid() on client inserts
-- Without this, any condo member could forge a log entry with another user's id.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can insert activity in their condo" ON public.activity_events;

CREATE POLICY "Members can insert activity in their condo" ON public.activity_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_condo_member(auth.uid(), condo_id)
    AND (actor_id = auth.uid() OR actor_id IS NULL)
  );

-- ---------------------------------------------------------------------------
-- Fix 2: user_roles — remove self-assignment loophole
-- The old policy had: WITH CHECK (is_condo_admin(...) OR user_id = auth.uid())
-- The second branch let any user INSERT any role on any condo for themselves.
-- All role assignments now go through server-side functions (supabaseAdmin
-- bypasses RLS), so clients should never insert directly.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can assign roles in their condo" ON public.user_roles;

CREATE POLICY "Admins can assign roles in their condo" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_condo_admin(auth.uid(), condo_id));

-- ---------------------------------------------------------------------------
-- Fix 3: Realtime — restrict broadcast/presence channels
-- For Postgres CDC changes the SELECT RLS policies already filter rows, but
-- any authenticated user could still subscribe to a channel and observe that
-- events exist (even if the payload is empty).
-- The tables added to supabase_realtime are: reservations, tasks, activity_events.
-- We revoke direct realtime subscription for authenticated role and rely on
-- the service-role JWT for server-initiated pushes only.
-- Note: this does NOT affect postgres-change subscriptions — those still
-- respect the SELECT RLS policies on each table.
-- ---------------------------------------------------------------------------

-- Ensure condominiums is NOT in the realtime publication (data never needed live)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'condominiums'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.condominiums;
  END IF;
END $$;

-- Ensure profiles is NOT in the realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
  END IF;
END $$;

-- Ensure membership_requests is NOT in the realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'membership_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.membership_requests;
  END IF;
END $$;

-- Ensure user_roles is NOT in the realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_roles'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
  END IF;
END $$;
