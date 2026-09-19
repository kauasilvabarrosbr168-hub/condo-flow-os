import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck, Loader2, Camera, CheckCircle2, X, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { dispatchAIEvent } from "@/lib/ai-engine/dispatcher.functions";
import { getCleaningData, createCleaningRequest, updateCleaningRequestStatus } from "@/lib/cleaning.functions";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/brand";
import { toast } from "sonner";

const formatCents = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CLEAN_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  done: "Concluído",
  cancelled: "Cancelado",
};
const CLEAN_STATUS_TONE: Record<string, "warning" | "primary" | "success" | "default"> = {
  pending: "warning",
  accepted: "primary",
  done: "success",
  cancelled: "default",
};

type CleaningRequest = {
  id: string;
  requested_by: string;
  worker_id: string | null;
  unit_label: string | null;
  notes: string | null;
  status: "pending" | "accepted" | "done" | "cancelled";
  price_cents: number;
  scheduled_at: string | null;
  done_at: string | null;
  created_at: string;
  requester: { full_name: string; unit_label: string | null } | null;
  worker: { full_name: string } | null;
  is_mine: boolean;
};

export const Route = createFileRoute("/app/services")({
  head: () => ({ meta: [{ title: "Serviços · CondoFlow" }] }),
  component: ServicesPage,
});

type Task = { id: string; title: string | null; description: string | null; due_at: string | null; status: string | null };
type Log = { id: string; title: string; notes: string | null; photo_url: string | null; done_at: string; worker_id: string };

