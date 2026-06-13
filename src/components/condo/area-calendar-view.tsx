import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Loader2, Trash2, Bell, Clock, Users, MessageSquare, Plus, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { scheduleLabel, type WeekSchedule } from "./area-schedule-picker";

type Reservation = {
  id: string;
  starts_at: string;
  ends_at: string;
  guests: number | null;
  notes: string | null;
  status: string;
  resident_id: string;
  profiles?: { full_name: string; unit_label: string | null } | null;
};

type Notice = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles?: { full_name: string } | null;
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
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingRes, setLoadingRes] = useState(true);
  const [newNotice, setNewNotice] = useState("");
  const [postingNotice, setPostingNotice] = useState(false);
  const qc = useQueryClient();

  // Fetch reservations for this area / month
  const fetchReservations = async () => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from("reservations")
      .select("id,starts_at,ends_at,guests,notes,status,resident_id")
      .eq("area_id", area.id)
      .eq("condo_id", condoId)
      .gte("starts_at", start)
      .lte("starts_at", end)
      .order("starts_at", { ascending: true });
    setReservations((data ?? []) as Reservation[]);
    setLoadingRes(false);

    // Enrich with profiles
    const ids = Array.from(new Set((data ?? []).map((r) => r.resident_id)));
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
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Reserva cancelada"); qc.invalidateQueries({ queryKey: ["reservations", condoId] }); }
  };

  const statusColor: Record<string, string> = {
    confirmed: "bg-emerald-500",
    pending: "bg-amber-400",
    cancelled: "bg-muted-foreground/40",
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

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
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
                const active = rsvs.some((r) => r.status !== "cancelled");
                const selected = selectedDay === d;
                const today_ = isToday(d);
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(selected ? null : d)}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition
                      ${selected ? "bg-primary text-primary-foreground" : today_ ? "bg-primary/10 font-semibold" : "hover:bg-muted"}
                    `}
                  >
                    {d}
                    {active && (
                      <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-primary-foreground" : "bg-primary"}`} />
                    )}
                    {rsvs.length > 0 && !active && (
                      <span className="absolute bottom-1 h-1 w-1 rounded-full bg-muted-foreground/40" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border pt-3">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" />Com reservas</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40 inline-block" />Só canceladas</span>
          </div>
        </div>

        {/* Day detail */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 min-h-[200px]">
            <h3 className="text-sm font-semibold mb-3">
              {selectedDay
                ? `${selectedDay} de ${MONTH_NAMES[month]}`
                : "Selecione um dia"}
            </h3>
            {!selectedDay && (
              <p className="text-xs text-muted-foreground">Clique em um dia no calendário para ver as reservas.</p>
            )}
            {selectedDay && dayReservations.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma reserva neste dia.</p>
            )}
            <div className="space-y-2">
              {dayReservations.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${statusColor[r.status] ?? "bg-muted"}`} />
                        <span className="text-xs font-medium">
                          {fmt(r.starts_at)} – {fmt(r.ends_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.profiles?.full_name ?? "Morador"}
                        {r.profiles?.unit_label ? ` · Unid. ${r.profiles.unit_label}` : ""}
                      </p>
                      {r.guests ? <p className="text-[11px] text-muted-foreground">{r.guests} convidado(s)</p> : null}
                      {r.notes && (
                        <p className="text-[11px] text-muted-foreground mt-1 italic border-l-2 border-primary/30 pl-2">
                          "{r.notes}"
                        </p>
                      )}
                    </div>
                    {isAdmin && r.status !== "cancelled" && (
                      <button
                        onClick={() => cancelReservation(r.id)}
                        className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center shrink-0"
                        title="Cancelar reserva"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules quick view */}
          {area.rules && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Regras de uso</h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-6">{area.rules}</p>
            </div>
          )}
        </div>
      </div>

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
