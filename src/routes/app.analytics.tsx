// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ReservationsCalendar } from "@/components/condo/reservations-calendar";
import { Badge } from "@/components/brand";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · CondoFlow" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { profile, condo } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  if (!condoId) return null;

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <Badge tone="primary"><Sparkles className="h-3 w-3" /> Liberado</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Analytics de reservas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Veja em tempo real quem fez reservas, em quais dias e em qual área. Clique em qualquer dia para ver os detalhes completos.
          </p>
        </div>
      </div>

      <ReservationsCalendar condoId={condoId} />
    </div>
  );
}
