// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Users, Loader2, Crown, UserMinus, AlertTriangle } from "lucide-react";
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

const ROLE_OPTIONS: { value: Role; label: string; desc: string }[] = [
  { value: "sindico",        label: "Síndico",        desc: "Acesso total ao painel de gestão" },
  { value: "administradora", label: "Administradora",  desc: "Gestão completa via empresa" },
  { value: "morador",        label: "Morador",         desc: "Pode reservar áreas e ver mural" },
  { value: "funcionario",    label: "Funcionário",     desc: "Acessa tarefas e serviços" },
];

const ROLE_TONE: Record<string, "primary" | "success" | "warning" | "default"> = {
  sindico: "primary",
  administradora: "primary",
  morador: "default",
  funcionario: "warning",
};

function TeamPage() {
  const { condo, profile, isAdmin, user } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();
  const changeRole   = useServerFn(changeUserRole);
  const removeMember = useServerFn(removeMemberFromCondo);

  const [changingId, setChangingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; full_name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

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
      }));
    },
  });

  const promote = async (targetUserId: string, newRole: Role, targetName: string) => {
    if (!condoId) return;
    const option = ROLE_OPTIONS.find((o) => o.value === newRole);
    if (!confirm(`Promover ${targetName} para ${option?.label}?`)) return;
    setChangingId(targetUserId);
    try {
      await changeRole({ data: { targetUserId, condoId, newRole } });
      toast.success(`${targetName} agora é ${option?.label}`);
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
    return <div className="p-8"><EmptyState icon={Users} title="Acesso restrito" description="Apenas síndicos e administradoras podem ver a equipe." /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe & moradores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie cargos e permissões. A troca de síndico atualiza o painel do usuário automaticamente.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState icon={Users} title="Você ainda é o único por aqui" description="Envie convites para moradores, funcionários e a administradora." />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card divide-y divide-border/60">
          {data!.map((p) => {
            const isSelf    = p.id === user?.id;
            const isChanging = changingId === p.id;
            return (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold shrink-0">
                  {(p.full_name ?? "").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.full_name} {isSelf && <span className="text-[10px] text-muted-foreground font-normal">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.email}{p.unit_label ? ` · Unid. ${p.unit_label}` : ""}
                  </p>
                </div>

                {/* Cargo + botões de ação */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone={ROLE_TONE[p.role] ?? "default"}>{roleLabel(p.role)}</Badge>

                  {!isSelf && (
                    <>
                      {/* Promover — select inline */}
                      <select
                        disabled={isChanging}
                        value={p.role}
                        onChange={(e) => promote(p.id, e.target.value as Role, p.full_name)}
                        className="h-7 rounded-lg border border-border bg-card px-2 text-xs text-muted-foreground hover:border-primary/40 transition disabled:opacity-50 cursor-pointer"
                        title="Alterar cargo"
                      >
                        {ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {isChanging && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}

                      {/* Remover do condomínio */}
                      <button
                        onClick={() => setRemoveTarget({ id: p.id, full_name: p.full_name })}
                        title="Remover do condomínio"
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
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-xs text-primary font-medium">Troca de síndico</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ao promover um morador para síndico, o painel dele muda automaticamente em tempo real.
        </p>
      </div>

      {/* Dialog de confirmação de remoção */}
      <Dialog open={!!removeTarget} onOpenChange={(v) => { if (!v && !removing) setRemoveTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remover do condomínio
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>"{removeTarget?.full_name}"</strong> do condomínio?
              O usuário perderá o acesso mas a conta dele continuará existindo na plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removing}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmRemove} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
              Remover do condomínio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function roleLabel(r: string) {
  return ({ sindico: "Síndico", administradora: "Administradora", morador: "Morador", funcionario: "Funcionário" } as Record<string, string>)[r] ?? r;
}
