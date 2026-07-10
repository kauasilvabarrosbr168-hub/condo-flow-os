import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({ meta: [{ title: "Planos · CondoFlow Admin" }] }),
  component: PlansPage,
});

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthly_price_cents: number;
  unit_limit: number | null;
  user_limit: number | null;
  features: string[];
  is_active: boolean;
};

function PlansPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    supabase.from("plans").select("*").order("monthly_price_cents").then(({ data }) => setPlans((data ?? []) as Plan[]));
  }, []);

  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <PageHeader title="Planos comerciais" description="Catálogo de planos disponíveis para os condomínios." />
      {!plans ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p, i) => (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-6 shadow-card flex flex-col ${
                i === 1 ? "border-primary/40 bg-gradient-to-br from-primary/5 to-transparent" : "border-border bg-card"
              }`}
            >
              {i === 1 && (
                <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Recomendado
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </span>
                <h3 className="font-semibold tracking-tight">{p.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{p.description}</p>
              <p className="text-3xl font-semibold tabular-nums">
                {brl(p.monthly_price_cents)}
                <span className="text-sm text-muted-foreground font-normal">/mês</span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="rounded-lg border border-border bg-background p-2">
                  <p className="text-[10px] uppercase tracking-wider">Unidades</p>
                  <p className="text-foreground font-medium">{p.unit_limit ?? "Ilimitado"}</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-2">
                  <p className="text-[10px] uppercase tracking-wider">Usuários</p>
                  <p className="text-foreground font-medium">{p.user_limit ?? "Ilimitado"}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
