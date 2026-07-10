import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, ListChecks, Activity } from "lucide-react";
import { PageHeader, KpiCard, SectionCard, EmptyBlock } from "@/components/admin/admin-shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics globais · CondoFlow Admin" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [reservations, setReservations] = useState(0);
  const [tasks, setTasks] = useState(0);
  const [events, setEvents] = useState(0);
  const [activeCondos, setActiveCondos] = useState(0);

  useEffect(() => {
    (async () => {
      const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [r, t, e, c] = await Promise.all([
        supabase.from("reservations").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("tasks").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("activity_events").select("id", { count: "exact", head: true }).gte("created_at", sevenAgo),
        supabase.from("condominiums").select("id", { count: "exact", head: true }),
      ]);
      setReservations(r.count ?? 0);
      setTasks(t.count ?? 0);
      setEvents(e.count ?? 0);
      setActiveCondos(c.count ?? 0);
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Analytics globais" description="Indicadores de uso somados em todos os condomínios — últimos 7 dias." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Reservas / 7d" value={reservations} icon={<CalendarDays className="h-4 w-4" />} tone="primary" />
        <KpiCard label="Tarefas / 7d" value={tasks} icon={<ListChecks className="h-4 w-4" />} />
        <KpiCard label="Eventos / 7d" value={events} icon={<Activity className="h-4 w-4" />} tone="success" />
        <KpiCard label="Workspaces" value={activeCondos} icon={<BarChart3 className="h-4 w-4" />} />
      </div>
      <SectionCard title="Insights" description="Gerados automaticamente a partir do uso da plataforma">
        <EmptyBlock
          icon={<BarChart3 className="h-5 w-5" />}
          title="Conforme a plataforma cresce, insights aparecerão aqui"
          description="Tendências de adoção, picos de uso, churn previsto e oportunidades de upgrade."
        />
      </SectionCard>
    </div>
  );
}