function ServicesPage() {
  const { profile, condo, primaryRole, user, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const isWorker = primaryRole === "funcionario";
  const dispatchFn = useServerFn(dispatchAIEvent);
  const fetchCleaningFn = useServerFn(getCleaningData);
  const createCleaningFn = useServerFn(createCleaningRequest);
  const setCleaningStatusFn = useServerFn(updateCleaningRequestStatus);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [checkin, setCheckin] = useState<{ taskId?: string; title: string } | null>(null);
  const [freeTitle, setFreeTitle] = useState("");

  const [cleaningEnabled, setCleaningEnabled] = useState(false);
  const [cleaningPriceCents, setCleaningPriceCents] = useState(0);
  const [cleaningRequests, setCleaningRequests] = useState<CleaningRequest[] | null>(null);
  const [cleanNotes, setCleanNotes] = useState("");
  const [cleanScheduledAt, setCleanScheduledAt] = useState("");
  const [requestingClean, setRequestingClean] = useState(false);
  const [cleanBusyId, setCleanBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!condoId) return;
    const tq = supabase.from("tasks").select("id, title, description, due_at, status").eq("condo_id", condoId).neq("status", "concluida").order("due_at", { ascending: true });
    if (isWorker && user) tq.or(`assignee_id.eq.${user.id},assignee_id.is.null`);
    const [{ data: t }, { data: l }] = await Promise.all([
      tq,
      supabase.from("service_logs").select("id, title, notes, photo_url, done_at, worker_id").eq("condo_id", condoId).order("done_at", { ascending: false }).limit(50),
    ]);
    setTasks(t ?? []);
    setLogs(l ?? []);
  }, [condoId, isWorker, user]);

  const loadCleaning = useCallback(async () => {
    if (!condoId) return;
    try {
      const r = await fetchCleaningFn({ data: { condoId } });
      setCleaningEnabled(!!r.config?.internal_enabled);
      setCleaningPriceCents(r.config?.price_cents ?? 0);
      setCleaningRequests(r.requests as CleaningRequest[]);
    } catch {
      setCleaningRequests([]);
    }
  }, [condoId, fetchCleaningFn]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCleaning(); }, [loadCleaning]);

  const submitCleaningRequest = async () => {
    if (!condoId) return;
    setRequestingClean(true);
    try {
      await createCleaningFn({
        data: {
          condoId,
          notes: cleanNotes.trim() || null,
          scheduledAt: cleanScheduledAt ? new Date(cleanScheduledAt).toISOString() : null,
        },
      });
      toast.success("Limpeza solicitada!");
      setCleanNotes("");
      setCleanScheduledAt("");
      await loadCleaning();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao solicitar limpeza");
    } finally {
      setRequestingClean(false);
    }
  };

  const changeCleaningStatus = async (requestId: string, status: "accepted" | "done" | "cancelled") => {
    setCleanBusyId(requestId);
    try {
      await setCleaningStatusFn({ data: { requestId, status } });
      await loadCleaning();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar pedido");
    } finally {
      setCleanBusyId(null);
    }
  };

  if (!condoId) {
    return <div className="p-8"><EmptyState icon={ClipboardCheck} title="Sem condomínio" description="Vincule-se a um condomínio para ver serviços." /></div>;
  }

  return (
    <div className="px-4 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isWorker ? "Marque o que você concluiu — síndico e administração serão notificados." : "Tarefas em aberto e histórico de check-ins dos colaboradores."}
        </p>
      </div>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-sm font-semibold">Tarefas em aberto</h2>
          {isWorker && (
            <div className="flex items-center gap-2">
              <Input placeholder="Outro serviço executado…" value={freeTitle} onChange={(e) => setFreeTitle(e.target.value)} className="w-64" />
              <Button size="sm" onClick={() => { if (freeTitle.trim()) { setCheckin({ title: freeTitle.trim() }); setFreeTitle(""); } }}>
                <CheckCircle2 className="h-4 w-4" /> Registrar
              </Button>
            </div>
          )}
        </div>
        {!tasks ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">Nenhuma tarefa pendente.</p>
        ) : (
          <div className="grid gap-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-card transition">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.description && <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>}
                  {t.due_at && <p className="text-[11px] text-muted-foreground mt-0.5">Até {new Date(t.due_at).toLocaleString("pt-BR")}</p>}
                </div>
                {isWorker && (
                  <Button size="sm" onClick={() => setCheckin({ taskId: t.id, title: t.title ?? "" })}>
                    <CheckCircle2 className="h-4 w-4" /> Concluir
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {cleaningEnabled && (
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Limpeza</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isWorker
                ? "Pedidos de limpeza que moradores fizeram pelo app."
                : `Peça uma limpeza pra um colaborador do condomínio${cleaningPriceCents > 0 ? ` — ${formatCents(cleaningPriceCents)}` : ""}.`}
            </p>
          </div>

          {!isWorker && (
            <div className="rounded-xl border border-border bg-card p-4 mb-3 space-y-3">
              <Textarea rows={2} value={cleanNotes} onChange={(e) => setCleanNotes(e.target.value)} placeholder="Alguma observação? (opcional)" />
              <div className="flex flex-wrap items-center gap-2">
                <Input type="datetime-local" value={cleanScheduledAt} onChange={(e) => setCleanScheduledAt(e.target.value)} className="w-56" />
                <Button size="sm" onClick={submitCleaningRequest} disabled={requestingClean}>
                  {requestingClean ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Solicitar limpeza
                </Button>
              </div>
            </div>
          )}

          {!cleaningRequests ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (() => {
            const visible = isWorker ? cleaningRequests : cleaningRequests.filter((r) => r.is_mine);
            if (visible.length === 0) {
              return <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">{isWorker ? "Nenhum pedido de limpeza ainda." : "Você ainda não pediu nenhuma limpeza."}</p>;
            }
            return (
              <div className="grid gap-2">
                {visible.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isWorker && <p className="text-sm font-medium">{r.requester?.full_name ?? "Morador"}{r.unit_label ? ` · ${r.unit_label}` : ""}</p>}
                        <Badge tone={CLEAN_STATUS_TONE[r.status]}>{CLEAN_STATUS_LABEL[r.status]}</Badge>
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.notes}</p>}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {r.scheduled_at ? `Agendado para ${new Date(r.scheduled_at).toLocaleString("pt-BR")}` : `Pedido em ${new Date(r.created_at).toLocaleString("pt-BR")}`}
                      </p>
                    </div>
                    {isWorker && r.status === "pending" && (
                      <Button size="sm" disabled={cleanBusyId === r.id} onClick={() => changeCleaningStatus(r.id, "accepted")}>
                        {cleanBusyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aceitar"}
                      </Button>
                    )}
                    {isWorker && r.status === "accepted" && (
                      <Button size="sm" disabled={cleanBusyId === r.id} onClick={() => changeCleaningStatus(r.id, "done")}>
                        {cleanBusyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Concluir</>}
                      </Button>
                    )}
                    {!isWorker && r.is_mine && r.status === "pending" && (
                      <Button size="sm" variant="outline" disabled={cleanBusyId === r.id} onClick={() => changeCleaningStatus(r.id, "cancelled")}>
                        {cleanBusyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold">{isWorker ? "Meus check-ins" : "Histórico de manutenção"}</h2>
          {!isWorker && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Registro permanente de tudo que já foi concluído (tarefas e check-ins). Ninguém — nem síndico, nem colaborador — pode apagar um item daqui.
            </p>
          )}
        </div>
        {!logs ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">Nenhum registro ainda.</p>
        ) : (
          <div className="grid gap-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                {l.photo_url && <img src={l.photo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.title}</p>
                  {l.notes && <p className="text-xs text-muted-foreground mt-0.5">{l.notes}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(l.done_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {checkin && condoId && user && (
        <CheckInDialog
          condoId={condoId}
          userId={user.id}
          workerName={profile?.full_name ?? "Colaborador"}
          init={checkin}
          onClose={() => setCheckin(null)}
          onDone={async () => { await load(); setCheckin(null); }}
          dispatchFn={dispatchFn}
        />
      )}
    </div>
  );
}

function CheckInDialog({ condoId, userId, workerName, init, onClose, onDone, dispatchFn }: { condoId: string; userId: string; workerName: string; init: { taskId?: string; title: string }; onClose: () => void; onDone: () => void | Promise<void>; dispatchFn: (a: any) => Promise<any> }) {
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${condoId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("condo-areas").upload(path, file);
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("condo-areas").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
  };

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.from("service_logs").insert({
      condo_id: condoId,
      worker_id: userId,
      task_id: init.taskId ?? null,
      title: init.title,
      notes: notes.trim() || null,
      photo_url: photoUrl,
    });
    if (!error && init.taskId) {
      await supabase.from("tasks").update({ status: "concluida", completed_at: new Date().toISOString() }).eq("id", init.taskId);
    }
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Serviço registrado");
    void dispatchFn({ data: { condoId, eventType: "service_completed", entityType: "service_log", entityId: init.taskId ?? "free", context: { taskTitle: init.title, workerName, notes: notes.trim() || null } } });
    await onDone();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar conclusão</DialogTitle></DialogHeader>
        <p className="text-sm font-medium">{init.title}</p>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Observações</span>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="O que foi feito? Algum problema encontrado?" />
          </label>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Foto (opcional)</span>
            <div className="mt-1.5">
              {photoUrl ? (
                <div className="relative inline-block">
                  <img src={photoUrl} alt="" className="h-32 rounded-lg object-cover" />
                  <button onClick={() => setPhotoUrl(null)} className="absolute top-1 right-1 h-6 w-6 rounded-md bg-background/90 inline-flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition text-sm text-muted-foreground">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Anexar foto
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
                </label>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
