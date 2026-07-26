// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Users, Loader2, Crown, UserMinus, AlertTriangle, HardHat, Phone, Mail } from "lucide-react";
import { useAuth, type Role } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/brand";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { changeUserRole } from "@/lib/promote-user.functions";
import { removeMemberFromCondo } from "@/lib/membership.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/team")({
  head: () => ({ meta: [{ title: "Equipe · CondoFlow" }] }),
  component: TeamPage,
});

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "sindico",        label: "Síndico" },
  { value: "administradora", label: "Administradora" },
  { value: "morador",        label: "Morador" },
  { value: "funcionario",    label: "Funcionário" },
];

const ROLE_TONE: Record<string, "primary" | "success" | "warning" | "default"> = {
  sindico: "primary",
  administradora: "primary",
  morador: "default",
  funcionario: "warning",
};

function roleLabel(r: string) {
  return ({ sindico: "Síndico", administradora: "Administradora", morador: "Morador", funcionario: "Funcionário" } as Record<string, string>)[r] ?? r;
}

function initials(name: string) {
  return (name ?? "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
}

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  unit_label: string | null;
  phone: string | null;
  role: Role;
};

function TeamPage() {
  const { condo, profile, isAdmin, user } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();
  const changeRole   = useServerFn(changeUserRole);
  const removeMember = useServerFn(removeMemberFromCondo);

  const [tab, setTab]             = useState<"moradores" | "colaboradores">("moradores");
  const [changingId, setChangingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving]   = useState(false);

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
        role: (roles ?? []).find((r) => r.user_id === p.id)?.role as Role ?? "morador",
      })) as Member[];
    },
  });

  const moradores     = (data ?? []).filter((m) => m.role !== "funcionario");
  const colaboradores = (data ?? []).filter((m) => m.role === "funcionario");

  const promote = async (targetUserId: string, newRole: Role, targetName: string) => {
    if (!condoId) return;
    const label = ROLE_OPTIONS.find((o) => o.value === newRole)?.label;
    if (!confirm(`Alterar ${targetName} para ${label}?`)) return;
    setChangingId(targetUserId);
    try {
      await changeRole({ data: { targetUserId, condoId, newRole } });
      toast.success(`${targetName} agora é ${label}`);
      qc.invalidateQueries({ queryKey: ["team", condoId] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao alterar cargo");
    } finally {
      setChangingId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget || !condoId) return;
    setRemoving(true);
    try {
      await removeMember({ data: { targetUserId: removeTarget.id, condoId } });
      toast.success(`${removeTarget.full_name} removido do condomínio`);
      setRemoveTarget(null);
      qc.invalidateQueries({ queryKey: ["team", condoId] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao remover membro");
    } finally {
      setRemoving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <EmptyState icon={Users} title="Acesso restrito" description="Apenas síndicos e administradoras podem ver a equipe." />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe & moradores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie cargos e permissões do condomínio.
        </p>
      </div>

      {/* Abas */}
      <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 gap-1">
        {([
          { key: "moradores",    label: "Moradores",    count: moradores.length,     icon: Users },
          { key: "colaboradores", label: "Colaboradores", count: colaboradores.length, icon: HardHat },
        ] as const).map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[11px] font-semibold ${
              tab === key ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "moradores" ? (
        /* ── ABA MORADORES ── */
        moradores.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum morador ainda" description="Envie convites para moradores e administradores." />
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-card divide-y divide-border/60">
            {moradores.map((p) => {
              const isSelf     = p.id === user?.id;
              const isChanging = changingId === p.id;
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold shrink-0">
                    {initials(p.full_name)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.full_name}{" "}
                      {isSelf && <span className="text-[10px] text-muted-foreground font-normal">(você)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.email}{p.unit_label ? ` · Unid. ${p.unit_label}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={ROLE_TONE[p.role] ?? "default"}>{roleLabel(p.role)}</Badge>
                    {!isSelf && (
                      <>
                        <select
                          disabled={isChanging}
                          value={p.role}
                          onChange={(e) => promote(p.id, e.target.value as Role, p.full_name)}
                          className="h-7 rounded-lg border border-border bg-card px-2 text-xs text-muted-foreground hover:border-primary/40 transition disabled:opacity-50 cursor-pointer"
                        >
                          {ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        {isChanging && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                        <button
                          onClick={() => setRemoveTarget(p)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── ABA COLABORADORES ── */
        colaboradores.length === 0 ? (
          <EmptyState
            icon={HardHat}
            title="Nenhum colaborador cadastrado"
            description="Envie um convite com o papel Funcionário ou aprove a solicitação de acesso."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colaboradores.map((p) => {
              const isChanging = changingId === p.id;
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card shadow-card p-5 flex flex-col gap-4">
                  {/* Topo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-warning/15 text-warning text-sm font-bold shrink-0">
                        {initials(p.full_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p.full_name}</p>
                        <Badge tone="warning">Funcionário</Badge>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isChanging
                        ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        : (
                          <>
                            <select
                              value={p.role}
                              onChange={(e) => promote(p.id, e.target.value as Role, p.full_name)}
                              className="h-7 rounded-lg border border-border bg-card px-2 text-xs text-muted-foreground hover:border-primary/40 transition cursor-pointer"
                              title="Alterar cargo"
                            >
                              {ROLE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setRemoveTarget(p)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition"
                              title="Remover"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="space-y-1.5">
                    {p.email && (
                      <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </a>
                    )}
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {p.phone}
                      </a>
                    )}
                    {!p.email && !p.phone && (
                      <p className="text-xs text-muted-foreground italic">Sem contato cadastrado</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Dica */}
      {tab === "moradores" && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs text-primary font-medium">Troca de síndico</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ao promover um morador para síndico, o painel dele muda automaticamente em tempo real.
          </p>
        </div>
      )}

      {/* Dialog remoção */}
      <Dialog open={!!removeTarget} onOpenChange={(v) => { if (!v && !removing) setRemoveTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remover do condomínio
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>"{removeTarget?.full_name}"</strong> do condomínio?
              O usuário perderá o acesso mas a conta continuará existindo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removing}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmRemove} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
