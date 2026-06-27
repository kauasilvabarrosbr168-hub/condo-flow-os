// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarDays, X, Home, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Reservation = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  area_id: string | null;
  resident_id: string | null;
  created_at: string | null;
};

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_NAMES = ["D","S","T","Q","Q","S","S"];

export function ReservationsCalendar({ condoId, compact = false }: { condoId: string; compact?: boolean }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations-calendar", condoId, monthStart.toISOString()],
    queryFn: async () => {
      const [resv, areas, profiles] = await Promise.all([
        supabase
          .from("reservations")
          .select("id,starts_at,ends_at,status,area_id,resident_id,created_at")
          .eq("condo_id", condoId)
          .gte("starts_at", monthStart.toISOString())
          .lt("starts_at", monthEnd.toISOString())
          .order("starts_at", { ascending: true }),
        supabase.from("common_areas").select("id,name,icon").eq("condo_id", condoId),
        supabase.from("profiles").select("id,full_name,unit_label").eq("condo_id", condoId),
      ]);
      const areaMap = new Map<string, { name: string; icon: string | null }>();
      (areas.data ?? []).forEach((a: any) => areaMap.set(a.id, { name: a.name, icon: a.icon }));
      const profileMap = new Map<string, { full_name: string; unit_label: string | null }>();
      (profiles.data ?? []).forEach((p: any) => profileMap.set(p.id, { full_name: p.full_name, unit_label: p.unit_label }));
      return { reservations: (resv.data ?? []) as Reservation[], areaMap, profileMap };
    },
    refetchInterval: 30000, // ao vivo
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    (data?.reservations ?? []).forEach((r) => {
      const k = isoDay(r.starts_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    });
    return map;
  }, [data]);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const todayKey = isoDay(new Date().toISOString());

  const selectedList = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Calendário de reservas</h2>
            <p className="text-[11px] text-muted-foreground">Atualizado em tempo real · clique em um dia</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-sm font-medium tabular-nums min-w-[140px] text-center">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            const key = cell ? isoDay(cell.toISOString()) : null;
            const list = key ? byDay.get(key) ?? [] : [];
            const inMonth = cell && cell.getMonth() === cursor.getMonth();
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            return (
              <button
                key={i}
                disabled={!cell}
                onClick={() => key && setSelectedDay(key)}
                className={`relative aspect-square rounded-lg border text-left p-1.5 transition group ${
                  !inMonth ? "opacity-30 border-transparent" : ""
                } ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : isToday
                    ? "border-primary/40 bg-primary/5"
                    : list.length > 0
                    ? "border-primary/30 bg-card hover:border-primary/60 hover:bg-primary/5"
                    : "border-border/50 bg-card hover:border-border"
                }`}
              >
                {cell && (
                  <>
                    <span className={`text-[11px] font-medium ${isToday ? "text-primary font-bold" : ""}`}>
                      {cell.getDate()}
                    </span>
                    {list.length > 0 && (
                      <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center gap-0.5">
                        {list.slice(0, 3).map((_, j) => (
                          <span key={j} className="h-1.5 flex-1 rounded-full bg-gradient-hero" />
                        ))}
                        {list.length > 3 && (
                          <span className="text-[8px] font-bold text-primary ml-0.5">+{list.length - 3}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground animate-pulse">Carregando…</p>
        )}
      </div>

      {selectedDay && (
        <div className="border-t border-border bg-muted/30 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Reservas de {new Date(selectedDay + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-muted transition">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {selectedList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma reserva nesse dia.</p>
          ) : (
            <ul className="space-y-2">
              {selectedList.map((r) => {
                const area = r.area_id ? data?.areaMap.get(r.area_id) : null;
                const resident = r.resident_id ? data?.profileMap.get(r.resident_id) : null;
                return (
                  <li key={r.id} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3 hover:border-primary/40 transition">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{area?.name ?? "Área"}</p>
                        <StatusChip status={r.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" /> {resident?.full_name ?? "—"}
                        </span>
                        {resident?.unit_label && (
                          <span className="inline-flex items-center gap-1">
                            <Home className="h-3 w-3" /> {resident.unit_label}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRange(r.starts_at, r.ends_at)}
                        </span>
                      </div>
                      {r.created_at && (
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          Reserva feita em {new Date(r.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function buildMonthGrid(cursor: Date): (Date | null)[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isoDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRange(s: string, e: string) {
  const sd = new Date(s);
  const ed = new Date(e);
  const f = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${f(sd)} – ${f(ed)}`;
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente: { label: "Pendente", cls: "bg-warning/20 text-warning-foreground border border-warning/40" },
    confirmada: { label: "Confirmada", cls: "bg-primary/15 text-primary border border-primary/30" },
    em_execucao: { label: "Em uso", cls: "bg-primary/15 text-primary border border-primary/30" },
    concluida: { label: "Concluída", cls: "bg-success/15 text-success border border-success/30" },
    cancelada: { label: "Cancelada", cls: "bg-destructive/15 text-destructive border border-destructive/30" },
  };
  const v = map[status] ?? map.pendente;
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${v.cls}`}>{v.label}</span>;
}
