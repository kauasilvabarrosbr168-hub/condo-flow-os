import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAnyAdmin, setHasAnyAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) {
      setIsAdmin(false);
      setHasAnyAdmin(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, count } = await supabase
      .from("platform_admins")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .maybeSingle();
    setIsAdmin(!!data);
    // count from the same query reflects rows visible (own row + others if already admin).
    // To detect "any admin exists?" reliably we do a head count.
    const { count: total } = await supabase
      .from("platform_admins")
      .select("id", { count: "exact", head: true });
    setHasAnyAdmin((total ?? 0) > 0 || !!data);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const claimFirst = async () => {
    const { data, error } = await supabase.rpc("claim_first_platform_admin");
    if (error) return { error: error.message };
    if (!data) return { error: "Já existe um administrador da plataforma." };
    await refresh();
    return {};
  };

  return { isAdmin, hasAnyAdmin, loading: loading || authLoading, refresh, claimFirst };
}
