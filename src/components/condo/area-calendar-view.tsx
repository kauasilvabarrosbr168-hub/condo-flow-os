import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Loader2, Trash2, Bell, Clock, Users, MessageSquare, Plus, X, CalendarPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { scheduleLabel, type WeekSchedule } from "./area-schedule-picker";
import { buildHolidayMap, toDateKey, type Holiday } from "@/lib/holidays";

type Reservation = {
  id: string;
  starts_at: string;
  ends_at: string;
  guests: number | null;
  notes: string | null;
  status: string;
  resident_id: string;
  profiles?: { full_name: string | null; unit_label: string | null } | null;
};

type Notice = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles?: { full_name: string | null } | null;
};

type Area = {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  capacity: number | null;
  cover_url: string | null;
  available_slots: WeekSchedule | null;
};

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function AreaCalendarView({
  area,
  condoId,
  onClose,
}: {
  area: Area;
  condoId: string;
  onClose?: () => void;
}) {
  const { isAdmin, user, profile } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingRes, setLoadingRes] = useState(true);
  const [newNotice, setNewNotice] = useState("");
  const [postingNotice, setPostingNotice] = useState(false);
  const [holidayMap, setHolidayMap] = useState<Map<string, Holiday>>(new Map());
  const qc = useQueryClient();

  // Buscar feriados bloqueados do condomínio
  useEffect(() => {
    supabase
      .from("condo_holiday_rules")
      .select("holiday_key")
      .eq("condo_id", condoId)
      .eq("blocked", true)
      .then(({ data }) => {
        const keys = new Set((data ?? []).map((r) => r.holiday_key));
        setHolidayMap(buildHolidayMap([year - 1, year, year + 1], keys));
      });
  }, [condoId, year]);

  // Fetch reservations for this area / month
  const fetchReservations = async () => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from("reservations")
      .select("id,starts_at,ends_at,guests,notes,status,resident_id")
      .eq("area_id", area.id)
      .eq("condo_id", condoId)
      .neq("status", "cancelada")
      .gte("starts_at", start)
      .lte("starts_at", end)
      .order("starts_at", { ascending: true });
    setReservations((data ?? []) as Reservation[]);
    setLoadingRes(false);

    // Enrich with profiles
    const ids = Array.from(new Set((data ?? []).map((r) => r.resident_id).filter((id): id is string => id !== null)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name,unit_label")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      setReservations((prev) =>
        prev.map((r) => ({ ...r, profiles: map.get(r.resident_id) ?? null }))
      );
    }
  };

  // Fetch notices
  const fetchNotices = async () => {
    const { data } = await supabase
      .from("area_notices")
      .select("id,content,created_at,author_id")
      .eq("area_id", area.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const notices = (data ?? []) as Notice[];
    const ids = Array.from(new Set(notices.map((n) => n.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      setNotices(notices.map((n) => ({ ...n, profiles: map.get(n.author_id) ?? null })));
    } else {
      setNotices(notices);
    }
  };

  useEffect(() => {
    setLoadingRes(true);
    fetchReservations();
  }, [area.id, year, month]);

  useEffect(() => {
    fetchNotices();
  }, [area.id]);

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel(`area-cal-${area.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reservations",
        filter: `area_id=eq.${area.id}`,
      }, () => fetchReservations())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "area_notices",
        filter: `area_id=eq.${area.id}`,
      }, () => fetchNotices())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [area.id]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Group reservations by day
  const byDay = new Map<number, Reservation[]>();
  reservations.forEach((r) => {
    const d = new Date(r.starts_at).getDate();
    byDay.set(d, [...(byDay.get(d) ?? []), r]);
  });

  const dayReservations = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  const postNotice = async () => {
    if (!newNotice.trim() || !user) return;
    setPostingNotice(true);
    const { error } = await supabase.from("area_notices").insert({
      area_id: area.id,
      condo_id: condoId,
      author_id: user.id,
      content: newNotice.trim(),
    });
    setPostingNotice(false);
    if (error) { toast.error(error.message); return; }
    setNewNotice("");
    toast.success("Aviso publicado");
  };

  const deleteNotice = async (id: string) => {
    const { error } = await supabase.from("area_notices").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  const cancelReservation = async (id: string) => {
    if (!confirm("Cancelar esta reserva?")) return;
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelada" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Reserva cancelada"); qc.invalidateQueries({ queryKey: ["reservations", condoId] }); }
  };

  const statusColor: Record<string, string> = {
    confirmada: "bg-emerald-500",
    pendente: "bg-amber-400",
    em_execucao: "bg-blue-500",
    concluida: "bg-emerald-700",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Area header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {area.cover_url && (
            <img src={area.cover_url} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
          )}
          <div>
            <h2 className="text-lg font-semibold">{area.name}</h2>
            {area.description && <p className="text-sm text-muted-foreground mt-0.5">{area.description}</p>}
            <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
              {area.capacity && (
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />Máx. {area.capacity} pessoas</span>
              )}
              {area.available_slots && (
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{scheduleLabel(area.available_slots)}</span>
              )}
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted inline-flex items-center justify-center shrink-0">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid gap-5">
        {/* Calendar */}
        <div className="rounded-2xl border border-border bg-card p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="h-8 w-8 rounded-lg hover:bg-muted inline-flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-sm">{MONTH_NAMES[month]} {year}</span>
            <button onClick={nextMonth} className="h-8 w-8 rounded-lg hover:bg-muted inline-flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          {loadingRes ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const rsvs = byDay.get(d) ?? [];
                const active = rsvs.length > 0;
                const selected = selectedDay === d;
                const today_ = isToday(d);
                const dateKey = toDateKey(new Date(year, month, d));
                const holiday = holidayMap.get(dateKey);
                return (
                  <button
                    key={d}
                    onClick={() => { setSelectedDay(d); setDayModalOpen(true); }}
                    title={holiday ? `🚫 Feriado bloqueado: ${holiday.name}` : undefined}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition
                      ${selected
                        ? holiday ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                        : holiday ? "bg-red-500/15 text-red-600 dark:text-red-400 font-semibold hover:bg-red-500/25"
                        : today_ ? "bg-primary/10 font-semibold" : "hover:bg-muted"}
                    `}
                  >
                    {d}
                    {holiday && !selected && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-red-500" />
                    )}
                    {active && !holiday && (
                      <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-primary-foreground" : "bg-primary"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border pt-3 flex-wrap">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" />Com reservas</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" />Feriado bloqueado</span>
          </div>
        </div>
      </div>

      {/* Day popup modal */}
      {dayModalOpen && selectedDay && (
        <DayModal
          day={selectedDay}
          month={month}
          year={year}
          area={area}
          condoId={condoId}
          reservations={byDay.get(selectedDay) ?? []}
          holiday={holidayMap.get(toDateKey(new Date(year, month, selectedDay))) ?? null}
          isAdmin={isAdmin}
          userId={user?.id ?? ""}
          statusColor={statusColor}
          onClose={() => setDayModalOpen(false)}
          onCancelReservation={cancelReservation}
          onReserved={() => { fetchReservations(); setDayModalOpen(false); }}
        />
      )}

      {/* Hint */}
      <p className="text-xs text-muted-foreground text-center -mt-2">Clique em qualquer dia para ver reservas ou criar uma nova</p>

      {/* Notices section */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Avisos do síndico</h3>
        </div>

        {isAdmin && (
          <div className="mb-4 flex gap-2">
            <textarea
              value={newNotice}
              onChange={(e) => setNewNotice(e.target.value)}
              placeholder="Escreva um aviso para os moradores sobre esta área…"
              maxLength={1000}
              rows={2}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 resize-none"
            />
            <button
              onClick={postNotice}
              disabled={postingNotice || !newNotice.trim()}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 self-end"
            >
              {postingNotice ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Publicar
            </button>
          </div>
        )}

        {notices.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum aviso publicado.</p>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {n.profiles?.full_name ?? "Síndico"} · {fmtDate(n.created_at)}
                    </p>
                  </div>
                  {(isAdmin || n.author_id === user?.id) && (
                    <button
                      onClick={() => deleteNotice(n.id)}
                      className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Day Modal ────────────────────────────────────────────────────────────────

function DayModal({
  day, month, year, area, condoId, reservations, holiday, isAdmin, userId,
  statusColor, onClose, onCancelReservation, onReserved,
}: {
  day: number; month: number; year: number;
  area: Area; condoId: string;
  reservations: Reservation[];
  holiday: Holiday | null;
  isAdmin: boolean; userId: string;
  statusColor: Record<string, string>;
  onClose: () => void;
  onCancelReservation: (id: string) => void;
  onReserved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const dateLabel = `${day} de ${MONTH_NAMES[month]} de ${year}`;
  const isPast = new Date(year, month, day) < new Date(new Date().setHours(0,0,0,0));

  const submit = async () => {
    if (!userId) return;
    const startsAt = new Date(year, month, day, parseInt(startTime), parseInt(startTime.split(":")[1])).toISOString();
    const endsAt = new Date(year, month, day, parseInt(endTime), parseInt(endTime.split(":")[1])).toISOString();
    if (startsAt >= endsAt) { toast.error("Horário de início deve ser antes do término."); return; }
    setBusy(true);
    const { error } = await supabase.from("reservations").insert({
      area_id: area.id,
      condo_id: condoId,
      resident_id: userId,
      starts_at: startsAt,
      ends_at: endsAt,
      guests: guests ? parseInt(guests) : null,
      notes: notes.trim() || null,
      status: "pendente",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Reserva solicitada!");
    onReserved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">{area.name}</p>
            <h3 className="font-semibold">{dateLabel}</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted inline-flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Holiday warning */}
          {holiday && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 px-4 py-3">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">🚫 Feriado bloqueado</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {holiday.name} — reservas não permitidas neste dia conforme regra do condomínio.
              </p>
            </div>
          )}

          {/* Existing reservations */}
          {reservations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reservas neste dia</p>
              <div className="space-y-2">
                {reservations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor[r.status] ?? "bg-muted"}`} />
                      <div>
                        <p className="text-xs font-medium">{fmt(r.starts_at)} – {fmt(r.ends_at)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.profiles?.full_name ?? "Morador"}{r.profiles?.unit_label ? ` · Unid. ${r.profiles.unit_label}` : ""}
                        </p>
                      </div>
                    </div>
                    {isAdmin && r.status !== "cancelada" && (
                      <button onClick={() => onCancelReservation(r.id)} className="h-6 w-6 rounded hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reserve form */}
          {!holiday && !isPast && (
            <>
              {!showForm ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-hero text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {reservations.length > 0 ? "Fazer nova reserva" : "Reservar esta data"}
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nova reserva · {dateLabel}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Início</span>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                      <span className="text-xs text-muted-foreground">Término</span>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Convidados (opcional)</span>
                    <input type="number" min="0" value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="0" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">Observações (opcional)</span>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Algum detalhe importante…" className={inputCls + " resize-none py-2"} />
                  </label>
                  {area.rules && (
                    <p className="text-[11px] text-muted-foreground border-l-2 border-border pl-2 italic leading-relaxed">{area.rules}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted transition">Cancelar</button>
                    <button onClick={submit} disabled={busy} className="flex-1 h-10 rounded-xl bg-gradient-hero text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Confirmar reserva"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {isPast && !holiday && reservations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Data passada — não é possível reservar.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";
