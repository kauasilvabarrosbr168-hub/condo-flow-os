// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Plus, X, Phone, Trash2, Sparkles, ExternalLink,
  CheckCircle2, Clock, XCircle, BadgeCheck, Settings2, Star,
  CalendarDays, Brush,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getCleaningData,
  saveCleaningConfig,
  createCleaningRequest,
  updateCleaningRequestStatus,
} from "@/lib/cleaning.functions";

export const Route = createFileRoute("/app/cleaning")({
  head: () => ({ meta: [{ title: "Limpeza · CondoFlow" }] }),
  component: CleaningPage,
});

type CleaningService = { id: string; name: string; phone: string | null; price_cents: number; notes: string | null };
type Profile = { id: string; full_name: string | null; unit_label?: string | null; email?: string | null };
type CleaningRequest = {
  id: string; requested_by: string; worker_id: string | null;
  unit_label: string | null; notes: string | null;
  status: "pending" | "accepted" | "done" | "cancelled";
  price_cents: number; scheduled_at: string | null; done_at: string | null;
  created_at: string; is_mine: boolean;
  requester: Profile | null; worker: Profile | null;
};
type Config = { internal_enabled: boolean; price_cents: number; worker_id: string | null };

const STATUS_MAP: Record<string, { label: string; color: string; Icon: any }> = {
  pending:   { label: "Aguardando",  color: "text-warning bg-warning/10 border-warning/30",     Icon: Clock },
  accepted:  { label: "Aceito",      color: "text-primary bg-primary/10 border-primary/30",     Icon: BadgeCheck },
  done:      { label: "Concluído",   color: "text-success bg-success/10 border-success/30",     Icon: CheckCircle2 },
  cancelled: { label: "Cancelado",   color: "text-muted-foreground bg-muted border-border",     Icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${s.color}`}>
      <s.Icon className="h-3 w-3" />{s.label}
    </span>
  );
}

function fmtPrice(cents: number) {
  if (cents === 0) return "A combinar";
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function CleaningPage() {
  const { profile, condo, primaryRole, user } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const isSindico = primaryRole === "sindico" || primaryRole === "administradora";
  const isWorker  = primaryRole === "funcionario";

  const fetchData     = useServerFn(getCleaningData);
  const saveCfgFn     = useServerFn(saveCleaningConfig);
  const requestFn     = useServerFn(createCleaningRequest);
  const updateStatusFn = useServerFn(updateCleaningRequestStatus);

  const [services, setServices]     = useState<CleaningService[] | null>(null);
  const [config, setConfig]         = useState<Config | null>(null);
  const [workers, setWorkers]       = useState<Profile[]>([]);
  const [requests, setRequests]     = useState<CleaningRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [addOpen, setAddOpen]       = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [busyId, setBusyId]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!condoId) return;
    setLoading(true);
    const [svcRes, dataRes] = await Promise.all([
      supabase.from("cleaning_services").select("id,name,phone,price_cents,notes").eq("condo_id", condoId).eq("active", true).order("name"),
      fetchData({ data: { condoId } }),
    ]);
    setServices((svcRes.data ?? []) as CleaningService[]);
    setConfig(dataRes.config as Config);
    setWorkers(dataRes.workers as Profile[]);
    setRequests(dataRes.requests as CleaningRequest[]);
    setLoading(false);
  }, [condoId, fetchData]);

  useEffect(() => { load(); }, [load]);

  const deleteService = async (s: CleaningService) => {
    if (!confirm(`Remover "${s.name}"?`)) return;
    const { error } = await supabase.from("cleaning_services").update({ active: false }).eq("id", s.id);
    if (error) toast.error(error.message);
    else { toast.success("Prestador removido"); load(); }
  };

  const handleStatus = async (reqId: string, status: "accepted" | "done" | "cancelled") => {
    setBusyId(reqId);
    try {
      await updateStatusFn({ data: { requestId: reqId, status } });
      toast.success(status === "done" ? "Limpeza concluída!" : status === "accepted" ? "Pedido aceito!" : "Pedido cancelado");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!condoId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center px-6">
        <Brush className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Vincule-se a um condomínio para acessar a área de limpeza.</p>
      </div>
    );
  }

  const myRequests = requests.filter((r) => r.is_mine);
  const workerRequests = isWorker ? requests.filter((r) => r.worker_id === user?.id && r.status !== "done" && r.status !== "cancelled") : [];
  const sindicoRequests = isSindico ? requests.filter((r) => r.status === "pending" || r.status === "accepted") : [];

  return (
    <div className="px-4 lg:px-8 py-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Brush className="h-6 w-6 text-primary" /> Limpeza
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSindico
            ? "Gerencie prestadores externos e o serviço de limpeza interno do condomínio."
            : isWorker
            ? "Veja os pedidos de limpeza atribuídos a você e gerencie prestadores."
            : "Encontre prestadores de limpeza e solicite o serviço interno do condomínio."}
        </p>
      </div>

      {/* ── PRESTADORES EXTERNOS ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold">Prestadores externos</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Diaristas e empresas cadastradas pelos moradores e síndico.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="https://www.google.com/maps/search/empresa+de+limpeza"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Buscar no Google
            </a>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (services?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum prestador cadastrado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Adicionar" para cadastrar diaristas ou empresas de limpeza.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {services!.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:shadow-card transition">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.name}</p>
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline">
                      <Phone className="h-3 w-3" />{s.phone}
                    </a>
                  )}
                  {s.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-primary">{fmtPrice(s.price_cents)}</p>
                  {isSindico && (
                    <button
                      onClick={() => deleteService(s)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── LIMPEZA INTERNA ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold mb-3">Limpeza interna do condomínio</h2>

        {config?.internal_enabled ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Serviço disponível
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.price_cents > 0
                    ? `Valor fixo por sessão: ${fmtPrice(config.price_cents)}`
                    : "Valor a combinar com o colaborador."}
                </p>
              </div>
              {!isWorker && (
                <Button onClick={() => setRequestOpen(true)}>
                  <CalendarDays className="h-3.5 w-3.5" /> Solicitar limpeza
                </Button>
              )}
            </div>
          </div>
        ) : (
          !isSindico && (
            <div className="rounded-xl border border-dashed border-border p-5 text-center mb-4">
              <p className="text-sm text-muted-foreground">Serviço de limpeza interna não está disponível no momento.</p>
              <p className="text-xs text-muted-foreground mt-1">O síndico pode ativar este serviço a qualquer momento.</p>
            </div>
          )
        )}

        {/* Config do síndico */}
        {isSindico && config !== null && (
          <CleaningConfigPanel
            config={config}
            workers={workers}
            condoId={condoId}
            saveFn={saveCfgFn}
            onSaved={load}
          />
        )}

        {/* Pedidos do worker */}
        {isWorker && workerRequests.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pedidos atribuídos a mim</h3>
            <RequestList
              requests={workerRequests}
              busyId={busyId}
              showActions={{ worker: true }}
              onStatus={handleStatus}
            />
          </div>
        )}

        {/* Pedidos pendentes — síndico vê todos */}
        {isSindico && sindicoRequests.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pedidos em aberto</h3>
            <RequestList
              requests={sindicoRequests}
              busyId={busyId}
              showActions={{ sindico: true }}
              onStatus={handleStatus}
            />
          </div>
        )}

        {/* Meus pedidos — moradores */}
        {myRequests.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Meus pedidos</h3>
            <RequestList
              requests={myRequests}
              busyId={busyId}
              showActions={{ self: true }}
              onStatus={handleStatus}
            />
          </div>
        )}
      </section>

      {/* Dialogs */}
      {addOpen && condoId && (
        <AddProviderDialog condoId={condoId} onClose={() => setAddOpen(false)} onCreated={load} />
      )}
      {requestOpen && condoId && config && (
        <RequestCleaningDialog
          condoId={condoId}
          config={config}
          createFn={requestFn}
          onClose={() => setRequestOpen(false)}
          onCreated={() => { load(); setRequestOpen(false); }}
        />
      )}
    </div>
  );
}

// ─── Config Panel (síndico) ───────────────────────────────────────────────────

function CleaningConfigPanel({ config, workers, condoId, saveFn, onSaved }: {
  config: Config; workers: Profile[]; condoId: string;
  saveFn: (a: any) => Promise<any>; onSaved: () => void;
}) {
  const [enabled, setEnabled]     = useState(config.internal_enabled);
  const [price, setPrice]         = useState(config.price_cents > 0 ? (config.price_cents / 100).toFixed(2) : "");
  const [workerId, setWorkerId]   = useState<string>(config.worker_id ?? "");
  const [busy, setBusy]           = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await saveFn({ data: {
        condoId,
        enabled,
        priceCents: price === "" ? 0 : Math.round(Number(price) * 100),
        workerId: workerId || null,
      } });
      toast.success("Configuração salva!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold">Configurar limpeza interna</p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-5 w-9 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        <span className="text-sm">{enabled ? "Serviço ativado" : "Serviço desativado"}</span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Preço por sessão (R$)</label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 80,00 (vazio = a combinar)"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Colaborador responsável</label>
          <select
            value={workerId}
            onChange={(e) => setWorkerId(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">— Nenhum atribuído —</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>{w.full_name ?? w.email ?? w.id}</option>
            ))}
          </select>
        </div>
      </div>

      {workers.length === 0 && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Nenhum funcionário cadastrado. Adicione um colaborador à equipe para atribuir a limpeza.
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar configuração
        </Button>
      </div>
    </div>
  );
}

// ─── Request List ─────────────────────────────────────────────────────────────

function RequestList({ requests, busyId, showActions, onStatus }: {
  requests: CleaningRequest[];
  busyId: string | null;
  showActions: { worker?: boolean; sindico?: boolean; self?: boolean };
  onStatus: (id: string, status: "accepted" | "done" | "cancelled") => void;
}) {
  return (
    <div className="grid gap-2">
      {requests.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={r.status} />
                {r.requester?.full_name && (
                  <span className="text-xs text-muted-foreground">{r.requester.full_name}{r.unit_label ? ` · unid. ${r.unit_label}` : ""}</span>
                )}
              </div>
              {r.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.notes}</p>}
              <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground">
                {r.scheduled_at && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{fmtDate(r.scheduled_at)}</span>}
                {r.price_cents > 0 && <span>{fmtPrice(r.price_cents)}</span>}
                <span>{fmtDate(r.created_at)}</span>
              </div>
            </div>
          </div>

          {busyId !== r.id && (
            <div className="flex gap-2 flex-wrap">
              {showActions.worker && r.status === "pending" && (
                <button onClick={() => onStatus(r.id, "accepted")} className="h-7 px-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition">
                  <BadgeCheck className="h-3 w-3 inline mr-1" />Aceitar
                </button>
              )}
              {showActions.worker && r.status === "accepted" && (
                <button onClick={() => onStatus(r.id, "done")} className="h-7 px-3 rounded-lg bg-success/10 border border-success/30 text-success text-xs font-medium hover:bg-success/20 transition">
                  <CheckCircle2 className="h-3 w-3 inline mr-1" />Marcar concluído
                </button>
              )}
              {(showActions.sindico || showActions.self) && r.status === "pending" && (
                <button onClick={() => onStatus(r.id, "cancelled")} className="h-7 px-3 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition">
                  <XCircle className="h-3 w-3 inline mr-1" />Cancelar
                </button>
              )}
            </div>
          )}
          {busyId === r.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

// ─── Add Provider Dialog ──────────────────────────────────────────────────────

function AddProviderDialog({ condoId, onClose, onCreated }: { condoId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | "">(5);
  const [busy, setBusy]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("cleaning_services").insert({
      condo_id: condoId,
      name: name.trim(),
      phone: phone.trim() || null,
      price_cents: price === "" ? 0 : Math.round(Number(price) * 100),
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Prestador cadastrado!");
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar prestador de limpeza</DialogTitle>
          <DialogDescription>
            Cadastre uma diarista ou empresa.{" "}
            <a
              href="https://www.google.com/maps/search/empresa+de+limpeza"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:no-underline"
            >
              Buscar no Google Maps
            </a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome / Empresa *</label>
            <Input required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Ex: Limpeza Express, Dona Maria…" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Telefone / WhatsApp</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Valor da diária (R$)</label>
            <Input
              type="number" min={0} step={0.01}
              value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Deixe vazio para 'A combinar'" className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Avaliação</label>
            <div className="flex gap-1 mt-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  className={`h-8 w-8 rounded-lg border text-sm transition ${Number(rating) >= n ? "border-amber-400 bg-amber-400/10 text-amber-500" : "border-border text-muted-foreground hover:border-amber-400/50"}`}
                >
                  <Star className="h-3.5 w-3.5 mx-auto" fill={Number(rating) >= n ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Observações</label>
            <Textarea value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Horários, especialidades, forma de pagamento…" className="mt-1 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Cleaning Dialog ──────────────────────────────────────────────────

function RequestCleaningDialog({ condoId, config, createFn, onClose, onCreated }: {
  condoId: string; config: Config;
  createFn: (a: any) => Promise<any>;
  onClose: () => void; onCreated: () => void;
}) {
  const [notes, setNotes]         = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy]           = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createFn({ data: {
        condoId,
        notes: notes.trim() || null,
        scheduledAt: scheduledAt || null,
      } });
      toast.success("Pedido enviado! O colaborador receberá a notificação.");
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Solicitar limpeza</DialogTitle>
          <DialogDescription>
            {config.price_cents > 0
              ? `Taxa pelo serviço: ${fmtPrice(config.price_cents)} por sessão.`
              : "O valor será combinado com o colaborador."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Data / horário preferido</label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Observações</label>
            <Textarea
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Quais cômodos? Alguma observação especial?"
              className="mt-1 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Enviar pedido
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
