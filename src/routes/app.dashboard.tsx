import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, MvpBanner, InDevOverlay, SoonBadge } from "@/components/brand";
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Users,
  HardHat,
  Flame,
  Sparkles,
  ArrowUpRight,
  Bell,
  Shield,
  Home,
  Hammer,
  DollarSign,
  MessageSquareWarning,
  Package,
  Car,
  Droplets,
  PlayCircle,
  Camera,
  ClipboardList,
  TrendingUp,
  PartyPopper,
  Megaphone,
  KeyRound,
  Timer,
} from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CondoFlow" }] }),
  component: Dashboard,
});

type Role = "sindico" | "morador" | "colaborador";

const toneIcon: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
};
const toneDot: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};
const toneBar: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const roleMeta: Record<Role, { label: string; icon: typeof Shield; sub: string; name: string; emoji: string }> = {
  sindico: { label: "Síndico", icon: Shield, sub: "Edifício Aurora · operação rodando dentro do esperado.", name: "Marina", emoji: "👋" },
  morador: { label: "Morador", icon: Home, sub: "Apartamento 402 · Bloco B · tudo em dia por aqui.", name: "Rafael", emoji: "🏡" },
  colaborador: { label: "Colaborador", icon: Hammer, sub: "Turno 06h–14h · 4 tarefas previstas para hoje.", name: "João", emoji: "🛠️" },
};

function Dashboard() {
  const [role, setRole] = useState<Role>("sindico");
  const meta = roleMeta[role];

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Segunda, 11 de maio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Bom dia, {meta.name} {meta.emoji}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{meta.sub}</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted">
            <Sparkles className="h-4 w-4 text-primary" />
            {role === "sindico" ? "Insights da semana" : role === "morador" ? "Nova reserva" : "Iniciar turno"}
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant">
            {role === "sindico" ? "Nova tarefa" : role === "morador" ? "Reportar problema" : "Próxima tarefa"}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Role switcher */}
      <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-card">
        {(Object.keys(roleMeta) as Role[]).map((r) => {
          const m = roleMeta[r];
          const active = role === r;
          return (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 h-9 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-hero text-primary-foreground shadow-elegant"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <m.icon className="h-4 w-4" />
              {m.label}
              {active && <span className="hidden md:inline text-[10px] opacity-80">· visão</span>}
            </button>
          );
        })}
      </div>

      <MvpBanner />

      {role === "sindico" && <SindicoView />}
      {role === "morador" && <MoradorView />}
      {role === "colaborador" && <ColaboradorView />}
    </div>
  );
}

/* ────────────────────── SÍNDICO ────────────────────── */

const sindicoKpis = [
  { label: "Reservas hoje", value: "12", delta: "+3", icon: CalendarDays, tone: "primary" as const },
  { label: "Tarefas pendentes", value: "7", delta: "−2", icon: CheckCircle2, tone: "success" as const },
  { label: "Reclamações abertas", value: "3", delta: "+1", icon: AlertTriangle, tone: "warning" as const },
  { label: "Manutenções atrasadas", value: "2", delta: "−1", icon: Wrench, tone: "destructive" as const },
  { label: "Áreas ocupadas", value: "4/9", delta: "agora", icon: Users, tone: "primary" as const },
  { label: "Funcionários ativos", value: "5", delta: "online", icon: HardHat, tone: "success" as const },
];

