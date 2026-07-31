// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ListChecks, Check, Loader2, Clock, Plus, Sparkles,
  X, AlertTriangle, ChevronDown, Brain, Bell, ThumbsUp, ThumbsDown, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/brand";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { dispatchAIEvent } from "@/lib/ai-engine/dispatcher.functions";
import { createWorkerTask, generateAITasks, listCondoCollaborators } from "@/lib/worker-tasks.functions";
import { approveAiProposal, rejectAiProposal } from "@/lib/ai-context.functions";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({ meta: [{ title: "Tarefas · CondoFlow" }] }),
  component: TasksPage,
});

type Task = {
  id: string; title: string | null; description: string | null;
  due_at: string | null; status: string | null; kind: string | null;
  urgency: string; ai_generated: boolean; notify_immediately: boolean;
  assignee_id: string | null;
};

type Proposal = {
  id: string; title: string; description: string | null;
  kind: string; urgency: string; ai_reasoning: string | null;
  due_at: string | null; status: string; created_at: string;
};

type Worker = { id: string; full_name: string | null; email: string | null };

const URGENCY_STYLE: Record<string, { label: string; bar: string; badge: string }> = {
  urgente: { label: "Urgente",  bar: "bg-destructive", badge: "text-destructive bg-destructive/10 border-destructive/30" },
  normal:  { label: "Normal",   bar: "bg-primary",     badge: "text-primary bg-primary/10 border-primary/30" },
  baixa:   { label: "Baixa",    bar: "bg-muted-foreground/40", badge: "text-muted-foreground bg-muted border-border" },
};

