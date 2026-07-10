import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp } from "lucide-react";
import { PageHeader, KpiCard, SectionCard, EmptyBlock } from "@/components/admin/admin-shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({ meta: [{ title: "Receita · CondoFlow Admin" }] }),
  component: RevenuePage,
});

function RevenuePage() {
  const [mrr, setMrr] = useState(0);
  const [active, setActive] = useState(0);
  const [arr, setArr] = useState(0);
  const [breakdown, setBreakdown] = useState<{ plan: string; count: number; mrr: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("subscriptions").select("status, discount_pct, plans(name, monthly_price_cents)");
      const subs = (data ?? []) as { status: string; discount_pct: number; plans: { name: string; monthly_price_cents: number } | null }[];
      const activeSubs = subs.filter((s) => s.status === "active");
      const total = activeSubs.reduce((acc, s) => acc + Math.round((s.plans?.monthly_price_cents ?? 0) * (1 - (s.discount_pct ?? 0) / 100)), 0);
      setActive(activeSubs.length);
      setMrr(total);
      setArr(total * 12);
      const map = new Map<string, { count: number; mrr: number }>();
      activeSubs.forEach((s) => {
        const k = s.plans?.name ?? "—";
        const cur = map.get(k) ?? { count: 0, mrr: 0 };
        cur.count += 1;
        cur.mrr += Math.round((s.plans?.monthly_price_cents ?? 0) * (1 - (s.discount_pct ?? 0) / 100));
        map.set(k, cur);
      });
      setBreakdown(Array.from(map.entries()).map(([plan, v]) => ({ plan, ...v })));
    })();
  }, []);

  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <PageHeader title="Receita" description="Saúde financeira do SaaS em tempo real." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="MRR" value={brl(mrr)} icon={<DollarSign className="h-4 w-4" />} tone="success" />
        <KpiCard label="ARR projetado" value={brl(arr)} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <KpiCard label="Assinaturas ativas" value={active} />
        <KpiCard label="ARPU" value={brl(active > 0 ? Math.round(mrr / active) : 0)} hint="Receita média por conta" />
      </div>

      <SectionCard title="Distribuição por plano">
        {breakdown.length === 0 ? (
          <EmptyBlock icon={<DollarSign className="h-5 w-5" />} title="Sem receita registrada" description="Quando o primeiro condomínio passar do trial, sua receita aparece aqui." />
        ) : (
          <div className="space-y-3">
            {breakdown.map((b) => {
              const pct = mrr > 0 ? (b.mrr / mrr) * 100 : 0;
              return (
                <div key={b.plan}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{b.plan} <span className="text-muted-foreground">· {b.count} assinaturas</span></span>
                    <span className="tabular-nums">{brl(b.mrr)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
