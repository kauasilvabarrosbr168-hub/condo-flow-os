import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Plus, Loader2, X, Copy, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { Badge } from "@/components/brand";

export const Route = createFileRoute("/app/invitations")({
  head: () => ({ meta: [{ title: "Convites · CondoFlow" }] }),
  component: InvitationsPage,
});

function InvitationsPage() {
  const { condo, profile, user, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: invites, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["invites", condoId],
    queryFn: async () => {
      const { data } = await supabase.from("invitations").select("*").eq("condo_id", condoId!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!isAdmin) {
    return <div className="p-8"><EmptyState icon={Mail} title="Acesso restrito" description="Apenas síndicos e administradoras podem convidar pessoas." /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Convites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Convide moradores, funcionários e a administradora.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95">
          <Plus className="h-4 w-4" /> Novo convite
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (invites?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum convite enviado"
          description="Envie convites para que cada pessoa entre com login próprio e permissões corretas."
          tone="primary"
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Pessoa</th>
                <th className="text-left px-4 py-3 font-medium">Papel</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {invites!.map((inv) => {
                const accepted = !!inv.accepted_at;
                const expired = !accepted && new Date(inv.expires_at) < new Date();
                const link = typeof window !== "undefined" ? `${window.location.origin}/login?invite=${inv.token}` : "";
                return (
                  <tr key={inv.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.full_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.email}{inv.unit_label && ` · ${inv.unit_label}`}</p>
                    </td>
                    <td className="px-4 py-3"><Badge tone="primary">{roleLabel(inv.role)}</Badge></td>
                    <td className="px-4 py-3">
                      {accepted ? <Badge tone="success">Aceito</Badge> : expired ? <Badge tone="destructive">Expirado</Badge> : <Badge tone="warning">Pendente</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {!accepted && (
                          <button
                            onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copiado"); }}
                            title="Copiar link"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm("Remover este convite?")) return;
                            const { error } = await supabase.from("invitations").delete().eq("id", inv.id);
                            if (error) toast.error(error.message); else { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["invites", condoId] }); }
                          }}
                          title="Remover"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

      {open && condoId && user && (
        <InviteDialog condoId={condoId} invitedBy={user.id} onClose={() => setOpen(false)} onCreated={() => qc.invalidateQueries({ queryKey: ["invites", condoId] })} />
      )}
    </div>
  );
}

function InviteDialog({ condoId, invitedBy, onClose, onCreated }: { condoId: string; invitedBy: string; onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [unit, setUnit] = useState("");
  const [role, setRole] = useState<"morador" | "funcionario" | "administradora">("morador");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.from("invitations").insert({
      condo_id: condoId,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      unit_label: unit.trim() || null,
      role,
      invited_by: invitedBy,
    }).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data && typeof window !== "undefined") {
      const link = `${window.location.origin}/login?invite=${data.token}`;
      navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Convite criado — link copiado!");
    }
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elegant animate-pop">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold">Novo convite</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Nome"><input required value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></Field>
          <Field label="Email"><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
          <Field label="Unidade (opcional)"><input value={unit} maxLength={20} onChange={(e) => setUnit(e.target.value)} placeholder="Apto 402" className={inputCls} /></Field>
          <Field label="Papel">
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className={inputCls}>
              <option value="morador">Morador</option>
              <option value="funcionario">Funcionário</option>
              <option value="administradora">Administradora</option>
            </select>
          </Field>
          <p className="text-xs text-muted-foreground">Um link será gerado e copiado para a área de transferência — envie por WhatsApp ou email.</p>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-hero text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar convite
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
function roleLabel(r: string) {
  return ({ sindico: "Síndico", administradora: "Administradora", morador: "Morador", funcionario: "Funcionário" } as Record<string, string>)[r] ?? r;
}
