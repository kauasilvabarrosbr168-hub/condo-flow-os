// @ts-nocheck
// NÃO REGENERAR — arquivo customizado com delete + promoção de síndico
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Users as UsersIcon, Loader2, Crown, ChevronDown, Trash2 } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/brand";
import { supabase } from "@/lib/supabase";
import { changeUserRole } from "@/lib/promote-user.functions";
import { deleteUser } from "@/lib/admin-members.functions";
import { toast } from "sonner";
import type { Role } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Usuários · CondoFlow Admin" }] }),
  component: UsersPage,
});

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  unit_label: string | null;
  condo_id: string | null;
  condo_name: string | null;
  role: string | null;        // role atual neste condo
};

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

function UsersPage() {
  const [rows, setRows]       = useState<Row[] | null>(null);
  const [q, setQ]             = useState("");
  const [changingId, setChangingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const changeRole = useServerFn(changeUserRole);
  const delUser = useServerFn(deleteUser);

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
        const condoId = p.condo_id ?? userRole?.condo_id ?? null;
        return {
          ...p,
          condo_id: condoId,
          condo_name: condoId ? condoMap.get(condoId) ?? null : null,
          role: userRole?.role ?? null,
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

  const remove = async (row: Row) => {
    if (!confirm(`Excluir permanentemente "${row.full_name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(row.id);
    try {
      await delUser({ data: { userId: row.id } });
      toast.success(`${row.full_name} excluído`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  };

  const promote = async (row: Row, newRole: Role) => {
    if (!row.condo_id) {
      toast.error("Usuário não está vinculado a nenhum condomínio.");
      return;
    }
    const label = ROLE_OPTIONS.find((o) => o.value === newRole)?.label ?? newRole;
    if (!confirm(`Promover ${row.full_name} para ${label}?`)) return;
    setChangingId(row.id);
    try {
      await changeRole({ data: { targetUserId: row.id, condoId: row.condo_id, newRole } });
      toast.success(`${row.full_name} agora é ${label}`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao alterar cargo");
    } finally {
      setChangingId(null);
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
                <th className="text-left px-5 py-3 font-medium">Promover</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const isChanging = changingId === r.id;
                const hasCondo = !!r.condo_id;
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition">
                    {/* Pessoa */}
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

                    {/* Cargo */}
                    <td className="px-5 py-3">
                      {r.role
                        ? <Badge tone={ROLE_TONE[r.role] ?? "default"}>{roleLabel(r.role)}</Badge>
                        : <span className="text-xs text-muted-foreground">Sem cargo</span>
                      }
                    </td>

                    {/* Condomínio */}
                    <td className="px-5 py-3 text-sm">
                      {r.condo_name ?? <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Unidade */}
                    <td className="px-5 py-3 text-muted-foreground text-sm">
                      {r.unit_label ?? "—"}
                    </td>

                    {/* Promover */}
                    <td className="px-5 py-3">
                      {hasCondo ? (
                        <div className="relative group inline-block">
                          <button
                            disabled={isChanging}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition disabled:opacity-50"
                          >
                            {isChanging
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Crown className="h-3.5 w-3.5" />
                            }
                            Promover
                            <ChevronDown className="h-3 w-3" />
                          </button>

                          {/* Dropdown abre para CIMA — só Síndico */}
                          <div className="absolute left-0 bottom-full mb-1 z-30 hidden group-focus-within:flex group-hover:flex flex-col w-48 rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
                            {r.role !== "sindico" && (
                              <button
                                onClick={() => promote(r, "sindico")}
                                className="flex items-center gap-2 px-3 py-2.5 text-xs text-left hover:bg-primary/10 transition"
                              >
                                <Crown className="h-3.5 w-3.5 text-primary shrink-0" />
                                <div>
                                  <p className="font-semibold text-primary">Síndico</p>
                                  <p className="text-[10px] text-muted-foreground">Acesso total ao painel de gestão</p>
                                </div>
                              </button>
                            )}
                            {r.role === "sindico" && (
                              <div className="px-3 py-2.5 text-xs text-muted-foreground">Já é síndico</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Excluir */}
                    <td className="px-3 py-3">
                      <button
                        onClick={() => remove(r)}
                        disabled={deletingId === r.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition disabled:opacity-40"
                        title="Excluir usuário"
                      >
                        {deletingId === r.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function roleLabel(r: string) {
  return ({ sindico: "Síndico", administradora: "Administradora", morador: "Morador", funcionario: "Funcionário" } as Record<string, string>)[r] ?? r;
}
