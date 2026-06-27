// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  LifeBuoy,
  Activity,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader, KpiCard, SectionCard, EmptyBlock } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard global · CondoFlow Admin" }] }),
  component: AdminDashboard,
});

type Metrics = {
  condos: number;
  newCondos7d: number;
  users: number;
  activeSubs: number;
  trialing: number;
  mrrCents: number;
  openTickets: number;
  activity24h: number;
  recentCondos: { id: string; name: string; created_at: string }[];
  recentActivity: { id: string; title: string; kind: string; created_at: string }[];
};

function AdminDashboard() {
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    (async () => {
      const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const dayAgo = new Date(Date.now() - 86400000).toISOString();

      const [condos, newCondos, users, subs, tickets, activity, recentCondos, recentActivity] = await Promise.all([
        supabase.from("condominiums").select("id", { count: "exact", head: true }),
        supabase.from("condominiums").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("status, plan_id, discount_pct, plans(monthly_price_cents)"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]),
        supabase.from("activity_events").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("condominiums").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("activity_events").select("id, title, kind, created_at").order("created_at", { ascending: false }).limit(6),
      ]);

      const subsData = (subs.data ?? []) as { status: string; discount_pct: number; plans: { monthly_price_cents: number } | null }[];
      const mrr = subsData
        .filter((s) => s.status === "active")
        .reduce((acc, s) => acc + Math.round((s.plans?.monthly_price_cents ?? 0) * (1 - (s.discount_pct ?? 0) / 100)), 0);

      setM({
        condos: condos.count ?? 0,
        newCondos7d: newCondos.count ?? 0,
        users: users.count ?? 0,
        activeSubs: subsData.filter((s) => s.status === "active").length,
        trialing: subsData.filter((s) => s.status === "trialing").length,
        mrrCents: mrr,
        openTickets: tickets.count ?? 0,
        activity24h: activity.count ?? 0,
        recentCondos: recentCondos.data ?? [],
        recentActivity: recentActivity.data ?? [],
      });
    })();
  }, []);

  const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <PageHeader
        title="Dashboard global"
        description="Visão executiva do CondoFlow em tempo real. Os números crescem conforme novos condomínios entram na plataforma."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Condomínios ativos" value={m?.condos ?? "—"} hint={`${m?.newCondos7d ?? 0} novos em 7 dias`} icon={<Building2 className="h-4 w-4" />} tone="primary" />
        <KpiCard label="Usuários totais" value={m?.users ?? "—"} hint="Todos os papéis somados" icon={<Users className="h-4 w-4" />} />
        <KpiCard label="MRR" value={brl(m?.mrrCents ?? 0)} hint={`${m?.activeSubs ?? 0} assinaturas ativas`} icon={<DollarSign className="h-4 w-4" />} tone="success" />
        <KpiCard label="Em trial" value={m?.trialing ?? "—"} hint="Pendentes de conversão" icon={<TrendingUp className="h-4 w-4" />} tone="warning" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Tickets abertos" value={m?.openTickets ?? "—"} icon={<LifeBuoy className="h-4 w-4" />} tone={m && m.openTickets > 0 ? "destructive" : "default"} />
        <KpiCard label="Atividade 24h" value={m?.activity24h ?? "—"} hint="Eventos na plataforma" icon={<Activity className="h-4 w-4" />} />
        <KpiCard label="Churn 30d" value="0%" hint="Sem cancelamentos" icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label="Crescimento" value={m && m.condos > 0 ? `+${Math.round((m.newCondos7d / m.condos) * 100)}%` : "—"} hint="Últimos 7 dias" icon={<Sparkles className="h-4 w-4" />} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Condomínios recentes" description="Últimos workspaces criados na plataforma">
          {m?.recentCondos.length ? (
            <ul className="divide-y divide-border -mx-2">
              {m.recentCondos.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">Criado em {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock icon={<Building2 className="h-5 w-5" />} title="Nenhum condomínio ainda" description="Quando o primeiro workspace for criado, ele aparecerá aqui." />
          )}
        </SectionCard>

        <SectionCard title="Atividade global" description="Eventos mais recentes em todos os condomínios">
          {m?.recentActivity.length ? (
            <ul className="space-y-3">
              {m.recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.kind} · {new Date(a.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBlock icon={<Activity className="h-5 w-5" />} title="Sem eventos" description="A atividade dos condomínios aparece aqui em tempo real." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
