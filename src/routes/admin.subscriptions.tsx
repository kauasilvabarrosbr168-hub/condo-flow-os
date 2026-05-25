import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Badge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Assinaturas · CondoFlow Admin" }] }),
  component: SubsPage,
});

type Row = {
  id: string;
  condo_id: string;
  condo_name: string;
  plan_id: string;
  plan_name: string;
  price_cents: number;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  discount_pct: number;
};

function SubsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);

  const load = async () => {
    const [{ data: subs }, { data: ps }] = await Promise.all([
      supabase.from("subscriptions").select("id, condo_id, plan_id, status, trial_ends_at, current_period_end, discount_pct, condominiums(name), plans(name, monthly_price_cents)"),
      supabase.from("plans").select("id, name").eq("is_active", true),
    ]);
    setPlans(ps ?? []);
    setRows(
      (subs ?? []).map((s: {
        id: string; condo_id: string; plan_id: string; status: string;
        trial_ends_at: string | null; current_period_end: string | null; discount_pct: number;
        condominiums: { name: string } | null;
        plans: { name: string; monthly_price_cents: number } | null;
      }) => ({
        id: s.id,
        condo_id: s.condo_id,
        condo_name: s.condominiums?.name ?? "—",
        plan_id: s.plan_id,
        plan_name: s.plans?.name ?? "—",
        price_cents: s.plans?.monthly_price_cents ?? 0,
        status: s.status,
        trial_ends_at: s.trial_ends_at,
        current_period_end: s.current_period_end,
        discount_pct: s.discount_pct ?? 0,
      })),
    );
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("subscriptions").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    load();
  };

  const updatePlan = async (id: string, plan_id: string) => {
    const { error } = await supabase.from("subscriptions").update({ plan_id }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plano alterado");
    load();
  };

  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <PageHeader title="Assinaturas" description="Controle de planos, status e cobrança de cada workspace." />

      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyBlock icon={<CreditCard className="h-5 w-5" />} title="Nenhuma assinatura" description="Assinaturas são criadas automaticamente quando um workspace é cadastrado." />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 font-medium">Plano</th>
                <th className="text-left px-5 py-3 font-medium">Valor</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Período</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{r.condo_name}</td>
                  <td className="px-5 py-3">
                    <select
                      value={r.plan_id}
                      onChange={(e) => updatePlan(r.id, e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{brl(Math.round(r.price_cents * (1 - r.discount_pct / 100)))}<span className="text-muted-foreground">/mês</span></td>
                  <td className="px-5 py-3">
                    {r.status === "active" && <Badge tone="success">Ativa</Badge>}
                    {r.status === "trialing" && <Badge tone="primary">Trial</Badge>}
                    {r.status === "suspended" && <Badge tone="destructive">Suspensa</Badge>}
                    {r.status === "past_due" && <Badge tone="warning">Atrasada</Badge>}
                    {r.status === "cancelled" && <Badge>Cancelada</Badge>}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {r.trial_ends_at && r.status === "trialing"
                      ? `Trial até ${new Date(r.trial_ends_at).toLocaleDateString("pt-BR")}`
                      : r.current_period_end
                      ? `Renova em ${new Date(r.current_period_end).toLocaleDateString("pt-BR")}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {r.status !== "active" && <button onClick={() => updateStatus(r.id, "active")} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">Ativar</button>}
                      {r.status !== "suspended" && <button onClick={() => updateStatus(r.id, "suspended")} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">Suspender</button>}
                    </div>
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
