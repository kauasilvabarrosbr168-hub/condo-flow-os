import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/brand";

export const Route = createFileRoute("/app/team")({
  head: () => ({ meta: [{ title: "Equipe · CondoFlow" }] }),
  component: TeamPage,
});

function TeamPage() {
  const { condo, profile, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;

  const { data, isLoading } = useQuery({
    enabled: !!condoId && isAdmin,
    queryKey: ["team", condoId],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id,role").eq("condo_id", condoId!);
      const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("id,full_name,email,unit_label,phone").in("id", ids);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  if (!isAdmin) return <div className="p-8"><EmptyState icon={Users} title="Acesso restrito" description="Apenas síndicos e administradoras podem ver a equipe." /></div>;

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe & moradores</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todos que acessam o CondoFlow neste condomínio.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState icon={Users} title="Você ainda é o único por aqui" description="Envie convites para moradores, funcionários e a administradora." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data!.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold">
                  {(p.full_name ?? "").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.roles.map((r: string) => <Badge key={r} tone="primary">{roleLabel(r)}</Badge>)}
              </div>
              {p.unit_label && <p className="mt-2 text-xs text-muted-foreground">{p.unit_label}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function roleLabel(r: string) {
  return ({ sindico: "Síndico", administradora: "Administradora", morador: "Morador", funcionario: "Funcionário" } as Record<string, string>)[r] ?? r;
}
