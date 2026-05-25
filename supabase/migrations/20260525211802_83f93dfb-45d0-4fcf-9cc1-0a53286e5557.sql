
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('sindico', 'administradora', 'morador', 'funcionario');
CREATE TYPE public.reservation_status AS ENUM ('pendente', 'confirmada', 'em_execucao', 'concluida', 'cancelada');
CREATE TYPE public.task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');
CREATE TYPE public.task_kind AS ENUM ('pre_checklist', 'pos_checklist', 'manutencao', 'incidente');

-- ============ CONDOMINIUMS ============
CREATE TABLE public.condominiums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condo_id UUID REFERENCES public.condominiums(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  unit_label TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, condo_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _condo_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND condo_id = _condo_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_condo_admin(_user_id UUID, _condo_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND condo_id = _condo_id
      AND role IN ('sindico', 'administradora')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_condo_member(_user_id UUID, _condo_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND condo_id = _condo_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_condo_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT condo_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- ============ INVITATIONS ============
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  unit_label TEXT,
  role public.app_role NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID NOT NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ============ COMMON AREAS ============
CREATE TABLE public.common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  requires_checklist BOOLEAN NOT NULL DEFAULT true,
  min_advance_hours INTEGER NOT NULL DEFAULT 24,
  icon TEXT DEFAULT 'building',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;

-- ============ RESERVATIONS ============
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.common_areas(id) ON DELETE CASCADE,
  resident_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  guests INTEGER DEFAULT 0,
  notes TEXT,
  status public.reservation_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reservations_condo_starts ON public.reservations (condo_id, starts_at);

-- ============ TASKS ============
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  kind public.task_kind NOT NULL DEFAULT 'pre_checklist',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.task_status NOT NULL DEFAULT 'pendente',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============ ACTIVITY EVENTS (timeline) ============
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_condo_created ON public.activity_events (condo_id, created_at DESC);

-- ============ TIMESTAMP TRIGGERS ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_condos_updated BEFORE UPDATE ON public.condominiums
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_areas_updated BEFORE UPDATE ON public.common_areas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ AUTO PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RESERVATION → ACTIVITY + TASKS ============
CREATE OR REPLACE FUNCTION public.handle_reservation_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  area_name TEXT;
  requires_chk BOOLEAN;
BEGIN
  SELECT name, requires_checklist INTO area_name, requires_chk
    FROM public.common_areas WHERE id = NEW.area_id;

  INSERT INTO public.activity_events (condo_id, actor_id, kind, title, meta)
  VALUES (
    NEW.condo_id, NEW.resident_id, 'reservation.created',
    'Nova reserva: ' || area_name,
    jsonb_build_object('reservation_id', NEW.id, 'area', area_name, 'starts_at', NEW.starts_at)
  );

  IF requires_chk THEN
    INSERT INTO public.tasks (condo_id, reservation_id, title, kind, due_at, description)
    VALUES
      (NEW.condo_id, NEW.id, 'Checklist pré-uso · ' || area_name, 'pre_checklist',
       NEW.starts_at - INTERVAL '2 hours',
       'Conferir limpeza, equipamentos e liberação da área antes do uso.'),
      (NEW.condo_id, NEW.id, 'Checklist pós-uso · ' || area_name, 'pos_checklist',
       NEW.ends_at + INTERVAL '1 hour',
       'Verificar estado da área, registrar ocorrências e liberar próxima reserva.');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reservation_created
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_reservation_created();

-- ============ RLS POLICIES ============
-- condominiums
CREATE POLICY "Members can view their condo" ON public.condominiums
  FOR SELECT TO authenticated
  USING (public.is_condo_member(auth.uid(), id) OR created_by = auth.uid());
CREATE POLICY "Anyone authenticated can create a condo" ON public.condominiums
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins can update their condo" ON public.condominiums
  FOR UPDATE TO authenticated USING (public.is_condo_admin(auth.uid(), id));

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Members can view profiles in same condo" ON public.profiles
  FOR SELECT TO authenticated
  USING (condo_id IS NOT NULL AND public.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view roles in their condo" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Admins can assign roles in their condo" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_condo_admin(auth.uid(), condo_id) OR user_id = auth.uid());
CREATE POLICY "Admins can remove roles in their condo" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_condo_admin(auth.uid(), condo_id));

-- invitations
CREATE POLICY "Admins manage invitations" ON public.invitations
  FOR ALL TO authenticated
  USING (public.is_condo_admin(auth.uid(), condo_id))
  WITH CHECK (public.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Anyone can read invitation by token" ON public.invitations
  FOR SELECT TO anon, authenticated USING (true);

-- common_areas
CREATE POLICY "Members can view areas" ON public.common_areas
  FOR SELECT TO authenticated USING (public.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Admins manage areas" ON public.common_areas
  FOR ALL TO authenticated
  USING (public.is_condo_admin(auth.uid(), condo_id))
  WITH CHECK (public.is_condo_admin(auth.uid(), condo_id));

-- reservations
CREATE POLICY "Members view reservations in their condo" ON public.reservations
  FOR SELECT TO authenticated USING (public.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Residents create their own reservations" ON public.reservations
  FOR INSERT TO authenticated
  WITH CHECK (resident_id = auth.uid() AND public.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Residents update own pending reservations" ON public.reservations
  FOR UPDATE TO authenticated
  USING (resident_id = auth.uid() OR public.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Residents delete own reservations" ON public.reservations
  FOR DELETE TO authenticated
  USING (resident_id = auth.uid() OR public.is_condo_admin(auth.uid(), condo_id));

-- tasks
CREATE POLICY "Members view tasks in their condo" ON public.tasks
  FOR SELECT TO authenticated USING (public.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Admins manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING (public.is_condo_admin(auth.uid(), condo_id))
  WITH CHECK (public.is_condo_admin(auth.uid(), condo_id));
CREATE POLICY "Assignees update their own tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (assignee_id = auth.uid());

-- activity_events
CREATE POLICY "Members view condo activity" ON public.activity_events
  FOR SELECT TO authenticated USING (public.is_condo_member(auth.uid(), condo_id));
CREATE POLICY "Members can insert activity in their condo" ON public.activity_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_condo_member(auth.uid(), condo_id));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
