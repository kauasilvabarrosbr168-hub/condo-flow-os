import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { acceptInvitation } from "@/lib/invitations.functions";

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
  inviteToken?: string;
  phoneNumber?: string;
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
  const acceptInvitationFn = useServerFn(acceptInvitation);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [condo, setCondo] = useState<Condo | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContext = async (uid: string) => {
    const [{ data: prof }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id,condo_id,full_name,email,phone,unit_label,avatar_url").eq("id", uid).maybeSingle(),
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
    let initialized = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => {
          loadContext(s.user.id).finally(() => {
            if (!initialized) {
              initialized = true;
              setLoading(false);
            }
          });
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setCondo(null);
        if (!initialized) {
          initialized = true;
          setLoading(false);
        }
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadContext(data.session.user.id).finally(() => {
          if (!initialized) {
            initialized = true;
            setLoading(false);
          }
        });
      } else if (!initialized) {
        initialized = true;
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
    if (!userId) return { error: "Erro ao criar conta. Tente novamente." };

    // Wait briefly for the auth trigger to create the profile row
    // Wait for auth trigger to create profile row — retry up to 2s
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 250));
      const { data: p } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
      if (p) break;
    }

    if (input.inviteToken) {
      try {
        await acceptInvitationFn({ data: { token: input.inviteToken } });
      } catch (accErr) {
        const message = accErr instanceof Error ? accErr.message : String(accErr);
        const map: Record<string, string> = {
          invalid_token: "Convite inválido.",
          already_used: "Este convite já foi usado.",
          expired: "Convite expirado.",
          email_mismatch: "O e-mail informado não bate com o do convite.",
          not_authenticated: "Sessão não inicializada — tente novamente.",
        };
        return { error: map[message] ?? message };
      }
    }

    if (input.phoneNumber?.trim()) {
      await supabase.from("profiles").update({ phone: input.phoneNumber.trim() }).eq("id", userId);
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
