// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Users as UsersIcon, Loader2, Crown, Trash2, AlertTriangle } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/brand";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { changeUserRole } from "@/lib/promote-user.functions";
import { deleteUser } from "@/lib/admin-members.functions";
import { toast } from "sonner";
import type { Role } from "@/hooks/use-auth";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  unit_label: string | null;
  condo_id: string | null;
  condo_name: string | null;
  role: string | null;
};

const ROLE_TONE: Record<string, "primary" | "success" | "warning" | "default"> = {
  sindico: "primary",
  administradora: "primary",
  morador: "default",
  funcionario: "warning",
};

function roleLabel(r: string) {
  return ({ sindico: "Síndico", administradora: "Administradora", morador: "Morador", funcionario: "Funcionário" } as Record<string, string>)[r] ?? r;
}

export function AdminUsersPage() {
  const [rows, setRows]               = useState<Row[] | null>(null);
  const [q, setQ]                     = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const changeRole = useServerFn(changeUserRole);
  const delUser    = useServerFn(deleteUser);

  const load = async () => {
    const [{ data: profs }, { data: condos }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, unit_label, condo_id"),
      supabase.from("condominiums").select("id, name"),
      supabase.from("user_roles").select("user_id, role, condo_id"),
    ]);
    const condoMap = new Map((condos ?? []).map((c) => [c.id, c.name]));
    setRows(
      (profs ?? []).map((p) => {
        const userRole = (roles ?? []).find((r) => r.user_id === p.id);
        const condoId  = p.condo_id ?? userRole?.condo_id ?? null;
        return {
          ...p,
          condo_id:   condoId,
          condo_name: condoId ? condoMap.get(condoId) ?? null : null,
          role:       userRole?.role ?? null,
        };
      }),
    );
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) =>
      ((r.full_name ?? "") + (r.email ?? "")).toLowerCase().includes(q.toLowerCase())
    ),
    [rows, q],
  );

  const promote = async (row: Row) => {
    if (!row.condo_id) { toast.error("Usuário não está vinculado a nenhum condomínio."); return; }
    if (!confirm(`Promover ${row.full_name} para Síndico?`)) return;
    setPromotingId(row.id);
    try {
      await changeRole({ data: { targetUserId: row.id, condoId: row.condo_id, newRole: "sindico" } });
      toast.success(`${row.full_name} agora é Síndico`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao promover");
    } finally {
      setPromotingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await delUser({ data: { userId: deleteTarget.id } });
      toast.success(`${deleteTarget.full_name} excluído`);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Usuários da plataforma"
        description="Gerencie cargos e promoções de síndico em todos os condomínios."
        actions={
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou email…" className="pl-9" />
          </div>
        }
      />

      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyBlock icon={<UsersIcon className="h-5 w-5" />} title="Nenhum usuário" description="As contas criadas aparecerão aqui." />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Pessoa</th>
                <th className="text-left px-5 py-3 font-medium">Cargo atual</th>
                <th className="text-left px-5 py-3 font-medium">Condomínio</th>
                <th className="text-left px-5 py-3 font-medium">Unidade</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const isPromoting = promotingId === r.id;
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold shrink-0">
                          {(r.full_name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium leading-tight">{r.full_name ?? "—"}</p>
                          <p className="text-[11px] text-muted-foreground">{r.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      {r.role
                        ? <Badge tone={ROLE_TONE[r.role] ?? "default"}>{roleLabel(r.role)}</Badge>
                        : <span className="text-xs text-muted-foreground">Sem cargo</span>}
                    </td>

                    <td className="px-5 py-3 text-sm">
                      {r.condo_name ?? <span className="text-muted-foreground">—</span>}
                    </td>

                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      {r.unit_label ?? "—"}
                    </td>

                    {/* Ações — botões inline, sem dropdown (dropdown é cortado pelo overflow-hidden do container) */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {r.condo_id && r.role !== "sindico" && (
                          <button
                            onClick={() => promote(r)}
                            disabled={isPromoting}
                            title="Promover a Síndico"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition disabled:opacity-50"
                          >
                            {isPromoting
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Crown className="h-3.5 w-3.5" />}
                            Síndico
                          </button>
                        )}
                        {r.role === "sindico" && (
                          <span className="text-[11px] text-primary font-medium px-2">Síndico ✓</span>
                        )}

                        <button
                          onClick={() => setDeleteTarget(r)}
                          title="Excluir usuário permanentemente"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v && !deleting) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir permanentemente <strong>"{deleteTarget?.full_name}"</strong>?
              Isso remove a conta da plataforma e não pode ser desfeito.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Excluir definitivamente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
