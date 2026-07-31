// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarPlus, Building, Loader2, X, Trash2, Check, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/brand";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { dispatchAIEvent } from "@/lib/ai-engine/dispatcher.functions";
import { createReservation, updateReservationStatus } from "@/lib/reservations.functions";

export const Route = createFileRoute("/app/reservations")({
  head: () => ({ meta: [{ title: "Reservas · CondoFlow" }] }),
  component: ReservationsPage,
});

type Area = { id: string; name: string; description: string | null; min_advance_hours: number };
type CleaningService = { id: string; name: string; phone: string | null; price_cents: number };
type CleaningConfig = { internal_enabled: boolean; price_cents: number; worker_id: string | null; worker_name?: string | null };
type Reservation = {
  id: string;
  area_id: string;
  resident_id: string;
  starts_at: string;
  ends_at: string;
  guests: number | null;
  notes: string | null;
  status: string;
  cleaning_type: string | null;
  cleaning_service_id: string | null;
};

function ReservationsPage() {
  const { profile, condo, user, isAdmin, primaryRole } = useAuth();
  const qc = useQueryClient();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const dispatchFn         = useServerFn(dispatchAIEvent);
  const updateStatusFn     = useServerFn(updateReservationStatus);
  const createReservationFn = useServerFn(createReservation);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "upcoming">("upcoming");

  const { data: areas } = useQuery({
    enabled: !!condoId,
    queryKey: ["areas", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("common_areas")
        .select("id,name,description,min_advance_hours")
        .eq("condo_id", condoId!)
        .eq("active", true);
      return (data ?? []) as Area[];
    },
  });

  const { data: cleaningServices } = useQuery({
    enabled: !!condoId,
    queryKey: ["cleaning_services", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("cleaning_services")
        .select("id,name,phone,price_cents")
        .eq("condo_id", condoId!)
        .eq("active", true)
        .order("name");
      return (data ?? []) as CleaningService[];
    },
  });

  const { data: cleaningConfig } = useQuery({
    enabled: !!condoId,
    queryKey: ["cleaning_config", condoId],
    queryFn: async () => {
      const { data: cfg } = await supabase
        .from("condo_cleaning_config")
        .select("internal_enabled, price_cents, worker_id")
        .eq("condo_id", condoId!)
        .maybeSingle();
      if (!cfg) return null;
      if (!cfg.worker_id) return cfg as CleaningConfig;
      const { data: worker } = await supabase.from("profiles").select("full_name").eq("id", cfg.worker_id).maybeSingle();
      return { ...cfg, worker_name: worker?.full_name ?? null } as CleaningConfig;
    },
  });

  const { data: reservations, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["reservations", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id,area_id,resident_id,starts_at,ends_at,guests,notes,status,cleaning_type,cleaning_service_id")
        .eq("condo_id", condoId!)
        .neq("status", "cancelada")
        .order("starts_at", { ascending: true });
      return (data ?? []) as Reservation[];
    },
  });

  useEffect(() => {
    if (!condoId) return;
    const ch = supabase
      .channel(`reservations-rt-${condoId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations", filter: `condo_id=eq.${condoId}` }, () => {
        qc.invalidateQueries({ queryKey: ["reservations", condoId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [condoId, qc]);

  if (!condoId) {
    return (
      <div className="p-8">
        <EmptyState icon={Building} title="Sem condomínio vinculado" description="Aguarde um convite para acessar as reservas." />
      </div>
    );
  }

  const now = Date.now();
  const list = (reservations ?? []).filter((r) => {
    if (filter === "mine") return r.resident_id === user?.id;
    if (filter === "upcoming") return new Date(r.starts_at).getTime() >= now - 3600_000;
    return true;
  });

  const isFuncionario = primaryRole === "funcionario";
  const canReserve    = (areas?.length ?? 0) > 0 && !isFuncionario;

  return (
    <div className="bg-gradient-glow">
      <div className="px-4 lg:px-8 pt-8 pb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFuncionario ? "Calendário de Reservas" : "Reservas"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFuncionario
              ? "Acompanhe as reservas das áreas comuns do condomínio."
              : "Reserve áreas comuns e acompanhe a operação automatizada."}
          </p>
        </div>
        {!isFuncionario && (
          <button
            onClick={() => setOpen(true)}
            disabled={!canReserve}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-50"
          >
            <CalendarPlus className="h-4 w-4" /> Nova reserva
          </button>
        )}
      </div>

      <div className="px-4 lg:px-8 pb-12 space-y-4 animate-slide-up">
        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
          {(["upcoming", "mine", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "upcoming" ? "Próximas" : f === "mine" ? "Minhas" : "Todas"}
            </button>
          ))}
        </div>

        {!canReserve ? (
          <EmptyState
            icon={Building}
            title="Nenhuma área comum cadastrada"
            description={isAdmin ? "Cadastre áreas (sauna, salão, churrasqueira…) para liberar reservas." : "Aguarde o síndico configurar as áreas disponíveis."}
            tone="primary"
            action={isAdmin ? (
              <Link to="/app/areas" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                Configurar áreas →
              </Link>
            ) : undefined}
          />
        ) : isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Nenhuma reserva ainda"
            description="As reservas aparecem aqui assim que forem criadas. O sistema cuida do fluxo automático."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {list.map((r) => {
              const area = areas?.find((a) => a.id === r.area_id);
              const isMine = r.resident_id === user?.id;
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-elegant transition group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold truncate">{area?.name ?? "Área"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fmt(r.starts_at)} → {fmt(r.ends_at, true)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.notes && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{r.notes}</p>}
                  {(r.cleaning_type === "external" || r.cleaning_type === "internal") && (
                    <p className="mt-2 text-[11px] text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {r.cleaning_type === "internal"
                        ? "Limpeza: colaborador do condomínio"
                        : `Limpeza: ${cleaningServices?.find((s) => s.id === r.cleaning_service_id)?.name ?? "Prestador externo"}`}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{r.guests ?? 0} convidados</span>
                    {(isMine || isAdmin) && r.status !== "cancelada" && (
                      <div className="flex gap-1">
                        {isAdmin && r.status === "pendente" && (
                          <button
                            onClick={async () => {
                              try {
                                await updateStatusFn({ data: { reservationId: r.id, status: "confirmada" } });
                                toast.success("Reserva confirmada");
                              } catch (e: any) { toast.error(e.message ?? "Erro ao confirmar"); }
                            }}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-success/30 text-success hover:bg-success/10"
                          >
                            <Check className="h-3 w-3" /> Confirmar
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm("Cancelar esta reserva?")) return;
                            try {
                              await updateStatusFn({ data: { reservationId: r.id, status: "cancelada" } });
                              toast.success("Reserva cancelada");
                              void dispatchFn({ data: { condoId: condoId!, eventType: "reservation_cancelled", entityType: "reservation", entityId: r.id, context: { areaName: area?.name ?? "área" } } });
                            } catch (e: any) { toast.error(e.message ?? "Erro ao cancelar"); }
                          }}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open && canReserve && (
        <NewReservationDialog
          areas={areas!}
          cleaningServices={cleaningServices ?? []}
          cleaningConfig={cleaningConfig ?? null}
          condoId={condoId}
          userId={user!.id}
          onClose={() => setOpen(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["reservations", condoId] })}
          dispatchFn={dispatchFn}
          createReservationFn={createReservationFn}
        />
      )}
    </div>
  );
}

type CleaningChoice = "none" | "internal" | string; // string = cleaning_service_id

function fmtPrice(cents: number) {
  return cents === 0 ? "A combinar" : `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function NewReservationDialog({
  areas,
  cleaningServices,
  cleaningConfig,
  condoId,
  userId,
  onClose,
  onCreated,
  dispatchFn,
  createReservationFn,
}: {
  areas: Area[];
  cleaningServices: CleaningService[];
  cleaningConfig: CleaningConfig | null;
  condoId: string;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatchFn: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createReservationFn: (args: any) => Promise<{ id: string }>;
}) {
  const [areaId, setAreaId] = useState(areas[0]?.id ?? "");
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toLocaleDateString("sv"));
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");
  const [guests, setGuests] = useState(0);
  const [notes, setNotes] = useState("");
  const [cleaning, setCleaning] = useState<CleaningChoice>("none");
  const [busy, setBusy] = useState(false);

  const hasCleaningOptions = cleaningServices.length > 0 || (cleaningConfig?.internal_enabled ?? false);
  const selectedExternal = cleaningServices.find((s) => s.id === cleaning) ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const tzOffset = new Date().getTimezoneOffset();
    const sign = tzOffset <= 0 ? "+" : "-";
    const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
    const tz = `${sign}${pad(Math.floor(Math.abs(tzOffset) / 60))}:${pad(Math.abs(tzOffset) % 60)}`;
    const starts = new Date(`${date}T${startTime}:00${tz}`).toISOString();
    const ends = new Date(`${date}T${endTime}:00${tz}`).toISOString();
    if (new Date(ends) <= new Date(starts)) {
      toast.error("Horário inválido");
      setBusy(false);
      return;
    }

    const cleaningType = cleaning === "none" ? "none" : cleaning === "internal" ? "internal" : "external";
    const cleaningServiceId = cleaningType === "external" ? cleaning : null;

    let resId: string;
    try {
      const result = await createReservationFn({ data: {
        condoId,
        areaId,
        startsAt: starts,
        endsAt:   ends,
        guests,
        notes:    notes || null,
        cleaningServiceId,
        cleaningType,
      }});
      resId = result.id;
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar reserva");
      setBusy(false);
      return;
    }

    setBusy(false);
    toast.success("Reserva criada! O fluxo automático foi iniciado.");
    const areaName = areas.find((a) => a.id === areaId)?.name ?? "área";
    void dispatchFn({ data: { condoId, eventType: "reservation_created", entityType: "reservation", entityId: resId, context: { areaName, cleaningType, guests } } });
    if (cleaningType !== "none") {
      void dispatchFn({ data: { condoId, eventType: "cleaning_requested", entityType: "reservation", entityId: resId, context: { serviceName: selectedExternal?.name ?? "colaborador interno", areaName } } });
    }
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elegant animate-pop"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Nova reserva</h2>
            <p className="text-xs text-muted-foreground">O checklist é gerado automaticamente.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Área">
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputCls}>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Data">
            <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} /></Field>
            <Field label="Fim"><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Convidados">
            <input type="number" min={0} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Observações">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} className={inputCls + " py-2 resize-none"} placeholder="Algo que o síndico ou funcionário deva saber..." />
          </Field>

          {/* Limpeza pós-evento — prestadores externos + colaborador interno */}
          {hasCleaningOptions && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Limpeza pós-evento (opcional)
              </p>
              <div className="space-y-1.5">
                {/* Sem limpeza */}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="cleaning" checked={cleaning === "none"} onChange={() => setCleaning("none")} className="h-4 w-4" />
                  <span className="text-muted-foreground">Sem limpeza</span>
                </label>

                {/* Colaborador interno */}
                {cleaningConfig?.internal_enabled && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="cleaning" checked={cleaning === "internal"} onChange={() => setCleaning("internal")} className="h-4 w-4" />
                    <span className="flex-1">
                      {cleaningConfig.worker_name
                        ? `${cleaningConfig.worker_name} (colaborador do condomínio)`
                        : "Colaborador do condomínio"}
                    </span>
                    <span className="text-xs text-primary font-medium">{fmtPrice(cleaningConfig.price_cents)}</span>
                  </label>
                )}

                {/* Prestadores externos */}
                {cleaningServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="cleaning" checked={cleaning === s.id} onChange={() => setCleaning(s.id)} className="h-4 w-4" />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-primary font-medium">{fmtPrice(s.price_cents)}</span>
                  </label>
                ))}
              </div>

              {cleaning !== "none" && (
                <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                  {cleaning === "internal"
                    ? "O colaborador receberá o pedido de limpeza automaticamente."
                    : `Uma tarefa de limpeza será criada automaticamente para ${selectedExternal?.name}.`}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-hero text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar reserva
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "default" | "primary" | "success" | "warning" | "destructive" }> = {
    pendente: { label: "Pendente", tone: "warning" },
    confirmada: { label: "Confirmada", tone: "primary" },
    em_execucao: { label: "Em execução", tone: "primary" },
    concluida: { label: "Concluída", tone: "success" },
    cancelada: { label: "Cancelada", tone: "destructive" },
  };
  const v = map[status] ?? map.pendente;
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

function fmt(iso: string, hourOnly = false) {
  const d = new Date(iso);
  if (hourOnly) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
