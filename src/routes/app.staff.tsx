import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import { CheckCircle2, Camera, Clock, AlertTriangle, MapPin } from "lucide-react";

export const Route = createFileRoute("/app/staff")({
  head: () => ({ meta: [{ title: "Funcionários — CondoFlow" }] }),
  component: Staff,
});

const staff = [
  { name: "João Pereira", role: "Manutenção", status: "online", tasksDone: 4, tasksTotal: 6 },
  { name: "Maria Lima", role: "Limpeza", status: "online", tasksDone: 7, tasksTotal: 8 },
  { name: "Carlos Reis", role: "Jardinagem", status: "ausente", tasksDone: 2, tasksTotal: 3 },
  { name: "Ana Silva", role: "Portaria", status: "online", tasksDone: 5, tasksTotal: 5 },
];

const tasks = [
  { t: "Ligar sauna às 17:45", who: "João P.", time: "em 12 min", urgent: true, area: "Sauna" },
  { t: "Limpeza pré-reserva salão", who: "Maria L.", time: "18:00", urgent: true, area: "Salão" },
  { t: "Trocar lâmpadas garagem G2", who: "João P.", time: "Hoje", urgent: false, area: "Garagem" },
  { t: "Inspeção do gerador", who: "Carlos R.", time: "Quinta", urgent: false, area: "Casa de máquinas" },
];

function Staff() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Painel dos funcionários</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tarefas do dia, execução guiada e comprovação por foto.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Team */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-semibold">Equipe ativa</h3>
          <ul className="mt-4 space-y-3">
            {staff.map((s) => (
              <li key={s.name} className="flex items-center gap-3">
                <span className="relative h-10 w-10 rounded-full bg-gradient-hero text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">
                  {s.name.split(" ").map((n) => n[0]).join("")}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card ${s.status === "online" ? "bg-success" : "bg-muted-foreground"}`} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{s.tasksDone}/{s.tasksTotal}</p>
                  <p className="text-[10px] text-muted-foreground">tarefas hoje</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tarefas do dia</h3>
            <Badge tone="primary">{tasks.length} ativas</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {tasks.map((t) => (
              <div key={t.t} className={`rounded-xl border p-4 flex flex-wrap items-center gap-4 ${t.urgent ? "border-warning/40 bg-warning/5" : "border-border bg-card"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.urgent && <Badge tone="warning"><AlertTriangle className="h-3 w-3" /> urgente</Badge>}
                    <p className="text-sm font-medium">{t.t}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.area}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {t.time}</span>
                    <span>· {t.who}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="h-9 px-3 rounded-lg border border-border text-xs font-medium inline-flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Foto</button>
                  <button className="h-9 px-3 rounded-lg bg-gradient-hero text-xs font-medium text-primary-foreground shadow-elegant inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Concluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
