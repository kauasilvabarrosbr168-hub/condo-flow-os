import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Check, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/brand";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({ meta: [{ title: "Tarefas · CondoFlow" }] }),
  component: TasksPage,
});

function TasksPage() {
  const { condo, profile, user, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();
  const [scope, setScope] = useState<"mine" | "all">(isAdmin ? "all" : "mine");

  const { data: tasks, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["tasks", condoId, scope, user?.id],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*").eq("condo_id", condoId!).order("due_at", { ascending: true, nullsFirst: false });
      if (scope === "mine") q = q.eq("assignee_id", user!.id);
      const { data } = await q;
      return data ?? [];
    },
  });

  if (!condoId) return <div className="p-8"><EmptyState icon={ListChecks} title="Sem condomínio vinculado" description="Aguarde um convite." /></div>;

  const updateStatus = async (id: string, status: "pendente" | "em_andamento" | "concluida") => {
    const { error } = await supabase.from("tasks").update({ status, completed_at: status === "concluida" ? new Date().toISOString() : null }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["tasks"] }); }
  };

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas & checklist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Geradas automaticamente a partir das reservas e atribuídas aos funcionários.</p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
          {(["mine", "all"] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${scope === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "mine" ? "Minhas" : "Todas do condomínio"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (tasks?.length ?? 0) === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nenhuma tarefa por aqui"
          description="As tarefas aparecem automaticamente quando um morador cria uma reserva ou o síndico abre uma manutenção."
        />
      ) : (
        <ul className="space-y-2">
          {tasks!.map((t) => (
            <li key={t.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elegant transition">
              <button
                onClick={() => updateStatus(t.id, t.status === "concluida" ? "pendente" : "concluida")}
                className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border transition ${
                  t.status === "concluida" ? "bg-success border-success text-success-foreground" : "border-border hover:border-primary"
                }`}
              >
                {t.status === "concluida" && <Check className="h-3.5 w-3.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                  <Badge tone={kindTone(t.kind)}>{kindLabel(t.kind)}</Badge>
                  {t.status === "em_andamento" && <Badge tone="primary">Em andamento</Badge>}
                </div>
                {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                {t.due_at && (
                  <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(t.due_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              {t.status !== "concluida" && t.status !== "em_andamento" && (
                <button onClick={() => updateStatus(t.id, "em_andamento")} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted">Iniciar</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function kindLabel(k: string) {
  return ({ pre_checklist: "Pré-uso", pos_checklist: "Pós-uso", manutencao: "Manutenção", incidente: "Incidente" } as Record<string, string>)[k] ?? k;
}
function kindTone(k: string): "default" | "primary" | "warning" | "destructive" {
  if (k === "manutencao") return "warning";
  if (k === "incidente") return "destructive";
  return "primary";
}
