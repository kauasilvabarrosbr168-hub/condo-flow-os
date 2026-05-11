import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import { Plus, Filter, Search, Camera, MessageSquare, Clock, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/checklist")({
  head: () => ({ meta: [{ title: "Operações — CondoFlow" }] }),
  component: Checklist,
});

type Task = { id: string; title: string; assignee: string; due: string; priority: "alta" | "média" | "baixa"; freq?: string; late?: boolean };

const cols: { id: string; label: string; tone: "default" | "primary" | "warning" | "success"; tasks: Task[] }[] = [
  {
    id: "todo",
    label: "A fazer",
    tone: "default",
    tasks: [
      { id: "1", title: "Trocar cilindro de gás da sauna", assignee: "João P.", due: "Hoje 19h", priority: "alta", freq: "quinzenal" },
      { id: "2", title: "Limpar piscina", assignee: "Equipe", due: "Amanhã", priority: "média", freq: "semanal" },
      { id: "3", title: "Cortar grama do jardim", assignee: "Carlos R.", due: "Quinta", priority: "baixa", freq: "mensal" },
    ],
  },
  {
    id: "doing",
    label: "Em execução",
    tone: "primary",
    tasks: [
      { id: "4", title: "Manutenção elevador social", assignee: "Atlas Tec.", due: "Hoje", priority: "alta" },
      { id: "5", title: "Limpeza salão (pré-reserva 20h)", assignee: "Maria L.", due: "Hoje 18h", priority: "alta" },
    ],
  },
  {
    id: "late",
    label: "Atrasadas",
    tone: "warning",
    tasks: [
      { id: "6", title: "Verificar bombas de recalque", assignee: "João P.", due: "Atrasada 2d", priority: "alta", late: true, freq: "mensal" },
      { id: "7", title: "Trocar lâmpadas garagem G2", assignee: "Carlos R.", due: "Atrasada 1d", priority: "média", late: true },
    ],
  },
  {
    id: "done",
    label: "Concluídas",
    tone: "success",
    tasks: [
      { id: "8", title: "Inspeção câmeras de segurança", assignee: "Vigia Segura", due: "Ontem", priority: "média" },
      { id: "9", title: "Limpeza churrasqueira", assignee: "Maria L.", due: "Ontem", priority: "baixa" },
    ],
  },
];

const prioTone: Record<string, "destructive" | "warning" | "default"> = {
  alta: "destructive",
  média: "warning",
  baixa: "default",
};

function Checklist() {
  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Operação do condomínio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tarefas recorrentes, manutenção e limpeza — em um Kanban claro.</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-10 text-sm text-muted-foreground">
            <Search className="h-4 w-4" /> Buscar tarefa…
          </div>
          <button className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-card text-sm font-medium"><Filter className="h-4 w-4" /> Filtrar</button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant"><Plus className="h-4 w-4" /> Nova tarefa</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cols.map((c) => (
          <div key={c.id} className="rounded-2xl bg-muted/40 border border-border p-3">
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{c.label}</h3>
                <Badge tone={c.tone}>{c.tasks.length}</Badge>
              </div>
              <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-card"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2">
              {c.tasks.map((t) => (
                <div key={t.id} className="rounded-xl bg-card border border-border p-3.5 shadow-card hover:shadow-elegant transition cursor-grab">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    {t.late && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={prioTone[t.priority]}>{t.priority}</Badge>
                    {t.freq && <Badge>{t.freq}</Badge>}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" /> {t.due}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 rounded-full bg-gradient-hero text-[10px] font-semibold text-primary-foreground items-center justify-center">
                        {t.assignee.split(" ").map((n) => n[0]).join("")}
                      </span>
                      {t.assignee}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2 text-muted-foreground">
                    <button className="inline-flex items-center gap-1 text-[11px] hover:text-foreground"><Camera className="h-3 w-3" /> 2</button>
                    <button className="inline-flex items-center gap-1 text-[11px] hover:text-foreground"><MessageSquare className="h-3 w-3" /> 1</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
