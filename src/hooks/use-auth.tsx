import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "sindico" | "administradora" | "morador" | "funcionario";

export type Profile = {
  id: string;
  condo_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  unit_label: string | null;
  avatar_url: string | null;
};

export type Condo = {
  id: string;
  name: string;
  address: string | null;
};

type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  // either create a new condo (become síndico) ...
  condoName?: string;
  condoAddress?: string;
  // ... or accept an invitation
  inviteToken?: string;
};

type AuthCtx = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  condo: Condo | null;
  roles: Role[];
  primaryRole: Role | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (input: SignUpInput) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const ROLE_PRIORITY: Role[] = ["sindico", "administradora", "funcionario", "morador"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [condo, setCondo] = useState<Condo | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContext = async (uid: string) => {
    const [{ data: prof }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role,condo_id").eq("user_id", uid),
    ]);
    setProfile((prof as Profile) ?? null);
    const rls = ((rs ?? []) as { role: Role; condo_id: string }[]).map((r) => r.role);
    setRoles(rls);
    const cid = prof?.condo_id ?? rs?.[0]?.condo_id ?? null;
    if (cid) {
      const { data: c } = await supabase.from("condominiums").select("id,name,address").eq("id", cid).maybeSingle();
      setCondo((c as Condo) ?? null);
    } else {
      setCondo(null);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // Defer to avoid recursive locks
        setTimeout(() => loadContext(s.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
        setCondo(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadContext(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (session?.user) await loadContext(session.user.id);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUp = async (input: SignUpInput): Promise<{ error?: string }> => {
    const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: redirect,
        data: { full_name: input.fullName },
      },
    });
    if (error) return { error: error.message };
    const userId = data.user?.id;
    if (!userId) return { error: "Conta criada — confirme o email para continuar." };

    // Wait briefly for the auth trigger to create the profile row
    await new Promise((r) => setTimeout(r, 350));

    if (input.inviteToken) {
      const { data: inv, error: invErr } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", input.inviteToken)
        .maybeSingle();
      if (invErr || !inv) return { error: "Convite inválido ou expirado." };
      if (inv.accepted_at) return { error: "Este convite já foi usado." };
      if (new Date(inv.expires_at) < new Date()) return { error: "Convite expirado." };

      await supabase
        .from("profiles")
        .update({
          condo_id: inv.condo_id,
          full_name: input.fullName,
          unit_label: inv.unit_label,
        })
        .eq("id", userId);
      await supabase.from("user_roles").insert({
        user_id: userId,
        condo_id: inv.condo_id,
        role: inv.role,
      });
      await supabase.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);
    } else if (input.condoName) {
      const { data: condoRow, error: cErr } = await supabase
        .from("condominiums")
        .insert({
          name: input.condoName,
          address: input.condoAddress ?? null,
          created_by: userId,
        })
        .select()
        .single();
      if (cErr || !condoRow) return { error: cErr?.message ?? "Falha ao criar condomínio." };
      await supabase.from("profiles").update({ condo_id: condoRow.id }).eq("id", userId);
      await supabase.from("user_roles").insert({ user_id: userId, condo_id: condoRow.id, role: "sindico" });
    }

    await loadContext(userId);
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;
  const isAdmin = roles.includes("sindico") || roles.includes("administradora");

  const value: AuthCtx = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    condo,
    roles,
    primaryRole,
    isAdmin,
    refresh,
    signIn,
    signUp,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
