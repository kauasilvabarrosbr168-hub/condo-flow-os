-- =========================================================
-- Platform Admins (Super Admin do SaaS)
-- =========================================================
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = _user_id)
$$;

CREATE POLICY "Platform admins can view themselves"
ON public.platform_admins FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage other admins"
ON public.platform_admins FOR ALL TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- Allow platform admins to read ALL condos, profiles, user_roles, reservations, tasks, activity
CREATE POLICY "Platform admins view all condos"
ON public.condominiums FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins update any condo"
ON public.condominiums FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view all reservations"
ON public.reservations FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view all tasks"
ON public.tasks FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view all activity"
ON public.activity_events FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view all areas"
ON public.common_areas FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view all invitations"
ON public.invitations FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- =========================================================
-- Plans
-- =========================================================
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_cents INT NOT NULL DEFAULT 0,
  unit_limit INT,
  user_limit INT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active plans"
ON public.plans FOR SELECT TO authenticated
USING (is_active OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage plans"
ON public.plans FOR ALL TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.plans (code, name, description, monthly_price_cents, unit_limit, user_limit, features) VALUES
('starter', 'Starter', 'Para condomínios pequenos começarem', 14900, 30, 80, '["Reservas", "Checklists", "Comunicação básica"]'),
('pro', 'Pro', 'Operação completa com automações', 39900, 120, 400, '["Reservas", "Checklists", "Tarefas", "Analytics", "Comunicação avançada"]'),
('enterprise', 'Enterprise', 'Para administradoras e portfólios', 99900, NULL, NULL, '["Tudo do Pro", "Multi-condomínio", "SSO", "Suporte prioritário"]');

-- =========================================================
-- Subscriptions
-- =========================================================
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'suspended', 'cancelled');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  discount_pct INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own condo subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_condo_member(auth.uid(), condo_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage subscriptions"
ON public.subscriptions FOR ALL TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER subs_updated_at BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create trial subscription on new condo
CREATE OR REPLACE FUNCTION public.handle_new_condo_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE starter_id UUID;
BEGIN
  SELECT id INTO starter_id FROM public.plans WHERE code = 'starter' LIMIT 1;
  IF starter_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (condo_id, plan_id, status, trial_ends_at)
    VALUES (NEW.id, starter_id, 'trialing', now() + interval '14 days')
    ON CONFLICT (condo_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER condo_after_insert_subscription
AFTER INSERT ON public.condominiums
FOR EACH ROW EXECUTE FUNCTION public.handle_new_condo_subscription();

-- =========================================================
-- Support tickets
-- =========================================================
CREATE TYPE public.ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL,
  opened_by UUID NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'normal',
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own condo tickets"
ON public.support_tickets FOR SELECT TO authenticated
USING (public.is_condo_member(auth.uid(), condo_id) OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Admins of condo create tickets"
ON public.support_tickets FOR INSERT TO authenticated
WITH CHECK (opened_by = auth.uid() AND public.is_condo_admin(auth.uid(), condo_id));

CREATE POLICY "Platform admins manage tickets"
ON public.support_tickets FOR ALL TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- Impersonation sessions
-- =========================================================
CREATE TABLE public.support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  condo_id UUID,
  reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage support sessions"
ON public.support_sessions FOR ALL TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

-- =========================================================
-- Platform audit logs
-- =========================================================
CREATE TABLE public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_kind TEXT,
  target_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins read audit"
ON public.platform_audit_logs FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins write audit"
ON public.platform_audit_logs FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin(auth.uid()) AND admin_user_id = auth.uid());

-- Backfill subscriptions for any existing condos
INSERT INTO public.subscriptions (condo_id, plan_id, status, trial_ends_at)
SELECT c.id, (SELECT id FROM public.plans WHERE code = 'starter'), 'trialing', now() + interval '14 days'
FROM public.condominiums c
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.condo_id = c.id);