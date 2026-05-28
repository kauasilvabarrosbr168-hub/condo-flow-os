import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Search, Users as UsersIcon, Loader2, CheckCircle2, PauseCircle, Plus, Copy, Mail, UserPlus } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/brand";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { assignMemberToCondo } from "@/lib/admin-members.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/condos")({
  head: () => ({ meta: [{ title: "Condomínios · CondoFlow Admin" }] }),
  component: CondosPage,
});

});

type Row = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  users: number;
  plan: string | null;
  status: string | null;
};

function CondosPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<string | null>(null);
  const [form, setForm] = useState({ condoName: "", address: "", sindicoName: "", sindicoEmail: "" });

  const load = async () => {
    const [{ data: condos }, { data: profiles }, { data: subs }] = await Promise.all([
      supabase.from("condominiums").select("id, name, address, created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("condo_id"),
      supabase.from("subscriptions").select("condo_id, status, plans(name)"),
    ]);

    const userCounts = new Map<string, number>();
    (profiles ?? []).forEach((p: { condo_id: string | null }) => {
      if (p.condo_id) userCounts.set(p.condo_id, (userCounts.get(p.condo_id) ?? 0) + 1);
    });
    const subMap = new Map<string, { plan: string | null; status: string }>();
    (subs ?? []).forEach((s: { condo_id: string; status: string; plans: { name: string } | null }) => {
      subMap.set(s.condo_id, { plan: s.plans?.name ?? null, status: s.status });
    });

    setRows(
      (condos ?? []).map((c: { id: string; name: string; address: string | null; created_at: string }) => ({
        ...c,
        users: userCounts.get(c.id) ?? 0,
        plan: subMap.get(c.id)?.plan ?? null,
        status: subMap.get(c.id)?.status ?? null,
      })),
    );
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) => r.name.toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );

  const toggleSuspend = async (id: string, current: string | null) => {
    const next = current === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("subscriptions").update({ status: next }).eq("condo_id", id);
    if (error) return toast.error(error.message);
    toast.success(next === "suspended" ? "Condomínio suspenso" : "Condomínio reativado");
    load();
  };

  const createCondo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sessão administrativa não encontrada.");
    setCreating(true);
    setCreatedInvite(null);
    try {
      const { data: condo, error: condoError } = await supabase
        .from("condominiums")
        .insert({ name: form.condoName.trim(), address: form.address.trim() || null, created_by: user.id })
        .select("id")
        .single();
      if (condoError || !condo) throw new Error(condoError?.message ?? "Falha ao criar condomínio.");

      const { data: starter } = await supabase.from("plans").select("id").eq("code", "starter").maybeSingle();
      if (starter?.id) {
        await supabase.from("subscriptions").insert({ condo_id: condo.id, plan_id: starter.id, status: "trialing" });
      }

      const { data: invite, error: inviteError } = await supabase
        .from("invitations")
        .insert({
          condo_id: condo.id,
          email: form.sindicoEmail.trim().toLowerCase(),
          full_name: form.sindicoName.trim(),
          role: "sindico",
          invited_by: user.id,
        })
        .select("token")
        .single();
      if (inviteError || !invite) throw new Error(inviteError?.message ?? "Falha ao criar convite do síndico.");

      const inviteUrl = `${window.location.origin}/login?mode=signup&invite=${invite.token}`;
      setCreatedInvite(inviteUrl);
      setForm({ condoName: "", address: "", sindicoName: "", sindicoEmail: "" });
      toast.success("Condomínio criado e convite do síndico gerado.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir o cadastro.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Condomínios"
        description="Cadastre clientes, gere o acesso do síndico e controle cada workspace sem entrar no app dos moradores."
        actions={
          <>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome…" className="pl-9" />
            </div>
            <Button onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-4 w-4" /> Novo condomínio
            </Button>
          </>
        }
      />

      {showCreate && (
        <form onSubmit={createCondo} className="mb-6 rounded-2xl border border-border bg-card shadow-card overflow-hidden animate-fade-in">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold">Cadastrar condomínio e síndico</p>
            <p className="text-xs text-muted-foreground mt-0.5">O síndico recebe um convite exclusivo e entra no app normal do condomínio.</p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do condomínio</span>
              <Input required value={form.condoName} onChange={(e) => setForm((f) => ({ ...f, condoName: e.target.value }))} placeholder="Residencial Aurora" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endereço</span>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Rua das Palmeiras, 123" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do síndico</span>
              <Input required value={form.sindicoName} onChange={(e) => setForm((f) => ({ ...f, sindicoName: e.target.value }))} placeholder="Marina Souza" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email do síndico</span>
              <Input required type="email" value={form.sindicoEmail} onChange={(e) => setForm((f) => ({ ...f, sindicoEmail: e.target.value }))} placeholder="sindico@condominio.com" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4">
            {createdInvite ? (
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(createdInvite); toast.success("Link copiado"); }}
                className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition"
              >
                <Copy className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Convite gerado: {createdInvite}</span>
              </button>
            ) : <span className="text-xs text-muted-foreground">Após criar, copie o link e envie ao síndico.</span>}
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Criar e gerar convite
            </Button>
          </div>
        </form>
      )}

      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyBlock
          icon={<Building2 className="h-5 w-5" />}
          title={q ? "Nada por aqui" : "Nenhum condomínio cadastrado"}
          description={q ? "Tente outro termo." : "Os workspaces criados pelos síndicos aparecerão aqui."}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 font-medium">Plano</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Usuários</th>
                <th className="text-left px-5 py-3 font-medium">Criado</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium">{r.name}</p>
                        {r.address && <p className="text-[11px] text-muted-foreground">{r.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{r.plan ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-5 py-3">
                    {r.status === "active" && <Badge tone="success">Ativo</Badge>}
                    {r.status === "trialing" && <Badge tone="primary">Trial</Badge>}
                    {r.status === "suspended" && <Badge tone="destructive">Suspenso</Badge>}
                    {r.status === "past_due" && <Badge tone="warning">Atrasado</Badge>}
                    {!r.status && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <UsersIcon className="h-3.5 w-3.5" /> {r.users}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleSuspend(r.id, r.status)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition"
                    >
                      {r.status === "suspended" ? <><CheckCircle2 className="h-3.5 w-3.5" /> Reativar</> : <><PauseCircle className="h-3.5 w-3.5" /> Suspender</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
