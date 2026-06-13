import { Switch } from "@/components/ui/switch";

export type DaySlot = { from: string; to: string } | null;
export type WeekSchedule = {
  seg: DaySlot; ter: DaySlot; qua: DaySlot; qui: DaySlot;
  sex: DaySlot; sab: DaySlot; dom: DaySlot;
};

export const EMPTY_SCHEDULE: WeekSchedule = {
  seg: { from: "08:00", to: "22:00" },
  ter: { from: "08:00", to: "22:00" },
  qua: { from: "08:00", to: "22:00" },
  qui: { from: "08:00", to: "22:00" },
  sex: { from: "08:00", to: "22:00" },
  sab: { from: "09:00", to: "20:00" },
  dom: null,
};

const DAYS: { key: keyof WeekSchedule; label: string }[] = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const inputCls = "h-8 w-24 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

export function AreaSchedulePicker({
  value,
  onChange,
}: {
  value: WeekSchedule;
  onChange: (v: WeekSchedule) => void;
}) {
  const set = (day: keyof WeekSchedule, slot: DaySlot) =>
    onChange({ ...value, [day]: slot });

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const slot = value[key];
        const open = slot !== null;
        return (
          <div key={key} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
            <span className="w-20 text-sm font-medium shrink-0">{label}</span>
            <Switch
              checked={open}
              onCheckedChange={(v) =>
                set(key, v ? { from: "08:00", to: "22:00" } : null)
              }
            />
            {open ? (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="time"
                  value={slot!.from}
                  onChange={(e) => set(key, { ...slot!, from: e.target.value })}
                  className={inputCls}
                />
                <span className="text-xs text-muted-foreground">até</span>
                <input
                  type="time"
                  value={slot!.to}
                  onChange={(e) => set(key, { ...slot!, to: e.target.value })}
                  className={inputCls}
                />
              </div>
            ) : (
              <span className="ml-2 text-xs text-muted-foreground">Fechado</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function scheduleLabel(schedule: WeekSchedule | null | undefined): string {
  if (!schedule) return "Sem horário definido";
  const days = Object.entries(schedule) as [keyof WeekSchedule, DaySlot][];
  const open = days.filter(([, s]) => s !== null);
  if (open.length === 0) return "Fechado todos os dias";
  if (open.length === 7) return `Todos os dias ${open[0][1]!.from}–${open[0][1]!.to}`;
  return `${open.length} dias / semana`;
}

// Retorna o slot do dia atual (ou null se fechado)
export function todaySlot(schedule: WeekSchedule | null | undefined): DaySlot {
  if (!schedule) return null;
  const keys: (keyof WeekSchedule)[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  return schedule[keys[new Date().getDay()]] ?? null;
}
