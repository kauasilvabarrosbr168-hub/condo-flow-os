import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Search, Users as UsersIcon, Loader2, CheckCircle2, PauseCircle, Plus, Copy, Mail } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/condos")({
  head: () => ({ meta: [{ title: "Condomínios · CondoFlow Admin" }] }),
  component: CondosPage,
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
        description="Todos os workspaces da plataforma. Isolados entre si por arquitetura multi-tenant."
        actions={
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome…" className="pl-9" />
          </div>
        }
      />

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
