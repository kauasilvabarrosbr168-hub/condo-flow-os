import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Users,
  HardHat,
  Flame,
  Sparkles,
  ArrowUpRight,
  Bell,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CondoFlow" }] }),
  component: Dashboard,
});

const toneIcon: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};
const toneDot: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const kpis = [
  { label: "Reservas hoje", value: "12", delta: "+3", icon: CalendarDays, tone: "primary" as const },
  { label: "Tarefas pendentes", value: "7", delta: "−2", icon: CheckCircle2, tone: "success" as const },
  { label: "Reclamações abertas", value: "3", delta: "+1", icon: AlertTriangle, tone: "warning" as const },
  { label: "Manutenções atrasadas", value: "2", delta: "−1", icon: Wrench, tone: "destructive" as const },
  { label: "Áreas ocupadas", value: "4/9", delta: "agora", icon: Users, tone: "primary" as const },
  { label: "Funcionários ativos", value: "5", delta: "online", icon: HardHat, tone: "success" as const },
];

function Dashboard() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Segunda, 11 de maio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bom dia, Marina 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edifício Aurora · operação rodando dentro do esperado.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted">
            <Sparkles className="h-4 w-4 text-primary" /> Insights da semana
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant">
            Nova tarefa <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-${k.tone}/10 text-${k.tone}`}>
                <k.icon className="h-4 w-4" />
              </span>
              <span className="text-xs text-muted-foreground">{k.delta}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Operação dos últimos 14 dias</h3>
              <p className="text-xs text-muted-foreground">Reservas, tarefas concluídas e alertas</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary inline-block" /> Reservas</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-success inline-block" /> Concluídas</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-warning inline-block" /> Alertas</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-14 gap-2 items-end h-48" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
            {Array.from({ length: 14 }).map((_, i) => {
              const a = 30 + ((i * 23) % 70);
              const b = 20 + ((i * 17) % 60);
              const c = 5 + ((i * 11) % 25);
              return (
                <div key={i} className="flex flex-col gap-1 items-stretch">
                  <div className="rounded-t-md bg-primary/80" style={{ height: `${a}%` }} />
                  <div className="bg-success/70" style={{ height: `${b}%` }} />
                  <div className="rounded-b-md bg-warning/70" style={{ height: `${c}%` }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Alertas críticos</h3>
            <Badge tone="destructive">3 ativos</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { i: Flame, t: "Gás da sauna em 15%", s: "Substituir antes de 19h", tone: "warning" as const },
              { i: Wrench, t: "Elevador social travado", s: "Aguardando técnico Atlas", tone: "destructive" as const },
              { i: AlertTriangle, t: "Limpeza salão atrasada", s: "Reserva às 20h hoje", tone: "warning" as const },
            ].map((a) => (
              <li key={a.t} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-${a.tone}/10 text-${a.tone}`}>
                  <a.i className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{a.t}</p>
                  <p className="text-xs text-muted-foreground">{a.s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Reservas da semana</h3>
            <span className="text-xs text-muted-foreground">Maio · 2026</span>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
            {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => {
              const has = [3, 7, 10, 12, 15, 19, 21, 24].includes(i);
              const today = i === 11;
              return (
                <div key={i} className={`relative h-20 rounded-lg border ${today ? "border-primary bg-primary/5" : "border-border bg-muted/30"} p-2`}>
                  <span className={`text-xs ${today ? "text-primary font-semibold" : "text-muted-foreground"}`}>{i + 1}</span>
                  {has && (
                    <div className="mt-1 space-y-1">
                      <div className="truncate rounded bg-primary/10 text-primary text-[10px] px-1.5 py-0.5">Salão 20h</div>
                      {i % 2 === 0 && <div className="truncate rounded bg-success/10 text-success text-[10px] px-1.5 py-0.5">Sauna 18h</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Atividade recente</h3>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <ol className="mt-4 relative border-l border-border ml-2 space-y-4">
            {[
              { t: "Sauna 18h ligada por João", time: "agora", c: "success" },
              { t: "Salão reservado · Apto 402", time: "12 min", c: "primary" },
              { t: "Sugestão: nova rede na quadra", time: "1h", c: "primary" },
              { t: "Gás da sauna em 15%", time: "2h", c: "warning" },
              { t: "Limpeza piscina concluída", time: "ontem", c: "success" },
            ].map((a, i) => (
              <li key={i} className="pl-5">
                <span className={`absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-card bg-${a.c}`} />
                <div className="flex items-center justify-between">
                  <p className="text-sm">{a.t}</p>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
