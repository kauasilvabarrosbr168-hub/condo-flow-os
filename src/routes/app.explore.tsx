import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Flame, Activity, Users, ListChecks, MessageSquare, BarChart3, Sparkles, Building, ArrowRight } from "lucide-react";
import { Badge } from "@/components/brand";

export const Route = createFileRoute("/app/explore")({
  head: () => ({ meta: [{ title: "Explorar · CondoFlow" }] }),
  component: ExplorePage,
});

const MODULES = [
  { icon: CalendarDays, name: "Reservas automatizadas", desc: "Morador reserva, o sistema confirma, gera checklist e dispara tarefas.", to: "/app/reservations" as const, status: "ativo" as const },
  { icon: ListChecks, name: "Tarefas & checklist", desc: "Operação em fila para funcionários, com status e prazo.", to: "/app/tasks" as const, status: "ativo" as const },
  { icon: Activity, name: "Timeline em tempo real", desc: "Tudo que acontece no condomínio, registrado em segundos.", to: "/app/timeline" as const, status: "ativo" as const },
  { icon: Building, name: "Áreas comuns", desc: "Configure o que pode ser reservado e as regras de cada espaço.", to: "/app/areas" as const, status: "ativo" as const },
  { icon: Flame, name: "Sauna inteligente", desc: "Ligamento automático, controle de gás e confirmação 2h antes.", to: "/app/explore" as const, status: "em-breve" as const },
  { icon: MessageSquare, name: "Comunicação multicanal", desc: "Push, email e WhatsApp para o que realmente importa.", to: "/app/communication" as const, status: "em-breve" as const },
  { icon: BarChart3, name: "Analytics operacional", desc: "Calendário ao vivo de reservas e métricas reais do condomínio.", to: "/app/analytics" as const, status: "ativo" as const },
  { icon: Users, name: "IA operacional", desc: "Sugestões de manutenção, alertas inteligentes e priorização automática.", to: "/app/explore" as const, status: "roadmap" as const },
];

function ExplorePage() {
  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <Badge tone="primary"><Sparkles className="h-3 w-3" /> Centro de exploração</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Explorar CondoFlow</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">Conheça os módulos do sistema operacional do seu condomínio. Ative apenas o que faz sentido para a sua operação.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link
            key={m.name}
            to={m.to}
            className="group relative rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-hero group-hover:text-primary-foreground transition">
                  <m.icon className="h-5 w-5" />
                </span>
                <StatusPill status={m.status} />
              </div>
              <h3 className="mt-4 text-base font-semibold">{m.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{m.desc}</p>
              <p className="mt-4 text-xs font-medium text-primary inline-flex items-center gap-1">
                Abrir <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "ativo" | "em-breve" | "roadmap" }) {
  if (status === "ativo") return <Badge tone="success">Ativo</Badge>;
  if (status === "em-breve")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 shadow-sm">
        Em breve
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
      Roadmap
    </span>
  );
}
