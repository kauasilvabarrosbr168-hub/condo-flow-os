import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Bell,
  ListChecks,
  Flame,
  MessageSquareWarning,
  Building2,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Logo, Badge } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CondoFlow — Automatize a operação do seu condomínio" },
      {
        name: "description",
        content:
          "CondoFlow automatiza reservas, manutenção, comunicação e tarefas do condomínio em um único sistema inteligente.",
      },
      { property: "og:title", content: "CondoFlow — Operação inteligente para condomínios" },
      { property: "og:description", content: "Reservas, manutenção e comunicação em um só lugar." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Logo />
          <nav className="ml-10 hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Produto</a>
            <a href="#automations" className="hover:text-foreground transition">Automações</a>
            <a href="#screens" className="hover:text-foreground transition">Telas</a>
            <a href="#pricing" className="hover:text-foreground transition">Preços</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex h-9 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link
              to="/app/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-sm font-medium text-background hover:opacity-90 transition"
            >
              Ver demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <Badge tone="primary">
              <Sparkles className="h-3 w-3" /> Novo · Automação inteligente da sauna
            </Badge>
            <h1 className="mt-6 text-balance text-5xl md:text-6xl font-semibold tracking-tight">
              Transforme o caos do condomínio em uma{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">operação inteligente</span>.
            </h1>
            <p className="mt-6 text-balance text-lg text-muted-foreground">
              Automatize reservas, manutenção, comunicação e tarefas em um único sistema. Síndicos, moradores e funcionários
              alinhados — sem grupo de WhatsApp e sem planilha.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/app/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-hero px-5 text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 transition"
              >
                Começar agora <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#screens"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-medium hover:bg-muted transition"
              >
                Ver telas reais
              </a>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Grátis para os primeiros 30 dias · Sem cartão de crédito
            </p>
          </div>

          {/* Hero mock */}
          <div className="relative mt-16 mx-auto max-w-6xl animate-slide-up">
            <div className="absolute -inset-x-10 -inset-y-6 bg-gradient-hero opacity-20 blur-3xl rounded-[3rem]" />
            <div className="relative rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted/40">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-3 text-xs text-muted-foreground">condoflow.app/dashboard</span>
              </div>
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="border-y border-border/60 bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
            Usado por administradoras e síndicos profissionais em todo o Brasil
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-6 opacity-60">
            {["Aurora", "Vista Park", "Solar", "Atlântico", "Belvedere", "Skyline"].map((n) => (
              <div key={n} className="flex items-center justify-center gap-2 text-sm font-medium tracking-tight">
                <Building2 className="h-4 w-4" /> {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <Badge tone="primary">Plataforma completa</Badge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            Tudo que o seu condomínio precisa, em um só lugar
          </h2>
          <p className="mt-3 text-muted-foreground">
            Da reserva do salão à manutenção do elevador — o CondoFlow conecta moradores, funcionários e síndicos com
            automação inteligente.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: CalendarCheck, title: "Reservas inteligentes", desc: "Calendário em tempo real, regras automáticas e pagamento integrado." },
            { icon: Flame, title: "Sauna automatizada", desc: "Confirmação, ligação no horário e checklist do funcionário sem fricção." },
            { icon: ListChecks, title: "Operação em Kanban", desc: "Tarefas recorrentes, atrasos visíveis e histórico com fotos." },
            { icon: MessageSquareWarning, title: "Problemas e sugestões", desc: "Moradores votam e acompanham — sem virar grupo de reclamação." },
            { icon: Bell, title: "Notificações multicanal", desc: "Push, e-mail e WhatsApp para o que realmente importa." },
            { icon: ShieldCheck, title: "Transparência total", desc: "Síndico no controle, morador informado, funcionário guiado." },
          ].map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elegant transition">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Automations */}
      <section id="automations" className="bg-gradient-soft border-y border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge tone="primary">Automação ponta a ponta</Badge>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                A sauna se acende sozinha. O síndico só descansa.
              </h2>
              <p className="mt-3 text-muted-foreground">
                O CondoFlow orquestra cada etapa do uso de uma área comum — da reserva do morador à execução do funcionário, com alertas em tempo real.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Reserva confirmada 2h antes automaticamente",
                  "Tarefa criada para o funcionário no horário certo",
                  "Alerta de gás ou manutenção antes do problema",
                  "Síndico vê tudo em um único painel",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card shadow-card p-6">
              <SaunaTimelinePreview />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Carla Mendes", role: "Síndica · Ed. Aurora", quote: "Reduzi 80% das mensagens no WhatsApp do prédio. O time finalmente sabe o que fazer." },
            { name: "Roberto Lima", role: "Administrador · Vista Park", quote: "Em 3 semanas, zeramos manutenções atrasadas. O painel é viciante." },
            { name: "Júlia Castro", role: "Moradora · Solar", quote: "Reservar a sauna virou um clique. E ela está sempre pronta no horário." },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center shadow-elegant">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-primary-foreground text-balance">
              Pronto para um condomínio sem caos?
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
              Implantação em 7 dias. Treinamento incluído. Cancela quando quiser.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/app/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-card px-5 text-sm font-medium text-foreground hover:opacity-95"
              >
                Ver demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary-foreground/30 px-5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
              >
                Falar com vendas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo />
          <p>© 2026 CondoFlow · Operação inteligente para condomínios</p>
        </div>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-12 gap-4 p-5 bg-background">
      <div className="col-span-3 space-y-3">
        {[
          { l: "Reservas hoje", v: "12", tone: "text-primary" },
          { l: "Tarefas pendentes", v: "7", tone: "text-warning-foreground" },
          { l: "Reclamações", v: "3", tone: "text-destructive" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.tone}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="col-span-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Operação em tempo real</p>
          <Badge tone="success">Tudo sob controle</Badge>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, i) => {
            const h = 20 + ((i * 13) % 80);
            return (
              <div key={i} className="rounded-md bg-gradient-to-t from-primary/30 to-primary/80" style={{ height: `${h}px` }} />
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-7 text-[10px] text-muted-foreground">
          {["S","T","Q","Q","S","S","D"].map((d, i) => <span key={i} className="text-center">{d}</span>)}
        </div>
      </div>
      <div className="col-span-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Atividades</p>
        <ul className="mt-3 space-y-3 text-xs">
          {[
            { c: "success", t: "Sauna 18h ligada por João" },
            { c: "primary", t: "Salão reservado · Apto 402" },
            { c: "warning", t: "Gás da sauna 15%" },
            { c: "destructive", t: "Elevador social travou" },
          ].map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full bg-${a.c}`} />
              <span>{a.t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SaunaTimelinePreview() {
  const steps = [
    { t: "Reserva criada", time: "14:02", state: "done" },
    { t: "Confirmação enviada (2h antes)", time: "16:00", state: "done" },
    { t: "Morador confirmou presença", time: "16:18", state: "done" },
    { t: "Tarefa para João: ligar sauna", time: "17:30", state: "active" },
    { t: "Sauna pronta", time: "18:00", state: "pending" },
  ];
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Sauna · Reserva #2417</p>
          <p className="text-xs text-muted-foreground">Apto 1102 · Hoje, 18h–19h</p>
        </div>
        <Badge tone="warning"><Flame className="h-3 w-3" /> Em execução</Badge>
      </div>
      <ol className="mt-6 relative border-l border-border ml-2 space-y-4">
        {steps.map((s) => (
          <li key={s.t} className="pl-5">
            <span
              className={`absolute -left-[7px] mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-card ${
                s.state === "done" ? "bg-success" : s.state === "active" ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
              }`}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{s.t}</p>
              <span className="text-xs text-muted-foreground">{s.time}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
