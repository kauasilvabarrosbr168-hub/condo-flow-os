import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import { Flame, CheckCircle2, Clock, AlertTriangle, MessageSquare, Camera, Bell } from "lucide-react";

export const Route = createFileRoute("/app/sauna")({
  head: () => ({ meta: [{ title: "Sauna inteligente — CondoFlow" }] }),
  component: Sauna,
});

const steps = [
  { t: "Reserva criada", time: "14:02", state: "done", who: "Apto 1102 reservou para 18h" },
  { t: "Confirmação enviada", time: "16:00", state: "done", who: "WhatsApp + push · 2h antes" },
  { t: "Morador confirmou presença", time: "16:18", state: "done", who: "Confirmado por Júlia C." },
  { t: "Tarefa criada para João", time: "17:30", state: "active", who: "Ligar sauna às 17:45" },
  { t: "Sauna pronta", time: "18:00", state: "pending", who: "Temperatura alvo 90°C" },
  { t: "Sessão concluída", time: "19:00", state: "pending", who: "Aviso de desligamento automático" },
];

function Sauna() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Automação inteligente</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sauna · Reserva #2417</h1>
          <p className="mt-1 text-sm text-muted-foreground">Apto 1102 · Hoje, 18h–19h · Funcionário: João Pereira</p>
        </div>
        <div className="flex gap-2">
          <Badge tone="warning"><Flame className="h-3 w-3" /> Em execução</Badge>
          <Badge tone="primary"><Clock className="h-3 w-3" /> ETA 12 min</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-semibold">Linha do tempo da reserva</h3>
          <ol className="mt-6 relative border-l border-border ml-2 space-y-6">
            {steps.map((s) => (
              <li key={s.t} className="pl-6">
                <span
                  className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full ring-4 ring-card flex items-center justify-center ${
                    s.state === "done" ? "bg-success" : s.state === "active" ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                  }`}
                >
                  {s.state === "done" && <CheckCircle2 className="h-3 w-3 text-success-foreground" />}
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{s.t}</p>
                  <span className="text-xs text-muted-foreground">{s.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.who}</p>
                {s.state === "active" && (
                  <div className="mt-3 flex gap-2">
                    <button className="h-9 px-3 rounded-lg bg-gradient-hero text-xs font-medium text-primary-foreground shadow-elegant inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Marcar concluído
                    </button>
                    <button className="h-9 px-3 rounded-lg border border-border text-xs font-medium inline-flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5" /> Anexar foto
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-semibold">Status do equipamento</h3>
            <div className="mt-4 space-y-3">
              <Stat label="Temperatura" value="62°C" target="alvo 90°C" tone="primary" pct={68} />
              <Stat label="Nível de gás" value="15%" target="trocar hoje" tone="warning" pct={15} />
              <Stat label="Tempo restante" value="0:48" target="ligada às 17:45" tone="success" pct={50} />
            </div>
          </div>

          <div className="rounded-2xl border border-warning/40 bg-warning/5 p-5">
            <div className="flex items-center gap-2 text-warning-foreground">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-semibold">Alerta de gás</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Cilindro abaixo de 20%. Tarefa "Trocar gás" criada para o turno da noite.</p>
            <button className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Bell className="h-3.5 w-3.5" /> Ver tarefa</button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Checklist operacional</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                ["Verificar nível de gás", true],
                ["Limpar bancos e piso", true],
                ["Ligar sauna às 17:45", false],
                ["Conferir temperatura às 18:00", false],
                ["Desligar e arejar às 19:00", false],
              ].map(([t, done]) => (
                <li key={t as string} className="flex items-center gap-2.5">
                  <span className={`h-4 w-4 rounded-md border ${done ? "bg-success border-success" : "border-border"} flex items-center justify-center`}>
                    {done && <CheckCircle2 className="h-3 w-3 text-success-foreground" />}
                  </span>
                  <span className={done ? "line-through text-muted-foreground" : ""}>{t as string}</span>
                </li>
              ))}
            </ul>
            <button className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <MessageSquare className="h-3.5 w-3.5" /> Comentar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, target, tone, pct }: { label: string; value: string; target: string; tone: "primary" | "warning" | "success"; pct: number }) {
  const bar = { primary: "bg-primary", warning: "bg-warning", success: "bg-success" }[tone];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{target}</p>
    </div>
  );
}
