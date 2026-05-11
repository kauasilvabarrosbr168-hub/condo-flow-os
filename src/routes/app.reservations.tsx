import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import { ChevronLeft, ChevronRight, Users, Sparkles, Wallet, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/reservations")({
  head: () => ({ meta: [{ title: "Reservas — CondoFlow" }] }),
  component: Reservations,
});

const areas = [
  { id: "salao", name: "Salão de festas", capacity: 40, fee: 180, img: "🎉" },
  { id: "churrasco", name: "Churrasqueira", capacity: 20, fee: 90, img: "🔥" },
  { id: "sauna", name: "Sauna", capacity: 6, fee: 40, img: "♨️" },
  { id: "quadra", name: "Quadra", capacity: 14, fee: 0, img: "🎾" },
  { id: "piscina", name: "Piscina", capacity: 30, fee: 0, img: "🏊" },
  { id: "coworking", name: "Coworking", capacity: 8, fee: 25, img: "💻" },
];

function Reservations() {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState(areas[0]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reservas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Áreas comuns, regras e pagamentos integrados.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
          <button className="px-3 py-1.5 text-sm font-medium rounded-lg bg-muted">Mês</button>
          <button className="px-3 py-1.5 text-sm font-medium text-muted-foreground">Semana</button>
          <button className="px-3 py-1.5 text-sm font-medium text-muted-foreground">Lista</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="space-y-2">
          {areas.map((a) => (
            <button
              key={a.id}
              onClick={() => { setArea(a); }}
              className={`w-full text-left rounded-xl border p-4 transition ${
                area.id === a.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{a.img}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> até {a.capacity}</p>
                </div>
                {a.fee > 0 ? <Badge tone="primary">R$ {a.fee}</Badge> : <Badge tone="success">grátis</Badge>}
              </div>
            </button>
          ))}
        </aside>

        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{area.name} · Maio 2026</h3>
            <div className="flex gap-1">
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border"><ChevronLeft className="h-4 w-4" /></button>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
            {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 2;
              const free = day > 0 && [3, 8, 14, 21, 28].includes(day);
              const busy = day > 0 && [5, 12, 19, 26].includes(day);
              const blocked = day > 0 && [9, 16].includes(day);
              return (
                <button
                  key={i}
                  onClick={() => setOpen(true)}
                  disabled={day < 1 || blocked}
                  className={`relative h-24 rounded-lg border p-2 text-left transition ${
                    day < 1
                      ? "border-transparent"
                      : blocked
                        ? "border-border bg-muted/30 text-muted-foreground"
                        : busy
                          ? "border-primary/40 bg-primary/5 hover:border-primary"
                          : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  {day > 0 && <span className="text-xs font-medium">{day}</span>}
                  {free && <div className="mt-1 text-[10px] rounded bg-success/10 text-success px-1.5 py-0.5">3 horários livres</div>}
                  {busy && <div className="mt-1 text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">Reservado</div>}
                  {blocked && <div className="mt-1 text-[10px]">Bloqueado</div>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-success/50 inline-block" /> Livre</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-primary/50 inline-block" /> Ocupado</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-muted inline-block" /> Bloqueado</span>
          </div>
        </div>
      </div>

      {open && <ReservationModal onClose={() => setOpen(false)} area={area} />}
    </div>
  );
}

function ReservationModal({ onClose, area }: { onClose: () => void; area: typeof areas[number] }) {
  const [cleaning, setCleaning] = useState<"self" | "auto">("auto");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-elegant border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground">Nova reserva</p>
            <h3 className="text-lg font-semibold">{area.name} · 14 maio</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Horários disponíveis</p>
            <div className="grid grid-cols-3 gap-2">
              {["14h","16h","18h","20h","22h"].map((t, i) => (
                <button key={t} className={`h-10 rounded-lg border text-sm font-medium ${i === 2 ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}>{t}</button>
              ))}
              <button disabled className="h-10 rounded-lg border border-border bg-muted text-sm text-muted-foreground line-through">12h</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Limpeza</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setCleaning("self")} className={`rounded-xl border p-3 text-left ${cleaning === "self" ? "border-primary bg-primary/5" : "border-border"}`}>
                <p className="text-sm font-medium">Eu mesmo limpo</p>
                <p className="text-xs text-muted-foreground">Sem custos · vistoria após</p>
              </button>
              <button onClick={() => setCleaning("auto")} className={`rounded-xl border p-3 text-left ${cleaning === "auto" ? "border-primary bg-primary/5" : "border-border"}`}>
                <p className="text-sm font-medium">Limpeza automática</p>
                <p className="text-xs text-muted-foreground">+ R$ 80 · feita pela equipe</p>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-medium text-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Regras da casa</p>
            <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
              <li>Som até 22h em dias úteis</li>
              <li>Limite de {area.capacity} pessoas</li>
              <li>Cancelamento grátis até 24h antes</li>
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-semibold flex items-center gap-1"><Wallet className="h-4 w-4 text-muted-foreground" /> R$ {area.fee + (cleaning === "auto" ? 80 : 0)}</p>
            </div>
            <button className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant">
              Confirmar e pagar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
