import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import { Bell, CheckCircle2, Flame, AlertTriangle, MessageSquare, Wallet, Smartphone, Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notificações — CondoFlow" }] }),
  component: Notifications,
});

const items = [
  { i: CheckCircle2, t: "Reserva aprovada · Salão sábado 20h", s: "Pagamento confirmado · R$ 260", time: "agora", tone: "success" as const, channel: "Push" },
  { i: Flame, t: "Sauna confirmada para 18h", s: "Tarefa criada para João Pereira", time: "12 min", tone: "primary" as const, channel: "Push + WhatsApp" },
  { i: AlertTriangle, t: "Falta de gás detectada", s: "Cilindro 15% · troca agendada", time: "1h", tone: "warning" as const, channel: "WhatsApp" },
  { i: AlertTriangle, t: "Manutenção atrasada", s: "Bombas de recalque · 2 dias de atraso", time: "2h", tone: "destructive" as const, channel: "E-mail" },
  { i: MessageSquare, t: "Aviso geral aos moradores", s: "Manutenção elevador hoje 14h–17h", time: "3h", tone: "default" as const, channel: "Push + E-mail" },
  { i: Wallet, t: "Boleto disponível", s: "Maio · vencimento dia 15", time: "ontem", tone: "default" as const, channel: "E-mail" },
];

function Notifications() {
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Central de notificações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Push, e-mail e WhatsApp — orquestrados de forma inteligente.</p>
        </div>
        <button className="text-sm text-primary font-medium">Marcar todas como lidas</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { i: Smartphone, l: "Push", c: 14, sub: "ativos hoje" },
          { i: Mail, l: "E-mail", c: 8, sub: "enviados" },
          { i: MessageCircle, l: "WhatsApp", c: 5, sub: "entregues" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card flex items-center gap-4">
            <span className="h-11 w-11 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center"><s.i className="h-5 w-5" /></span>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{s.c}</p>
              <p className="text-xs text-muted-foreground">{s.l} · {s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Recentes</h3>
          </div>
          <div className="flex gap-1.5 text-xs">
            {["Todas","Críticas","Operação","Moradores"].map((t, i) => (
              <button key={t} className={`px-2.5 h-7 rounded-md font-medium ${i === 0 ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{t}</button>
            ))}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <li key={n.t} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30">
              <span className={`h-10 w-10 shrink-0 rounded-xl inline-flex items-center justify-center ${
                n.tone === "success" ? "bg-success/10 text-success" :
                n.tone === "warning" ? "bg-warning/15 text-warning-foreground" :
                n.tone === "destructive" ? "bg-destructive/10 text-destructive" :
                n.tone === "primary" ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                <n.i className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.t}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.s}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">{n.time}</span>
                <Badge>{n.channel}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