function SindicoView() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sindicoKpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneIcon[k.tone]}`}>
                <k.icon className="h-4 w-4" />
              </span>
              <span className="text-xs text-muted-foreground">{k.delta}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Operação dos últimos 14 dias</h3>
              <p className="text-xs text-muted-foreground">Reservas, tarefas concluídas e alertas</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary inline-block" /> Reservas</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-success inline-block" /> Concluídas</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-warning inline-block" /> Alertas</span>
            </div>
          </div>
          <div className="mt-6 grid gap-2 items-end h-48" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
            {Array.from({ length: 14 }).map((_, i) => {
              const a = 30 + ((i * 23) % 70);
              const b = 20 + ((i * 17) % 60);
              const c = 5 + ((i * 11) % 25);
              return (
                <div key={i} className="flex flex-col gap-1 items-stretch">
                  <div className="rounded-t-md bg-primary/80" style={{ height: `${a}%` }} />
                  <div className="bg-success/70" style={{ height: `${b}%` }} />
                  <div className="rounded-b-md bg-warning/70" style={{ height: `${c}%` }} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Alertas críticos</h3>
            <Badge tone="destructive">3 ativos</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { i: Flame, t: "Gás da sauna em 15%", s: "Substituir antes de 19h", tone: "warning" as const },
              { i: Wrench, t: "Elevador social travado", s: "Aguardando técnico Atlas", tone: "destructive" as const },
              { i: AlertTriangle, t: "Limpeza salão atrasada", s: "Reserva às 20h hoje", tone: "warning" as const },
            ].map((a) => (
              <li key={a.t} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneIcon[a.tone]}`}>
                  <a.i className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{a.t}</p>
                  <p className="text-xs text-muted-foreground">{a.s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Financeiro */}
        <div className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
          <InDevOverlay label="Financeiro · em desenvolvimento" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Financeiro do mês</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-4 text-2xl font-semibold">R$ 78.420</p>
          <p className="text-xs text-muted-foreground">Arrecadado de R$ 84.000 previstos</p>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-hero" style={{ width: "93%" }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-success/10 p-2 text-center"><p className="font-semibold text-success">88</p><p className="text-muted-foreground">Pagos</p></div>
            <div className="rounded-lg bg-warning/15 p-2 text-center"><p className="font-semibold text-warning-foreground">6</p><p className="text-muted-foreground">Pendentes</p></div>
            <div className="rounded-lg bg-destructive/10 p-2 text-center"><p className="font-semibold text-destructive">2</p><p className="text-muted-foreground">Atrasados</p></div>
          </div>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Reservas da semana</h3>
            <span className="text-xs text-muted-foreground">Maio · 2026</span>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
            {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d) => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => {
              const has = [3, 7, 10, 12, 15, 19, 21, 24].includes(i);
              const today = i === 11;
              return (
                <div key={i} className={`relative h-20 rounded-lg border ${today ? "border-primary bg-primary/5" : "border-border bg-muted/30"} p-2`}>
                  <span className={`text-xs ${today ? "text-primary font-semibold" : "text-muted-foreground"}`}>{i + 1}</span>
                  {has && (
                    <div className="mt-1 space-y-1">
                      <div className="truncate rounded bg-primary/10 text-primary text-[10px] px-1.5 py-0.5">Salão 20h</div>
                      {i % 2 === 0 && <div className="truncate rounded bg-success/10 text-success text-[10px] px-1.5 py-0.5">Sauna 18h</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Atividade recente</h3>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
        <ol className="mt-4 relative border-l border-border ml-2 space-y-4">
          {[
            { t: "Sauna 18h ligada por João", time: "agora", c: "success" },
            { t: "Salão reservado · Apto 402", time: "12 min", c: "primary" },
            { t: "Sugestão: nova rede na quadra", time: "1h", c: "primary" },
            { t: "Gás da sauna em 15%", time: "2h", c: "warning" },
            { t: "Limpeza piscina concluída", time: "ontem", c: "success" },
          ].map((a, i) => (
            <li key={i} className="pl-5">
              <span className={`absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-card ${toneDot[a.c]}`} />
              <div className="flex items-center justify-between">
                <p className="text-sm">{a.t}</p>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

/* ────────────────────── MORADOR ────────────────────── */

function MoradorView() {
  const moradorKpis = [
    { label: "Próxima reserva", value: "Sáb 20h", delta: "Salão", icon: PartyPopper, tone: "primary" as const },
    { label: "Encomendas", value: "2", delta: "na portaria", icon: Package, tone: "success" as const },
    { label: "Boleto do mês", value: "R$ 890", delta: "vence 10/jun", icon: DollarSign, tone: "warning" as const },
    { label: "Visitas autorizadas", value: "3", delta: "esta semana", icon: KeyRound, tone: "primary" as const },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {moradorKpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneIcon[k.tone]}`}>
                <k.icon className="h-4 w-4" />
              </span>
              <span className="text-xs text-muted-foreground">{k.delta}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-semibold">Atalhos rápidos</h3>
          <p className="text-xs text-muted-foreground">O que você precisa hoje?</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { i: CalendarDays, t: "Reservar área", tone: "primary" },
              { i: MessageSquareWarning, t: "Reportar problema", tone: "warning" },
              { i: KeyRound, t: "Liberar visita", tone: "success" },
              { i: Car, t: "Cadastrar carro", tone: "primary" },
              { i: Package, t: "Encomendas", tone: "success" },
              { i: Megaphone, t: "Comunicados", tone: "warning" },
            ].map((a) => (
              <button
                key={a.t}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border p-3 text-left hover:border-primary/40 hover:shadow-card transition-all"
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneIcon[a.tone]}`}>
                  <a.i className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{a.t}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reservas do morador */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Suas próximas reservas</h3>
            <Badge tone="primary">3 confirmadas</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { area: "Salão de festas", date: "Sáb, 16/mai · 20h–23h", status: "Confirmada", limpeza: "Limpeza pelo condomínio", tone: "success" as const },
              { area: "Sauna inteligente", date: "Qua, 13/mai · 18h–19h", status: "Pré-aquecida", limpeza: "Auto-checklist", tone: "primary" as const },
              { area: "Churrasqueira 2", date: "Dom, 24/mai · 12h–17h", status: "Aguardando taxa", limpeza: "Vou limpar sozinho", tone: "warning" as const },
            ].map((r) => (
              <li key={r.area} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-semibold">{r.area}</p>
                  <p className="text-xs text-muted-foreground">{r.date} · {r.limpeza}</p>
                </div>
                <Badge tone={r.tone}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Consumo */}
        <div className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
          <InDevOverlay label="Consumo · em desenvolvimento" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Seu consumo</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-4">
            {[
              { i: Droplets, t: "Água", v: "8,2 m³", pct: 62, tone: "primary" as const, h: "12% abaixo da média" },
              { i: Flame, t: "Gás", v: "14 kg", pct: 48, tone: "warning" as const, h: "dentro da média" },
              { i: TrendingUp, t: "Energia áreas comuns", v: "rateio R$ 42", pct: 30, tone: "success" as const, h: "queda de 8%" },
            ].map((c) => (
              <div key={c.t}>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2">
                    <c.i className="h-4 w-4 text-muted-foreground" /> {c.t}
                  </span>
                  <span className="font-medium">{c.v}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${toneBar[c.tone]}`} style={{ width: `${c.pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{c.h}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mural */}
        <div className="relative lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <InDevOverlay label="Mural · em desenvolvimento" />
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Mural do condomínio</h3>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { tag: "Aviso", t: "Manutenção da caixa d'água quinta-feira, 9h às 12h.", time: "hoje", tone: "warning" as const },
              { tag: "Votação", t: "Nova rede de proteção na quadra — 68% a favor.", time: "ontem", tone: "primary" as const },
              { tag: "Evento", t: "Festa junina do prédio · inscrições abertas.", time: "2d", tone: "success" as const },
              { tag: "Achado", t: "Chaveiro azul encontrado na portaria.", time: "3d", tone: "primary" as const },
            ].map((n, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <Badge tone={n.tone}>{n.tag}</Badge>
                <div className="flex-1">
                  <p className="text-sm">{n.t}</p>
                  <p className="text-[11px] text-muted-foreground">{n.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

/* ────────────────────── COLABORADOR ────────────────────── */

function ColaboradorView() {
  const colabKpis = [
    { label: "Tarefas hoje", value: "4", delta: "1 urgente", icon: ClipboardList, tone: "primary" as const },
    { label: "Concluídas", value: "12", delta: "esta semana", icon: CheckCircle2, tone: "success" as const },
    { label: "Tempo médio", value: "23min", delta: "−4min", icon: Timer, tone: "primary" as const },
    { label: "Avaliação", value: "4.9", delta: "★ moradores", icon: Sparkles, tone: "warning" as const },
  ];

  const tarefas = [
    { t: "Pré-aquecer sauna · Apto 402", h: "17:30", area: "Sauna", prio: "Urgente", tone: "destructive" as const, status: "Em andamento", pct: 60 },
    { t: "Limpeza pós-festa salão", h: "07:00", area: "Salão", prio: "Alta", tone: "warning" as const, status: "Aguardando", pct: 0 },
    { t: "Reposição gás sauna", h: "10:00", area: "Sauna", prio: "Alta", tone: "warning" as const, status: "Aguardando", pct: 0 },
    { t: "Vistoria piscina", h: "13:00", area: "Piscina", prio: "Rotina", tone: "primary" as const, status: "Programada", pct: 0 },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {colabKpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneIcon[k.tone]}`}>
                <k.icon className="h-4 w-4" />
              </span>
              <span className="text-xs text-muted-foreground">{k.delta}</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tarefa atual */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-gradient-hero p-6 text-primary-foreground shadow-elegant">
          <div className="flex items-center justify-between">
            <Badge tone="destructive">Urgente</Badge>
            <span className="text-xs opacity-80">Início programado · 17:30</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold">Pré-aquecer sauna do Apto 402</h3>
          <p className="mt-1 text-sm opacity-90">Reserva às 18h. Verificar gás, temperatura alvo 85°C e iluminação ambiente.</p>
          <div className="mt-5 h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white" style={{ width: "60%" }} />
          </div>
          <p className="mt-1 text-xs opacity-80">3 de 5 etapas concluídas</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white text-foreground text-sm font-medium">
              <PlayCircle className="h-4 w-4" /> Continuar checklist
            </button>
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white/10 text-sm font-medium hover:bg-white/20">
              <Camera className="h-4 w-4" /> Enviar foto
            </button>
          </div>
        </div>

        {/* Materiais */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Materiais & estoque</h3>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { t: "Gás da sauna", v: "15%", pct: 15, tone: "destructive" as const },
              { t: "Cloro piscina", v: "62%", pct: 62, tone: "success" as const },
              { t: "Detergente", v: "40%", pct: 40, tone: "warning" as const },
              { t: "Sacos de lixo", v: "78%", pct: 78, tone: "success" as const },
            ].map((m) => (
              <li key={m.t}>
                <div className="flex items-center justify-between text-sm">
                  <span>{m.t}</span>
                  <span className="font-medium">{m.v}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${toneBar[m.tone]}`} style={{ width: `${m.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Fila de tarefas */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Fila de tarefas do turno</h3>
          <Badge tone="primary">Turno 06h – 14h</Badge>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {tarefas.map((t) => (
            <li key={t.t} className="flex items-center gap-4 py-3">
              <div className="flex-shrink-0 w-14 text-sm font-semibold text-muted-foreground">{t.h}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{t.t}</p>
                  <Badge tone={t.tone}>{t.prio}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.area} · {t.status}</p>
              </div>
              <div className="hidden md:block w-40">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${toneBar[t.tone]}`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
              <button className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted">
                Abrir <ArrowUpRight className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
