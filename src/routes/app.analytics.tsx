import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · CondoFlow" }] }),
  component: () => (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Métricas reais do seu condomínio, sem números inventados.</p>
      </div>
      <EmptyState
        icon={BarChart3}
        title="Ainda não há dados suficientes"
        description="Os gráficos aparecem assim que houver reservas concluídas, tarefas executadas e atividade na operação. Comece criando uma reserva."
        tone="primary"
        action={<Link to="/app/reservations" className="text-xs font-medium text-primary hover:underline">Criar primeira reserva →</Link>}
      />
    </div>
  ),
});
