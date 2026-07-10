// @ts-nocheck
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Reservation = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  area_id: string | null;
  resident_id: string | null;
  created_at: string | null;
};

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DAY_HEADERS = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"];

// Paleta de cores por área (índice)
const AREA_COLORS = [
  { bg: "rgba(34,197,94,0.15)",  dot: "#22C55E", text: "#16A34A", dark: "#4ADE80" },
  { bg: "rgba(168,85,247,0.15)", dot: "#A855F7", text: "#9333EA", dark: "#C084FC" },
  { bg: "rgba(249,115,22,0.15)", dot: "#F97316", text: "#EA580C", dark: "#FB923C" },
  { bg: "rgba(59,130,246,0.15)", dot: "#3B82F6", text: "#2563EB", dark: "#60A5FA" },
  { bg: "rgba(236,72,153,0.15)", dot: "#EC4899", text: "#DB2777", dark: "#F472B6" },
  { bg: "rgba(234,179,8,0.15)",  dot: "#EAB308", text: "#CA8A04", dark: "#FDE047" },
];

function getAreaColor(index: number) {
  return AREA_COLORS[index % AREA_COLORS.length];
}

export function ReservationsCalendar({ condoId, compact = false }: { condoId: string; compact?: boolean }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [listView, setListView] = useState(false);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd   = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations-calendar", condoId, monthStart.toISOString()],
    queryFn: async () => {
      const [resv, areas, profiles] = await Promise.all([
        supabase
          .from("reservations")
          .select("id,starts_at,ends_at,status,area_id,resident_id,created_at")
          .eq("condo_id", condoId)
          .neq("status", "cancelada")
          .gte("starts_at", monthStart.toISOString())
          .lt("starts_at", monthEnd.toISOString())
          .order("starts_at", { ascending: true }),
        supabase.from("common_areas").select("id,name").eq("condo_id", condoId).order("name"),
        supabase.from("profiles").select("id,full_name,unit_label").eq("condo_id", condoId),
      ]);
      const areaList = (areas.data ?? []) as { id: string; name: string }[];
      const areaMap  = new Map<string, { name: string; colorIdx: number }>();
      areaList.forEach((a, i) => areaMap.set(a.id, { name: a.name, colorIdx: i }));
      const profileMap = new Map<string, { full_name: string; unit_label: string | null }>();
      (profiles.data ?? []).forEach((p: any) => profileMap.set(p.id, p));
      return { reservations: (resv.data ?? []) as Reservation[], areaMap, areaList, profileMap };
    },
    refetchInterval: 30_000,
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

  const grid    = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const todayKey = isoDay(new Date().toISOString());

  const prevMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const nextMonth = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  return (
    <div className="rc-wrap">
      {/* ── Header ── */}
      <div className="rc-header">
        <div className="rc-header-left">
          <span className="rc-header-icon">
            <CalendarDays size={16} />
          </span>
          <div>
            <p className="rc-title">Calendário de reservas</p>
            <p className="rc-subtitle">Atualizado em tempo real · clique em um dia</p>
          </div>
        </div>
        <div className="rc-nav">
          <button className="rc-nav-btn" onClick={prevMonth} aria-label="Mês anterior">
            <ChevronLeft size={16} />
          </button>
          <button className="rc-month-pill" onClick={() => {}}>
            <CalendarDays size={13} />
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </button>
          <button className="rc-nav-btn" onClick={nextMonth} aria-label="Próximo mês">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Day headers ── */}
      <div className="rc-day-headers">
        {DAY_HEADERS.map((d, i) => (
          <div key={d} className={`rc-day-header ${i === 0 || i === 6 ? "rc-day-header--weekend" : ""}`}>{d}</div>
        ))}
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="rc-loading">
          <span className="rc-loading-dot" />
          <span className="rc-loading-dot" style={{ animationDelay: ".15s" }} />
          <span className="rc-loading-dot" style={{ animationDelay: ".3s" }} />
        </div>
      ) : (
        <div className="rc-grid">
          {grid.map((cell, i) => {
            if (!cell) return <div key={`e${i}`} className="rc-cell rc-cell--empty" />;
            const key     = isoDay(cell.toISOString());
            const list    = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            const dow     = cell.getDay();
            const isWeekend = dow === 0 || dow === 6;
            return (
              <div
                key={key}
                className={`rc-cell ${isToday ? "rc-cell--today" : ""} ${isWeekend ? "rc-cell--weekend" : ""}`}
              >
                <span className={`rc-cell-day ${isToday ? "rc-cell-day--today" : isWeekend ? "rc-cell-day--weekend" : ""}`}>
                  {cell.getDate()}
                  {isToday && <span className="rc-today-dot" />}
                </span>
                <div className="rc-cell-cards">
                  {list.slice(0, compact ? 1 : 3).map((r) => {
                    const area = r.area_id ? data?.areaMap.get(r.area_id) : null;
                    const color = area ? getAreaColor(area.colorIdx) : AREA_COLORS[0];
                    return (
                      <div key={r.id} className="rc-card" style={{ "--card-bg": color.bg, "--card-dot": color.dot, "--card-text": color.text, "--card-text-dark": color.dark } as any}>
                        <span className="rc-card-dot" />
                        <div className="rc-card-body">
                          <span className="rc-card-name">{area?.name ?? "Área"}</span>
                          <span className="rc-card-time">{formatRange(r.starts_at, r.ends_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {list.length > (compact ? 1 : 3) && (
                    <span className="rc-more">+{list.length - (compact ? 1 : 3)} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      {(data?.areaList?.length ?? 0) > 0 && (
        <div className="rc-footer">
          <div className="rc-legend">
            {(data?.areaList ?? []).map((a, i) => {
              const color = getAreaColor(i);
              return (
                <span key={a.id} className="rc-legend-item">
                  <span className="rc-legend-dot" style={{ background: color.dot }} />
                  {a.name}
                </span>
              );
            })}
          </div>
          <button className="rc-list-btn" onClick={() => setListView((v) => !v)}>
            <List size={14} />
            Ver lista de reservas
          </button>
        </div>
      )}

      {/* ── List panel ── */}
      {listView && (
        <div className="rc-list-panel">
          <p className="rc-list-title">Reservas — {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</p>
          {(data?.reservations ?? []).length === 0 ? (
            <p className="rc-list-empty">Nenhuma reserva neste mês.</p>
          ) : (
            <ul className="rc-list">
              {(data?.reservations ?? []).map((r) => {
                const area     = r.area_id ? data?.areaMap.get(r.area_id) : null;
                const resident = r.resident_id ? data?.profileMap.get(r.resident_id) : null;
                const color    = area ? getAreaColor(area.colorIdx) : AREA_COLORS[0];
                return (
                  <li key={r.id} className="rc-list-item">
                    <span className="rc-list-dot" style={{ background: color.dot }} />
                    <div className="rc-list-info">
                      <span className="rc-list-area">{area?.name ?? "Área"}</span>
                      <span className="rc-list-date">
                        {new Date(r.starts_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {formatRange(r.starts_at, r.ends_at)}
                        {resident?.full_name ? ` · ${resident.full_name}` : ""}
                      </span>
                    </div>
                    <StatusChip status={r.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <style>{`
        .rc-wrap {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--rc-border, rgba(255,255,255,0.08));
          background: var(--rc-bg, #0f1623);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* Light mode tokens */
        @media (prefers-color-scheme: light) {
          .rc-wrap {
            --rc-bg: #f8fafc;
            --rc-border: rgba(0,0,0,0.08);
            --rc-header-bg: #ffffff;
            --rc-header-border: rgba(0,0,0,0.06);
            --rc-title-color: #0f172a;
            --rc-subtitle-color: #64748b;
            --rc-nav-btn-bg: #f1f5f9;
            --rc-nav-btn-hover: #e2e8f0;
            --rc-nav-btn-color: #334155;
            --rc-pill-bg: #e0f2fe;
            --rc-pill-color: #0369a1;
            --rc-day-header-color: #94a3b8;
            --rc-weekend-color: #3b82f6;
            --rc-cell-bg: #ffffff;
            --rc-cell-border: rgba(0,0,0,0.05);
            --rc-cell-hover: #f8fafc;
            --rc-cell-today-border: #3b82f6;
            --rc-cell-today-bg: rgba(59,130,246,0.04);
            --rc-cell-day-color: #1e293b;
            --rc-cell-weekend-color: #3b82f6;
            --rc-cell-today-color: #3b82f6;
            --rc-today-dot: #3b82f6;
            --rc-card-text-prop: var(--card-text);
            --rc-more-color: #64748b;
            --rc-footer-bg: #ffffff;
            --rc-footer-border: rgba(0,0,0,0.06);
            --rc-legend-color: #475569;
            --rc-list-btn-bg: #e0f2fe;
            --rc-list-btn-color: #0369a1;
            --rc-list-btn-hover: #bae6fd;
            --rc-panel-bg: #f1f5f9;
            --rc-panel-border: rgba(0,0,0,0.06);
            --rc-list-title: #0f172a;
            --rc-list-empty: #64748b;
            --rc-list-item-border: rgba(0,0,0,0.06);
            --rc-list-area: #1e293b;
            --rc-list-date: #64748b;
            --rc-loading-dot: #3b82f6;
            --rc-icon-bg: rgba(59,130,246,0.1);
            --rc-icon-color: #2563eb;
          }
        }

        :root[data-theme="light"] .rc-wrap {
          --rc-bg: #f8fafc;
          --rc-border: rgba(0,0,0,0.08);
          --rc-header-bg: #ffffff;
          --rc-header-border: rgba(0,0,0,0.06);
          --rc-title-color: #0f172a;
          --rc-subtitle-color: #64748b;
          --rc-nav-btn-bg: #f1f5f9;
          --rc-nav-btn-hover: #e2e8f0;
          --rc-nav-btn-color: #334155;
          --rc-pill-bg: #e0f2fe;
          --rc-pill-color: #0369a1;
          --rc-day-header-color: #94a3b8;
          --rc-weekend-color: #3b82f6;
          --rc-cell-bg: #ffffff;
          --rc-cell-border: rgba(0,0,0,0.05);
          --rc-cell-hover: #f8fafc;
          --rc-cell-today-border: #3b82f6;
          --rc-cell-today-bg: rgba(59,130,246,0.04);
          --rc-cell-day-color: #1e293b;
          --rc-cell-weekend-color: #3b82f6;
          --rc-cell-today-color: #3b82f6;
          --rc-today-dot: #3b82f6;
          --rc-more-color: #64748b;
          --rc-footer-bg: #ffffff;
          --rc-footer-border: rgba(0,0,0,0.06);
          --rc-legend-color: #475569;
          --rc-list-btn-bg: #e0f2fe;
          --rc-list-btn-color: #0369a1;
          --rc-list-btn-hover: #bae6fd;
          --rc-panel-bg: #f1f5f9;
          --rc-panel-border: rgba(0,0,0,0.06);
          --rc-list-title: #0f172a;
          --rc-list-empty: #64748b;
          --rc-list-item-border: rgba(0,0,0,0.06);
          --rc-list-area: #1e293b;
          --rc-list-date: #64748b;
          --rc-loading-dot: #3b82f6;
          --rc-icon-bg: rgba(59,130,246,0.1);
          --rc-icon-color: #2563eb;
        }

        /* Dark mode tokens (default) */
        .rc-wrap {
          --rc-bg: #0f1623;
          --rc-border: rgba(255,255,255,0.07);
          --rc-header-bg: #131d2e;
          --rc-header-border: rgba(255,255,255,0.06);
          --rc-title-color: #f1f5f9;
          --rc-subtitle-color: #64748b;
          --rc-nav-btn-bg: rgba(255,255,255,0.06);
          --rc-nav-btn-hover: rgba(255,255,255,0.1);
          --rc-nav-btn-color: #cbd5e1;
          --rc-pill-bg: rgba(59,130,246,0.15);
          --rc-pill-color: #60a5fa;
          --rc-day-header-color: #475569;
          --rc-weekend-color: #60a5fa;
          --rc-cell-bg: #131d2e;
          --rc-cell-border: rgba(255,255,255,0.04);
          --rc-cell-hover: #1a2540;
          --rc-cell-today-border: #3b82f6;
          --rc-cell-today-bg: rgba(59,130,246,0.06);
          --rc-cell-day-color: #cbd5e1;
          --rc-cell-weekend-color: #60a5fa;
          --rc-cell-today-color: #60a5fa;
          --rc-today-dot: #3b82f6;
          --rc-more-color: #475569;
          --rc-footer-bg: #131d2e;
          --rc-footer-border: rgba(255,255,255,0.06);
          --rc-legend-color: #64748b;
          --rc-list-btn-bg: rgba(59,130,246,0.12);
          --rc-list-btn-color: #60a5fa;
          --rc-list-btn-hover: rgba(59,130,246,0.2);
          --rc-panel-bg: #0c1420;
          --rc-panel-border: rgba(255,255,255,0.05);
          --rc-list-title: #e2e8f0;
          --rc-list-empty: #475569;
          --rc-list-item-border: rgba(255,255,255,0.05);
          --rc-list-area: #cbd5e1;
          --rc-list-date: #475569;
          --rc-loading-dot: #3b82f6;
          --rc-icon-bg: rgba(59,130,246,0.12);
          --rc-icon-color: #60a5fa;
        }

        :root[data-theme="dark"] .rc-wrap {
          --rc-bg: #0f1623;
          --rc-border: rgba(255,255,255,0.07);
          --rc-header-bg: #131d2e;
          --rc-header-border: rgba(255,255,255,0.06);
          --rc-title-color: #f1f5f9;
          --rc-subtitle-color: #64748b;
          --rc-nav-btn-bg: rgba(255,255,255,0.06);
          --rc-nav-btn-hover: rgba(255,255,255,0.1);
          --rc-nav-btn-color: #cbd5e1;
          --rc-pill-bg: rgba(59,130,246,0.15);
          --rc-pill-color: #60a5fa;
          --rc-day-header-color: #475569;
          --rc-weekend-color: #60a5fa;
          --rc-cell-bg: #131d2e;
          --rc-cell-border: rgba(255,255,255,0.04);
          --rc-cell-hover: #1a2540;
          --rc-cell-today-border: #3b82f6;
          --rc-cell-today-bg: rgba(59,130,246,0.06);
          --rc-cell-day-color: #cbd5e1;
          --rc-cell-weekend-color: #60a5fa;
          --rc-cell-today-color: #60a5fa;
          --rc-today-dot: #3b82f6;
          --rc-more-color: #475569;
          --rc-footer-bg: #131d2e;
          --rc-footer-border: rgba(255,255,255,0.06);
          --rc-legend-color: #64748b;
          --rc-list-btn-bg: rgba(59,130,246,0.12);
          --rc-list-btn-color: #60a5fa;
          --rc-list-btn-hover: rgba(59,130,246,0.2);
          --rc-panel-bg: #0c1420;
          --rc-panel-border: rgba(255,255,255,0.05);
          --rc-list-title: #e2e8f0;
          --rc-list-empty: #475569;
          --rc-list-item-border: rgba(255,255,255,0.05);
          --rc-list-area: #cbd5e1;
          --rc-list-date: #475569;
          --rc-loading-dot: #3b82f6;
          --rc-icon-bg: rgba(59,130,246,0.12);
          --rc-icon-color: #60a5fa;
        }

        /* ── Components ── */

        .rc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          background: var(--rc-header-bg);
          border-bottom: 1px solid var(--rc-header-border);
          flex-wrap: wrap;
        }
        .rc-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rc-header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--rc-icon-bg);
          color: var(--rc-icon-color);
          flex-shrink: 0;
        }
        .rc-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--rc-title-color);
          margin: 0;
        }
        .rc-subtitle {
          font-size: 11px;
          color: var(--rc-subtitle-color);
          margin: 0;
        }
        .rc-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rc-nav-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid var(--rc-border);
          background: var(--rc-nav-btn-bg);
          color: var(--rc-nav-btn-color);
          cursor: pointer;
          transition: background 0.15s;
        }
        .rc-nav-btn:hover { background: var(--rc-nav-btn-hover); }
        .rc-month-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          border-radius: 8px;
          background: var(--rc-pill-bg);
          color: var(--rc-pill-color);
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: default;
          white-space: nowrap;
        }

        .rc-day-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 10px 12px 4px;
          gap: 4px;
        }
        .rc-day-header {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--rc-day-header-color);
          padding: 4px 0;
          text-transform: uppercase;
        }
        .rc-day-header--weekend { color: var(--rc-weekend-color); }

        .rc-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          padding: 4px 12px 12px;
        }
        .rc-cell {
          min-height: 88px;
          border-radius: 10px;
          border: 1px solid var(--rc-cell-border);
          background: var(--rc-cell-bg);
          padding: 8px 6px 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
          overflow: hidden;
        }
        .rc-cell:hover { background: var(--rc-cell-hover); }
        .rc-cell--empty {
          min-height: 88px;
          border-radius: 10px;
          background: transparent;
          border: none;
          cursor: default;
        }
        .rc-cell--today {
          border-color: var(--rc-cell-today-border) !important;
          background: var(--rc-cell-today-bg);
          box-shadow: 0 0 0 1px var(--rc-cell-today-border);
        }
        .rc-cell-day {
          font-size: 13px;
          font-weight: 500;
          color: var(--rc-cell-day-color);
          display: flex;
          align-items: center;
          gap: 4px;
          line-height: 1;
        }
        .rc-cell--weekend .rc-cell-day { color: var(--rc-cell-weekend-color); }
        .rc-cell-day--today { color: var(--rc-cell-today-color) !important; font-weight: 700; }
        .rc-today-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--rc-today-dot);
        }

        .rc-cell-cards {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          overflow: hidden;
        }
        .rc-card {
          display: flex;
          align-items: flex-start;
          gap: 5px;
          border-radius: 6px;
          padding: 4px 5px;
          background: var(--card-bg);
          min-width: 0;
        }
        .rc-card-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--card-dot);
          flex-shrink: 0;
          margin-top: 3px;
        }
        .rc-card-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 1px;
        }
        .rc-card-name {
          font-size: 10px;
          font-weight: 600;
          color: var(--card-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        .rc-card-time {
          font-size: 9px;
          font-variant-numeric: tabular-nums;
          color: var(--card-text);
          opacity: 0.75;
          line-height: 1.2;
        }

        @media (prefers-color-scheme: dark) {
          .rc-card-name { color: var(--card-text-dark); }
          .rc-card-time { color: var(--card-text-dark); }
        }
        :root[data-theme="dark"] .rc-card-name { color: var(--card-text-dark); }
        :root[data-theme="dark"] .rc-card-time { color: var(--card-text-dark); }

        .rc-more {
          font-size: 9px;
          color: var(--rc-more-color);
          font-weight: 600;
          padding-left: 2px;
        }

        /* Footer */
        .rc-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 20px;
          border-top: 1px solid var(--rc-footer-border);
          background: var(--rc-footer-bg);
          flex-wrap: wrap;
        }
        .rc-legend {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .rc-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
          color: var(--rc-legend-color);
          white-space: nowrap;
        }
        .rc-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .rc-list-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 14px;
          border-radius: 8px;
          background: var(--rc-list-btn-bg);
          color: var(--rc-list-btn-color);
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .rc-list-btn:hover { background: var(--rc-list-btn-hover); }

        /* List panel */
        .rc-list-panel {
          border-top: 1px solid var(--rc-panel-border);
          background: var(--rc-panel-bg);
          padding: 16px 20px;
        }
        .rc-list-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--rc-list-title);
          margin: 0 0 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rc-list-empty {
          font-size: 12px;
          color: var(--rc-list-empty);
          text-align: center;
          padding: 16px 0;
        }
        .rc-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
        }
        .rc-list-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--rc-list-item-border);
          background: var(--rc-cell-bg);
        }
        .rc-list-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .rc-list-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rc-list-area {
          font-size: 12px;
          font-weight: 600;
          color: var(--rc-list-area);
        }
        .rc-list-date {
          font-size: 11px;
          color: var(--rc-list-date);
          font-variant-numeric: tabular-nums;
        }

        /* Loading */
        .rc-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 48px 0;
        }
        .rc-loading-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--rc-loading-dot);
          animation: rc-bounce 0.8s infinite ease-in-out;
        }
        @keyframes rc-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Status chips */
        .rc-chip {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .rc-chip--pendente   { background: rgba(251,191,36,0.15); color: #F59E0B; }
        .rc-chip--confirmada { background: rgba(34,197,94,0.15);  color: #22C55E; }
        .rc-chip--execucao   { background: rgba(59,130,246,0.15); color: #3B82F6; }
        .rc-chip--concluida  { background: rgba(34,197,94,0.1);   color: #16A34A; }
        .rc-chip--cancelada  { background: rgba(239,68,68,0.15);  color: #EF4444; }

        @media (max-width: 640px) {
          .rc-cell { min-height: 56px; padding: 5px 4px 4px; }
          .rc-card { padding: 3px 4px; gap: 3px; }
          .rc-card-name { font-size: 9px; }
          .rc-card-time { display: none; }
          .rc-cell-day { font-size: 11px; }
          .rc-day-header { font-size: 9px; }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function formatRange(s: string, e: string): string {
  const fmt = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(new Date(s))} - ${fmt(new Date(e))}`;
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pendente:    { label: "Pendente",   cls: "rc-chip--pendente"   },
    confirmada:  { label: "Confirmada", cls: "rc-chip--confirmada" },
    em_execucao: { label: "Em uso",     cls: "rc-chip--execucao"   },
    concluida:   { label: "Concluída",  cls: "rc-chip--concluida"  },
    cancelada:   { label: "Cancelada",  cls: "rc-chip--cancelada"  },
  };
  const v = map[status] ?? map.pendente;
  return <span className={`rc-chip ${v.cls}`}>{v.label}</span>;
}