function TasksPage() {
  const { condo, profile, user, isAdmin, primaryRole } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();
  const isSindico = isAdmin;
  const isWorker  = primaryRole === "funcionario";
  const [scope, setScope]          = useState<"mine" | "all" | "ai">(isSindico ? "all" : "mine");
  const [mainTab, setMainTab]      = useState<"tarefas" | "propostas">("tarefas");
  const [newOpen, setNewOpen]      = useState(false);
  const [aiBusy, setAiBusy]        = useState(false);
  const [reviewingId, setReviewing] = useState<string | null>(null);

  const dispatchFn    = useServerFn(dispatchAIEvent);
  const createTaskFn  = useServerFn(createWorkerTask);
  const generateAIFn  = useServerFn(generateAITasks);
  const listWorkersFn = useServerFn(listCondoCollaborators);
  const approveFn     = useServerFn(approveAiProposal);
  const rejectFn      = useServerFn(rejectAiProposal);

  const { data: workers } = useQuery({
    enabled: !!condoId && isSindico,
    queryKey: ["workers", condoId],
    queryFn: () => listWorkersFn({ data: { condoId: condoId! } }) as Promise<Worker[]>,
  });

  const { data: proposals, refetch: refetchProposals } = useQuery({
    enabled: !!condoId && isSindico,
    queryKey: ["ai_proposals", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_task_proposals")
        .select("id,title,description,kind,urgency,ai_reasoning,due_at,status,created_at")
        .eq("condo_id", condoId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return (data ?? []) as Proposal[];
    },
  });

  const { data: tasks, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["tasks", condoId, scope, user?.id],
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select("id, title, description, due_at, status, kind, urgency, ai_generated, notify_immediately, assignee_id")
        .eq("condo_id", condoId!)
        .order("urgency", { ascending: false }) // urgente primeiro (ordem: urgente > normal > baixa)
        .order("due_at", { ascending: true, nullsFirst: false });

      if (scope === "mine")  q = q.eq("assignee_id", user!.id);
      if (scope === "ai")    q = q.eq("ai_generated", true);
      const { data } = await q;
      return (data ?? []) as Task[];
    },
  });

  // Realtime — notifica colaborador quando nova tarefa urgente chegar
  const shownIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!condoId) return;
    const ch = supabase
      .channel(`tasks-rt-${condoId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks", filter: `condo_id=eq.${condoId}` }, (payload) => {
        const t = payload.new as Task;
        if (shownIds.current.has(t.id)) return;
        shownIds.current.add(t.id);
        qc.invalidateQueries({ queryKey: ["tasks"] });
        if (t.notify_immediately || t.urgency === "urgente") {
          toast(`🔔 Nova tarefa urgente: ${t.title}`, {
            description: t.description ?? undefined,
            duration: 8000,
            action: { label: "Ver", onClick: () => setScope(isWorker ? "mine" : "all") },
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [condoId, isWorker, qc]);

  const updateStatus = async (t: Task, status: "pendente" | "em_andamento" | "concluida") => {
    const { error } = await supabase.from("tasks").update({
      status,
      completed_at: status === "concluida" ? new Date().toISOString() : null,
    }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "concluida" ? "Tarefa concluída!" : "Atualizado");
    qc.invalidateQueries({ queryKey: ["tasks"] });
    void dispatchFn({ data: {
      condoId: condoId!,
      eventType: "task_status_changed",
      entityType: "task",
      entityId: t.id,
      context: { title: t.title ?? "tarefa", newStatus: status, wasOverdue: t.due_at ? new Date(t.due_at) < new Date() : false },
    } });
  };

  const handleGenerateAI = async () => {
    if (!condoId) return;
    setAiBusy(true);
    try {
      const result = await generateAIFn({ data: { condoId } });
      if (result.created === 0) {
        toast.info("A IA não identificou novas tarefas necessárias no momento.");
      } else {
        toast.success(`${result.created} sugestão${result.created > 1 ? "ões" : ""} da IA aguardando sua aprovação!`);
        refetchProposals();
        setMainTab("propostas");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar sugestões com IA");
    } finally {
      setAiBusy(false);
    }
  };

  const handleApprove = async (p: Proposal) => {
    setReviewing(p.id);
    try {
      await approveFn({ data: { proposalId: p.id } });
      toast.success("Tarefa aprovada e criada para o colaborador!");
      refetchProposals();
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao aprovar sugestão");
    } finally {
      setReviewing(null);
    }
  };

  const handleReject = async (p: Proposal) => {
    setReviewing(p.id);
    try {
      await rejectFn({ data: { proposalId: p.id } });
      toast.info("Sugestão rejeitada.");
      refetchProposals();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao rejeitar sugestão");
    } finally {
      setReviewing(null);
    }
  };

  if (!condoId) return (
    <div className="p-8">
      <EmptyState icon={ListChecks} title="Sem condomínio vinculado" description="Aguarde um convite." />
    </div>
  );

  const active    = (tasks ?? []).filter((t) => t.status !== "concluida");
  const done      = (tasks ?? []).filter((t) => t.status === "concluida");
  const [tab, setTab] = useState<"ativas" | "concluidas">("ativas");
  const visible   = tab === "ativas" ? active : done;

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas do colaborador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSindico
              ? "Crie tarefas avulsas, gere com IA e acompanhe o trabalho do colaborador."
              : "Suas tarefas atribuídas. Tarefas urgentes chegam em tempo real."}
          </p>
        </div>
        {isSindico && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleGenerateAI}
              disabled={aiBusy}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60 transition"
            >
              {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
              Gerar com IA
            </button>
            <button
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground hover:opacity-95 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Nova tarefa
            </button>
          </div>
        )}
      </div>

      {/* Abas principais */}
      {isSindico && (
        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
          <button onClick={() => setMainTab("tarefas")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${mainTab === "tarefas" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            Tarefas
          </button>
          <button onClick={() => setMainTab("propostas")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${mainTab === "propostas" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
            <Sparkles className="h-3 w-3" />
            Propostas da IA
            {(proposals?.length ?? 0) > 0 && (
              <span className={`h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${mainTab === "propostas" ? "bg-background text-foreground" : "bg-primary text-primary-foreground"}`}>
                {proposals!.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Filtros de escopo (só na aba tarefas) */}
      {mainTab === "tarefas" && (
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
          {(isSindico
            ? [{ k: "all", l: "Todas" }, { k: "mine", l: "Atribuídas a mim" }, { k: "ai", l: "Geradas por IA" }]
            : [{ k: "mine", l: "Minhas" }, { k: "all", l: "Todas" }]
          ).map(({ k, l }) => (
            <button key={k} onClick={() => setScope(k as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${scope === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
          {(["ativas", "concluidas"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "ativas" ? `Ativas ${active.length > 0 ? `(${active.length})` : ""}` : "Concluídas"}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Aba: Propostas da IA */}
      {mainTab === "propostas" && isSindico && (
        <div className="space-y-3">
          {(proposals?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Brain}
              title="Nenhuma proposta pendente"
              description={'Clique em "Gerar com IA" para que a IA analise a rotina do condomínio e sugira tarefas para sua aprovação.'}
            />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                A IA sugeriu {proposals!.length} tarefa{proposals!.length !== 1 ? "s" : ""}. Revise e aprove ou rejeite cada uma antes que ela seja criada para o colaborador.
              </p>
              <ul className="space-y-3">
                {proposals!.map((p) => {
                  const isBusy = reviewingId === p.id;
                  const urgStyle = URGENCY_STYLE[p.urgency] ?? URGENCY_STYLE.normal;
                  return (
                    <li key={p.id} className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                      <div className="flex items-stretch gap-0">
                        <div className={`w-1 shrink-0 ${urgStyle.bar}`} />
                        <div className="flex-1 p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold">{p.title}</p>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${urgStyle.badge}`}>
                                  {p.urgency === "urgente" && <AlertTriangle className="h-2.5 w-2.5" />}
                                  {urgStyle.label}
                                </span>
                                <Badge tone={kindTone(p.kind)}>{kindLabel(p.kind)}</Badge>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-violet-300/40 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-medium">
                                  <Sparkles className="h-2.5 w-2.5" /> IA
                                </span>
                              </div>
                              {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                              {p.due_at && (
                                <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Prazo: {new Date(p.due_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                          </div>
                          {p.ai_reasoning && (
                            <div className="rounded-lg border border-violet-300/30 bg-violet-500/5 px-3 py-2 flex items-start gap-2">
                              <MessageSquare className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-violet-700 dark:text-violet-300 italic">{p.ai_reasoning}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleApprove(p)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition"
                            >
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                              Aprovar e criar tarefa
                            </button>
                            <button
                              onClick={() => handleReject(p)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 disabled:opacity-60 transition"
                            >
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Lista de tarefas (aba padrão) */}
      {mainTab === "tarefas" && (isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={tab === "ativas" ? "Nenhuma tarefa ativa" : "Nenhuma tarefa concluída"}
          description={
            tab === "ativas" && isSindico
              ? "Clique em \"Gerar com IA\" para criar sugestões, ou em \"Nova tarefa\" para adicionar manualmente."
              : "As tarefas aparecem automaticamente conforme as reservas e o síndico criar."
          }
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((t) => {
            const urgStyle = URGENCY_STYLE[t.urgency] ?? URGENCY_STYLE.normal;
            const isUrgent = t.urgency === "urgente";
            return (
              <li key={t.id} className={`flex items-stretch gap-0 rounded-xl border bg-card shadow-card hover:shadow-elegant transition overflow-hidden ${isUrgent ? "border-destructive/40" : "border-border"}`}>
                {/* Barra lateral de urgência */}
                <div className={`w-1 shrink-0 ${urgStyle.bar}`} />
                <div className="flex items-start gap-3 p-4 flex-1 min-w-0">
                  {/* Checkbox */}
                  <button
                    onClick={() => updateStatus(t, t.status === "concluida" ? "pendente" : "concluida")}
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                      t.status === "concluida" ? "bg-success border-success text-success-foreground" : "border-border hover:border-primary"
                    }`}
                  >
                    {t.status === "concluida" && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                        {t.title}
                      </p>
                      {/* Urgência */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${urgStyle.badge}`}>
                        {isUrgent && <AlertTriangle className="h-2.5 w-2.5" />}
                        {urgStyle.label}
                      </span>
                      {/* Tipo */}
                      <Badge tone={kindTone(t.kind ?? "")}>{kindLabel(t.kind ?? "")}</Badge>
                      {/* IA */}
                      {t.ai_generated && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-violet-300/40 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-medium">
                          <Sparkles className="h-2.5 w-2.5" /> IA
                        </span>
                      )}
                      {/* Notificação imediata */}
                      {t.notify_immediately && t.status === "pendente" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-destructive animate-pulse">
                          <Bell className="h-2.5 w-2.5" /> Notificado
                        </span>
                      )}
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                    {t.due_at && (
                      <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(t.due_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {new Date(t.due_at) < new Date() && t.status !== "concluida" && (
                          <span className="text-destructive font-medium ml-1">— Atrasada</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Ações */}
                  {t.status !== "concluida" && (
                    <div className="flex gap-1 shrink-0">
                      {t.status !== "em_andamento" && (
                        <button
                          onClick={() => updateStatus(t, "em_andamento")}
                          className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted transition"
                        >
                          Iniciar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ))}

      {/* Dialog nova tarefa */}
      {newOpen && condoId && (
        <NewTaskDialog
          condoId={condoId}
          workers={workers ?? []}
          createFn={createTaskFn}
          dispatchFn={dispatchFn}
          onClose={() => setNewOpen(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ["tasks"] }); setNewOpen(false); }}
        />
      )}
    </div>
  );
}

// ─── Dialog nova tarefa (síndico) ─────────────────────────────────────────────

function NewTaskDialog({ condoId, workers, createFn, dispatchFn, onClose, onCreated }: {
  condoId: string;
  workers: Worker[];
  createFn: (a: any) => Promise<{ id: string }>;
  dispatchFn: (a: any) => Promise<any>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle]         = useState("");
  const [description, setDesc]    = useState("");
  const [kind, setKind]           = useState("manutencao");
  const [urgency, setUrgency]     = useState("normal");
  const [assigneeId, setAssignee] = useState("");
  const [dueAt, setDueAt]         = useState("");
  const [busy, setBusy]           = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const result = await createFn({ data: {
        condoId,
        title: title.trim(),
        description: description.trim() || null,
        kind,
        urgency,
        assigneeId: assigneeId || null,
        dueAt: dueAt || null,
      } });
      toast.success(
        urgency === "urgente"
          ? "Tarefa urgente criada — colaborador notificado!"
          : "Tarefa criada com sucesso!"
      );
      void dispatchFn({ data: {
        condoId, eventType: "task_created", entityType: "task", entityId: result.id,
        context: { title: title.trim(), kind, urgency },
      } });
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elegant animate-pop">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Nova tarefa para colaborador</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tarefas urgentes notificam o colaborador imediatamente.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Urgência — destaque visual */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Urgência</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["baixa", "normal", "urgente"] as const).map((u) => (
                <button
                  key={u} type="button" onClick={() => setUrgency(u)}
                  className={`h-10 rounded-lg border text-xs font-medium transition capitalize ${
                    urgency === u
                      ? u === "urgente" ? "border-destructive bg-destructive/10 text-destructive"
                        : u === "normal" ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {u === "urgente" && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </button>
              ))}
            </div>
            {urgency === "urgente" && (
              <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                <Bell className="h-3 w-3" /> O colaborador receberá notificação imediata no app.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Título da tarefa *</label>
            <input required value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Verificar bomba da piscina, Limpar área gourmet…"
              className={inputCls + " mt-1"} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição / detalhes</label>
            <textarea value={description} maxLength={500} onChange={(e) => setDesc(e.target.value)}
              rows={2} placeholder="O que exatamente precisa ser feito? Onde? Com o quê?"
              className={inputCls + " mt-1 py-2 resize-none h-auto"} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls + " mt-1"}>
                <option value="manutencao">Manutenção</option>
                <option value="limpeza">Limpeza</option>
                <option value="verificacao">Verificação</option>
                <option value="pre_checklist">Pré-uso</option>
                <option value="pos_checklist">Pós-uso</option>
                <option value="incidente">Incidente</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prazo</label>
              <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputCls + " mt-1"} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Atribuir a</label>
            <select value={assigneeId} onChange={(e) => setAssignee(e.target.value)} className={inputCls + " mt-1"}>
              <option value="">— Sem atribuição específica —</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>{w.full_name ?? w.email ?? w.id}</option>
              ))}
            </select>
            {workers.length === 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">Cadastre um funcionário na equipe para atribuir.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={busy}
            className={`inline-flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60 transition ${urgency === "urgente" ? "bg-destructive" : "bg-gradient-hero"}`}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : urgency === "urgente" ? <Bell className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {urgency === "urgente" ? "Criar e notificar agora" : "Criar tarefa"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kindLabel(k: string) {
  return ({
    pre_checklist: "Pré-uso", pos_checklist: "Pós-uso",
    manutencao: "Manutenção", incidente: "Incidente",
    limpeza: "Limpeza", verificacao: "Verificação",
  } as Record<string, string>)[k] ?? k;
}
function kindTone(k: string): "default" | "primary" | "warning" | "destructive" {
  if (k === "manutencao" || k === "verificacao") return "warning";
  if (k === "incidente") return "destructive";
  return "primary";
}
