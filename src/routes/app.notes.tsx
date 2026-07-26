// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  StickyNote, Plus, Trash2, Check, AlarmClock, CheckCheck, Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notes")({
  head: () => ({ meta: [{ title: "Anotações · CondoFlow" }] }),
  component: NotesPage,
});

type WorkerNote = {
  id: string;
  content: string;
  remind_at: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

function NotesPage() {
  const { profile, condo, user } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const userId  = user?.id;

  const [notes,       setNotes]       = useState<WorkerNote[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [content,     setContent]     = useState("");
  const [remindAmt,   setRemindAmt]   = useState("30");
  const [remindUnit,  setRemindUnit]  = useState<"seconds" | "minutes" | "hours">("minutes");
  const [useReminder, setUseReminder] = useState(false);
  const [saving,      setSaving]      = useState(false);

  const fetchNotes = async () => {
    if (!userId || !condoId) return;
    const { data } = await supabase
      .from("worker_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("condo_id", condoId)
      .order("created_at", { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [userId, condoId]);

  const calcRemindAt = (): string | null => {
    if (!useReminder) return null;
    const amt = Math.max(1, parseInt(remindAmt) || 1);
    const ms  = amt * (remindUnit === "seconds" ? 1_000 : remindUnit === "minutes" ? 60_000 : 3_600_000);
    return new Date(Date.now() + ms).toISOString();
  };

  const save = async () => {
    if (!content.trim() || !userId || !condoId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("worker_notes")
        .insert({ user_id: userId, condo_id: condoId, content: content.trim(), remind_at: calcRemindAt() })
        .select()
        .single();
      if (error) throw error;
      setNotes((prev) => [data, ...prev]);
      setContent(""); setRemindAmt("30"); setUseReminder(false);
      toast.success("Anotação salva!");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const setCompleted = async (note: WorkerNote, done: boolean) => {
    const { data, error } = await supabase
      .from("worker_notes")
      .update({ completed: done, completed_at: done ? new Date().toISOString() : null })
      .eq("id", note.id)
      .select().single();
    if (!error && data) {
      setNotes((prev) => prev.map((n) => n.id === note.id ? data : n));
      toast.success(done ? "Marcada como cumprida!" : "Reaberta");
    }
  };

  const snooze = async (note: WorkerNote, hours: number) => {
    const newAt = new Date(Date.now() + hours * 3_600_000).toISOString();
    const { data, error } = await supabase
      .from("worker_notes")
      .update({ remind_at: newAt })
      .eq("id", note.id)
      .select().single();
    if (!error && data) {
      setNotes((prev) => prev.map((n) => n.id === note.id ? data : n));
      toast.success(`Lembrete adiado para ${hours}h`);
    }
  };

  const remove = async (id: string) => {
    await supabase.from("worker_notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Anotação removida");
  };

  const now            = new Date();
  const dueReminders   = notes.filter((n) => !n.completed && n.remind_at && new Date(n.remind_at) <= now);
  const pending        = notes.filter((n) => !n.completed && (!n.remind_at || new Date(n.remind_at) > now));
  const completed      = notes.filter((n) => n.completed);
  const isEmpty        = !loading && dueReminders.length === 0 && pending.length === 0 && completed.length === 0;

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Anotações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registre lembretes para não esquecer nada durante o turno.</p>
      </div>

      {/* Formulário nova anotação */}
      <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Nova anotação
        </h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save(); }}
          placeholder="O que você quer anotar ou lembrar?"
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-ring/40 transition"
        />

        {/* Toggle lembrete */}
        <button
          type="button"
          onClick={() => setUseReminder((v) => !v)}
          className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-medium transition ${
            useReminder
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          <AlarmClock className="h-3.5 w-3.5" />
          {useReminder ? "Lembrete ativado" : "Adicionar lembrete"}
        </button>

        {useReminder && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
            <Bell className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground">Lembrar em</span>
            <input
              type="number" min="1" value={remindAmt}
              onChange={(e) => setRemindAmt(e.target.value)}
              className="w-20 h-8 rounded-lg border border-input bg-background px-2 text-sm text-center outline-none focus:ring-2 focus:ring-ring/40"
            />
            <select
              value={remindUnit}
              onChange={(e) => setRemindUnit(e.target.value as any)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
            >
              <option value="seconds">segundos</option>
              <option value="minutes">minutos</option>
              <option value="hours">horas</option>
            </select>
          </div>
        )}

        <button
          onClick={save}
          disabled={!content.trim() || saving}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-hero text-primary-foreground text-sm font-medium shadow-elegant hover:opacity-95 transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Salvando…" : "Salvar anotação"}
        </button>
      </div>

      {/* Lembretes vencidos — destaque */}
      {dueReminders.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 animate-pulse" />
            Lembretes para agora ({dueReminders.length})
          </h2>
          <div className="space-y-3">
            {dueReminders.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isDue
                onComplete={() => setCompleted(note, true)}
                onSnooze={(h) => snooze(note, h)}
                onRemove={() => remove(note.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pendentes */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pendentes ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onComplete={() => setCompleted(note, true)}
                onRemove={() => remove(note.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Estado vazio */}
      {isEmpty && (
        <EmptyState
          icon={StickyNote}
          title="Nenhuma anotação ainda"
          description="Use o formulário acima para criar sua primeira anotação ou lembrete."
        />
      )}

      {/* Concluídas */}
      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Concluídas ({completed.length})
          </h2>
          <div className="space-y-2">
            {completed.slice(0, 15).map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isCompleted
                onUndo={() => setCompleted(note, false)}
                onRemove={() => remove(note.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function NoteCard({
  note, isDue, isCompleted,
  onComplete, onUndo, onSnooze, onRemove,
}: {
  note: WorkerNote;
  isDue?: boolean;
  isCompleted?: boolean;
  onComplete?: () => void;
  onUndo?: () => void;
  onSnooze?: (hours: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className={`rounded-xl border p-4 transition ${
      isDue
        ? "border-destructive/50 bg-destructive/5 shadow-sm"
        : isCompleted
        ? "border-border/40 bg-muted/20 opacity-60"
        : "border-border bg-card"
    }`}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        {isCompleted ? (
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-success/50 bg-success/15">
            <Check className="h-3 w-3 text-success" />
          </span>
        ) : (
          <button
            onClick={onComplete}
            className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 hover:border-success hover:bg-success/10 transition"
            title="Marcar como cumprida"
          />
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${isCompleted ? "line-through text-muted-foreground" : "font-medium"}`}>
            {note.content}
          </p>
          {note.remind_at && !isCompleted && (
            <p className={`mt-1 text-[11px] flex items-center gap-1 ${isDue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              <AlarmClock className="h-3 w-3 shrink-0" />
              {isDue ? "Venceu em " : "Lembrete: "}{fmtDate(note.remind_at)}
            </p>
          )}
          {note.completed_at && (
            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCheck className="h-3 w-3" />
              Concluída em {fmtDate(note.completed_at)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isDue && onSnooze && (
            <button
              onClick={() => onSnooze(1)}
              title="Adiar 1 hora"
              className="h-7 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition"
            >
              +1h
            </button>
          )}
          {isCompleted && onUndo && (
            <button
              onClick={onUndo}
              className="h-7 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
            >
              Reabrir
            </button>
          )}
          <button
            onClick={onRemove}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Ações rápidas quando vencido */}
      {isDue && onComplete && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={onComplete}
            className="flex-1 h-9 rounded-xl bg-success text-success-foreground text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition"
          >
            <Check className="h-4 w-4" /> Sim, cumpri!
          </button>
          {onSnooze && (
            <button
              onClick={() => onSnooze(1)}
              className="h-9 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
            >
              Adiar 1h
            </button>
          )}
        </div>
      )}
    </div>
  );
}
