import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Zap,
  Brain,
  Clock,
  TrendingDown,
  Users,
  BarChart3,
  Play,
  ChevronRight,
} from "lucide-react";
import { Logo, Badge } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CondoFlow — Automatize a operação do seu condomínio" },
      {
        name: "description",
        content:
          "CondoFlow automatiza reservas, manutenção, comunicação e tarefas do condomínio com IA. Síndicos livres, moradores satisfeitos.",
      },
      { property: "og:title", content: "CondoFlow — Operação inteligente para condomínios" },
      { property: "og:description", content: "Reservas, manutenção e comunicação em um só lugar." },
    ],
  }),
  component: Landing,
});

/* ─── useInView: dispara quando o elemento entra na viewport ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── useCounter: anima um número de 0 até target ─── */
function useCounter(target: number, duration = 1800, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return value;
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Logo />
          <nav className="ml-10 hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#video"       className="hover:text-foreground transition">Vídeo</a>
            <a href="#features"    className="hover:text-foreground transition">Produto</a>
            <a href="#ia"          className="hover:text-foreground transition">IA</a>
            <a href="#how-it-works" className="hover:text-foreground transition">Como funciona</a>
            <a href="#pricing"     className="hover:text-foreground transition">Preços</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex h-9 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link
              to="/app/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3.5 text-sm font-medium text-background hover:opacity-90 transition"
            >
              Começar grátis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <Badge tone="primary">
              <Brain className="h-3 w-3" /> IA Nativa · Automação ponta a ponta
            </Badge>
            <h1 className="mt-6 text-balance text-5xl md:text-6xl font-semibold tracking-tight">
              O condomínio que se administra{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">sozinho.</span>
            </h1>
            <p className="mt-5 text-balance text-lg text-muted-foreground max-w-2xl mx-auto">
              CondoFlow conecta síndico, moradores e funcionários em uma única plataforma inteligente.
              Reservas automáticas, tarefas geradas por IA, manutenções em dia — sem grupo de WhatsApp, sem planilha, sem caos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/app/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-hero px-6 text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 transition"
              >
                Começar agora <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#video"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium hover:bg-muted transition"
              >
                <Play className="h-4 w-4 fill-current" /> Ver o vídeo
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Grátis nos primeiros 30 dias · Implantação em 7 dias · Cancele quando quiser
            </p>
          </div>

          {/* Stats row */}
          <StatsRow />

          {/* Dashboard mock */}
          <div className="relative mt-16 mx-auto max-w-6xl animate-slide-up">
            <div className="absolute -inset-x-10 -inset-y-6 bg-gradient-hero opacity-20 blur-3xl rounded-[3rem]" />
            <div className="relative rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted/40">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-3 text-xs text-muted-foreground">condo-flow-os.lovable.app/dashboard</span>
              </div>
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos ── */}
      <section className="border-y border-border/60 bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
            Usado por administradoras e síndicos profissionais em todo o Brasil
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-6 opacity-50">
            {["Aurora", "Vista Park", "Solar", "Atlântico", "Belvedere", "Skyline"].map((n) => (
              <div key={n} className="flex items-center justify-center gap-2 text-sm font-medium tracking-tight">
                <Building2 className="h-4 w-4" /> {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vídeo ── */}
      <section id="video" className="mx-auto max-w-7xl px-6 py-24">
        <VideoSection />
      </section>

      {/* ── Problem ── */}
      <ProblemSection />

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <FeaturesSection />
      </section>

      {/* ── IA ── */}
      <section id="ia" className="bg-gradient-soft border-y border-border/60">
        <IASection />
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24">
        <HowItWorksSection />
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-muted/30 border-y border-border/60 py-24">
        <TestimonialsSection />
      </section>

      {/* ── CTA / Pricing ── */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">
        <CTASection />
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

/* ════════════════════════ STATS ROW ════════════════════════ */
function StatsRow() {
  const { ref, inView } = useInView(0.3);
  const msgs = useCounter(80, 1600, inView);
  const manut = useCounter(0, 900, inView);
  const min = useCounter(30, 1200, inView);
  const tasks = useCounter(100, 1500, inView);

  const stats = [
    { value: msgs,  suffix: "%", label: "menos mensagens no WhatsApp", color: "text-primary" },
    { value: manut, suffix: "",  label: "manutenções atrasadas", prefix: "zero ", color: "text-success" },
    { value: min,   suffix: "d", label: "de implantação", color: "text-warning" },
    { value: tasks, suffix: "%", label: "das tarefas criadas pela IA", color: "text-primary" },
  ];

  return (
    <div ref={ref} className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="text-center"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
          }}
        >
          <div className={`text-4xl font-semibold tracking-tight ${s.color}`}>
            {s.prefix}{s.value}{s.suffix}
          </div>
          <div className="mt-1 text-xs text-muted-foreground leading-snug">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════ VIDEO SECTION ════════════════════════ */
function VideoSection() {
  const { ref, inView } = useInView(0.1);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (inView && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [inView]);

  return (
    <div ref={ref}>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Badge tone="primary"><Play className="h-3 w-3 fill-current" /> Vídeo demonstração</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Veja o CondoFlow em{" "}
          <span className="bg-gradient-hero bg-clip-text text-transparent">60 segundos</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Do caos do grupo de WhatsApp à operação inteligente — em um minuto você entende por que síndicos trocam planilha pelo CondoFlow.
        </p>
      </div>

      <div
        className="relative mx-auto max-w-5xl"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "scale(1) translateY(0)" : "scale(0.97) translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        {/* Glow atrás do vídeo */}
        <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-3xl rounded-[3rem]" />

        <div className="relative rounded-2xl overflow-hidden border border-border shadow-elegant">
          {/* Barra de título estilo browser */}
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted/60">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            <span className="ml-3 text-xs text-muted-foreground">CondoFlow · Demonstração oficial</span>
          </div>

          <video
            ref={videoRef}
            src="/condoflow-promo.mp4"
            muted
            loop
            playsInline
            controls
            className="w-full block bg-black"
            style={{ aspectRatio: "16/9" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ PROBLEM SECTION ════════════════════════ */
function ProblemSection() {
  const { ref, inView } = useInView();
  const pains = [
    { icon: MessageSquareWarning, text: "Grupos de WhatsApp com 200 mensagens por dia sobre reservas, reclamações e manutenções" },
    { icon: TrendingDown,         text: "Planilhas desatualizadas que ninguém sabe quem preencheu por último" },
    { icon: Clock,                text: "Sauna vazia porque ninguém lembrou de ligar, e morador frustrado pela segunda vez" },
    { icon: Users,                text: "Funcionários sem saber o que fazer hoje — e síndico respondendo WhatsApp às 23h" },
  ];

  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div ref={ref} className="grid lg:grid-cols-2 gap-16 items-center">
          <div
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-30px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/20 text-destructive px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              O problema
            </span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-balance">
              Administrar condomínio virou um segundo emprego — e não deveria.
            </h2>
            <p className="mt-4 text-background/70 leading-relaxed">
              Síndicos passam horas por semana respondendo mensagens repetitivas, lembrando funcionários de tarefas básicas e tentando
              organizar informações espalhadas em grupos, e-mails e cadernos. Isso não é gestão — é apagar incêndio.
            </p>
          </div>
          <ul className="space-y-5">
            {pains.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-4"
                style={{
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateX(0)" : "translateX(30px)",
                  transition: `opacity 0.6s ease ${200 + i * 100}ms, transform 0.6s ease ${200 + i * 100}ms`,
                }}
              >
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                  <p.icon className="h-5 w-5" />
                </span>
                <p className="text-background/80 leading-relaxed text-sm">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════ FEATURES SECTION ════════════════════════ */
function FeaturesSection() {
  const { ref, inView } = useInView(0.05);

  const features = [
    {
      icon: CalendarCheck,
      title: "Reservas inteligentes",
      desc: "Calendário de áreas comuns em tempo real. Moradores reservam pelo app, o sistema verifica conflitos, aplica as regras do condomínio e envia confirmação automática — sem o síndico tocar em nada.",
      detail: "Suporta taxas, limite por apartamento, horários bloqueados e aprovação manual quando necessário.",
    },
    {
      icon: Flame,
      title: "Sauna automatizada",
      desc: "Quando uma reserva de sauna é confirmada, o CondoFlow automaticamente cria a tarefa para o zelador ligar o equipamento no horário certo, envia lembrete ao morador 2h antes e registra tudo em log.",
      detail: "Funciona para qualquer área: piscina, churrasqueira, salão de festas, academia.",
    },
    {
      icon: Brain,
      title: "IA que gera tarefas",
      desc: "Descreva o que precisa ser feito e a IA do CondoFlow cria um plano de tarefas completo, atribui responsáveis, define prazos e organiza por prioridade — em segundos.",
      detail: "\"Preparar o condomínio para o verão\" vira 12 tarefas detalhadas com responsáveis e datas.",
    },
    {
      icon: ListChecks,
      title: "Operação em Kanban",
      desc: "Todas as tarefas do condomínio em um quadro visual. Tarefas recorrentes configuradas uma vez e repetidas automaticamente. Atrasos ficam visíveis com destaque para ação imediata.",
      detail: "Histórico com fotos, checklist por etapa e assinatura digital de conclusão.",
    },
    {
      icon: MessageSquareWarning,
      title: "Ocorrências e sugestões",
      desc: "Moradores reportam problemas com foto, localização e descrição. Outros moradores votam na prioridade. O síndico responde e o status é atualizado para todos — sem grupo de reclamação.",
      detail: "Dashboard mostra ocorrências por área, frequência e tempo médio de resolução.",
    },
    {
      icon: Bell,
      title: "Notificações multicanal",
      desc: "Push no app, e-mail e WhatsApp — cada pessoa recebe no canal que prefere, só sobre o que é relevante para ela. Sem spam, sem silêncio: o certo, na hora certa, para quem importa.",
      detail: "Configuração granular: morador escolhe o que quer receber. Síndico tem visão de todos.",
    },
    {
      icon: BarChart3,
      title: "Analytics em tempo real",
      desc: "Painel com índice de satisfação, taxa de uso de áreas, manutenções por categoria, evolução mensal e relatório mensal gerado automaticamente para apresentar em assembléia.",
      detail: "Exporta PDF para ata de assembleia com um clique.",
    },
    {
      icon: ShieldCheck,
      title: "Transparência e controle",
      desc: "Síndico vê tudo em um único painel. Moradores acompanham o que foi feito. Funcionários sabem exatamente o que e quando executar. Auditoria completa de cada ação no sistema.",
      detail: "Controle de acesso por perfil: síndico, subsíndico, zelador, morador e porteiro.",
    },
    {
      icon: Zap,
      title: "Implantação em 7 dias",
      desc: "Time de onboarding configura o condomínio, importa os moradores, treina os funcionários e acompanha a primeira semana de operação. Você não precisa saber de tecnologia.",
      detail: "Suporte via chat em horário comercial e base de conhecimento em vídeo.",
    },
  ];

  return (
    <>
      <div className="max-w-2xl">
        <Badge tone="primary">Plataforma completa</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Tudo que o seu condomínio precisa, em um só lugar
        </h2>
        <p className="mt-3 text-muted-foreground">
          Da reserva do salão à manutenção do elevador — o CondoFlow conecta moradores, funcionários e síndicos com automação inteligente e IA nativa.
        </p>
      </div>

      <div ref={ref} className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(28px)",
              transition: `opacity 0.55s ease ${i * 60}ms, transform 0.55s ease ${i * 60}ms, box-shadow 0.3s ease`,
            }}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            <p className="mt-3 text-xs text-primary/80 font-medium border-t border-border/60 pt-3">
              <ChevronRight className="inline h-3 w-3 mr-0.5" />{f.detail}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

/* ════════════════════════ IA SECTION ════════════════════════ */
function IASection() {
  const { ref, inView } = useInView();

  const iaFeatures = [
    { title: "Geração de tarefas", desc: "Descreva o que precisa ser feito em linguagem natural. A IA cria tarefas detalhadas, atribui responsáveis e define prazos." },
    { title: "Análise de ocorrências", desc: "A IA lê as ocorrências reportadas, identifica padrões e sugere ações preventivas antes que o problema se repita." },
    { title: "Cronograma preditivo", desc: "Com base no histórico do condomínio, a IA prevê quando manutenções preventivas devem ser agendadas." },
    { title: "Relatórios automáticos", desc: "Relatório mensal gerado e formatado pela IA para apresentar em assembleia — sem precisar montar planilha." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-24">
      <div ref={ref} className="grid lg:grid-cols-2 gap-16 items-center">
        <div
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(-30px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <Badge tone="primary"><Brain className="h-3 w-3" /> Inteligência artificial</Badge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            A IA trabalha enquanto você descansa.
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            O CondoFlow tem IA nativa — não é uma integração de terceiros, é parte do núcleo da plataforma.
            Ela aprende o ritmo do seu condomínio e antecipa o que precisa ser feito.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 font-mono text-sm">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground text-xs">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              IA CondoFlow · Processando
            </div>
            <TypingDemo />
          </div>
        </div>

        <ul className="space-y-5">
          {iaFeatures.map((f, i) => (
            <li
              key={f.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : "translateX(30px)",
                transition: `opacity 0.6s ease ${100 + i * 120}ms, transform 0.6s ease ${100 + i * 120}ms`,
              }}
            >
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TypingDemo() {
  const lines = [
    "> Gerar tarefas para preparar o condomínio para o verão",
    "",
    "✦ Criando 8 tarefas...",
    "",
    "1. Verificar bomba da piscina — Pedro · 15/nov",
    "2. Limpeza completa da piscina — João · 20/nov",
    "3. Checar chuveiros da área externa — Carlos · 18/nov",
    "4. Manutenção do filtro de areia — Pedro · 22/nov",
    "5. Repor cloro e pH — João · semanal",
  ];
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= lines.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), visible === 0 ? 600 : 250);
    return () => clearTimeout(t);
  }, [visible, lines.length]);

  return (
    <div className="space-y-1">
      {lines.slice(0, visible).map((l, i) => (
        <div
          key={i}
          className={`${l.startsWith(">") ? "text-primary font-semibold" : l.startsWith("✦") ? "text-success" : l === "" ? "h-2" : "text-foreground/80"}`}
        >
          {l}
        </div>
      ))}
      {visible < lines.length && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse align-middle" />
      )}
    </div>
  );
}

/* ════════════════════════ HOW IT WORKS ════════════════════════ */
function HowItWorksSection() {
  const { ref, inView } = useInView(0.05);

  const steps = [
    {
      number: "01",
      title: "Cadastro do condomínio",
      desc: "Em 7 dias, nosso time configura o condomínio, importa a lista de moradores e treina os funcionários. Você não precisa fazer nada técnico.",
      detail: ["Importação automática de planilhas existentes", "Configuração de áreas comuns e regras", "Treinamento da equipe incluído"],
    },
    {
      number: "02",
      title: "Moradores entram no app",
      desc: "Cada morador recebe um convite personalizado. Instala o app, confirma o apartamento e já pode reservar áreas, reportar ocorrências e acompanhar a operação.",
      detail: ["Convite por e-mail ou link direto", "App para iOS e Android", "Também acessível pelo navegador"],
    },
    {
      number: "03",
      title: "IA assume a operação",
      desc: "O sistema aprende o ritmo do condomínio. Reservas confirmadas automaticamente, tarefas distribuídas para funcionários, alertas antes dos problemas acontecerem.",
      detail: ["Sem intervenção manual nas confirmações", "Tarefas recorrentes criadas automaticamente", "Alertas preditivos baseados em histórico"],
    },
    {
      number: "04",
      title: "Síndico só supervisiona",
      desc: "Você abre o painel uma vez por dia e vê tudo que aconteceu, o que está pendente e o que precisa de atenção. O resto o CondoFlow resolve sozinho.",
      detail: ["Painel consolidado de toda a operação", "Relatório diário enviado por e-mail", "Escalamento automático para o síndico quando necessário"],
    },
  ];

  return (
    <>
      <div className="text-center max-w-2xl mx-auto mb-16">
        <Badge tone="primary">Como funciona</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Da planilha ao piloto automático em 4 passos
        </h2>
        <p className="mt-3 text-muted-foreground">
          Implantamos, configuramos e treinamos sua equipe. Você só precisa aprovar.
        </p>
      </div>

      <div ref={ref} className="grid md:grid-cols-2 gap-6">
        {steps.map((s, i) => (
          <div
            key={s.number}
            className="rounded-2xl border border-border bg-card p-7 shadow-card"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(28px)",
              transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms`,
            }}
          >
            <div className="text-5xl font-semibold text-primary/20 tracking-tight leading-none mb-4">{s.number}</div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            <ul className="mt-4 space-y-2">
              {s.detail.map((d) => (
                <li key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

/* ════════════════════════ TESTIMONIALS ════════════════════════ */
function TestimonialsSection() {
  const { ref, inView } = useInView(0.05);

  const testimonials = [
    {
      name: "Carla Mendes",
      role: "Síndica · Ed. Aurora · SP",
      quote: "Reduzi 80% das mensagens no WhatsApp do prédio. Em 3 semanas o grupo de moradores parou de pedir informações — porque agora eles encontram tudo no app.",
      metric: "80% ↓ mensagens",
    },
    {
      name: "Roberto Lima",
      role: "Administrador · Vista Park · RJ",
      quote: "Em 3 semanas zeramos as manutenções atrasadas. O painel do CondoFlow mostrou o que estava represado e a IA criou o plano de ação. Nunca mais perdemos prazo.",
      metric: "Zero atrasos",
    },
    {
      name: "Júlia Castro",
      role: "Síndica profissional · 4 condomínios · MG",
      quote: "Administro 4 condomínios e antes era impossível. Hoje o CondoFlow gerencia a operação dos 4 — eu só monitoro o painel uma vez por dia e resolvo as exceções.",
      metric: "4x mais condomínios",
    },
    {
      name: "Marcos Antunes",
      role: "Zelador · Residencial Solar · RS",
      quote: "Antes eu ficava esperando o síndico me mandar mensagem. Agora abro o app e já sei o que fazer hoje, em que ordem e com que material. Trabalho muito mais tranquilo.",
      metric: "Equipe produtiva",
    },
    {
      name: "Ana Beatriz Souza",
      role: "Moradora · Ed. Atlântico · BA",
      quote: "Reservei a churrasqueira em 30 segundos pelo app, recebi confirmação automática e no dia estava tudo pronto. Antes tinha que ligar pro síndico e esperar retorno.",
      metric: "Reserva em 30s",
    },
    {
      name: "Fernando Pires",
      role: "Síndico · Ed. Belvedere · MG",
      quote: "A IA do CondoFlow previu que a bomba da piscina ia falhar antes de acontecer, baseada no histórico de manutenção. Economizamos R$8.000 em conserto emergencial.",
      metric: "R$8k economizados",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Badge tone="primary"><Star className="h-3 w-3 fill-current" /> Depoimentos reais</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Síndicos que viraram fãs
        </h2>
        <p className="mt-3 text-muted-foreground">
          Resultados reais de quem trocou planilha e WhatsApp pelo CondoFlow.
        </p>
      </div>
      <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(24px)",
              transition: `opacity 0.55s ease ${i * 70}ms, transform 0.55s ease ${i * 70}ms`,
            }}
          >
            <div className="flex gap-0.5 text-warning">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-warning" />)}
            </div>
            <p className="mt-3 text-sm leading-relaxed flex-1">"{t.quote}"</p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-gradient-hero text-primary-foreground inline-flex items-center justify-center text-xs font-semibold shrink-0">
                  {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-medium leading-tight">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-lg whitespace-nowrap">
                {t.metric}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════ CTA SECTION ════════════════════════ */
function CTASection() {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 lg:p-16 text-center shadow-elegant"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1)" : "scale(0.97)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative max-w-2xl mx-auto">
        <Badge tone="primary">
          <Sparkles className="h-3 w-3" /> 30 dias grátis
        </Badge>
        <h2 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-primary-foreground text-balance">
          Pronto para um condomínio sem caos?
        </h2>
        <p className="mt-4 text-primary-foreground/80 leading-relaxed">
          Implantação em 7 dias. Treinamento incluído. Suporte humano. Cancele quando quiser.
          Nosso time configura tudo — você só precisa dizer "vamos".
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/dashboard"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-card px-7 text-sm font-semibold text-foreground hover:opacity-95 shadow-card"
          >
            Começar agora <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-primary-foreground/30 px-7 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10"
          >
            Falar com a equipe
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-primary-foreground/70">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 30 dias grátis</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Implantação em 7 dias</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Treinamento incluso</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Sem fidelidade</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ DASHBOARD PREVIEW ════════════════════════ */
function DashboardPreview() {
  return (
    <div className="grid grid-cols-12 gap-4 p-5 bg-background">
      <div className="col-span-3 space-y-3">
        {[
          { l: "Reservas hoje", v: "12", tone: "text-primary" },
          { l: "Tarefas pendentes", v: "7", tone: "text-warning" },
          { l: "Ocorrências", v: "3", tone: "text-destructive" },
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
            return <div key={i} className="rounded-md bg-gradient-to-t from-primary/30 to-primary/80" style={{ height: `${h}px` }} />;
          })}
        </div>
        <div className="mt-4 grid grid-cols-7 text-[10px] text-muted-foreground">
          {["S","T","Q","Q","S","S","D"].map((d, i) => <span key={i} className="text-center">{d}</span>)}
        </div>
      </div>
      <div className="col-span-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Atividades recentes</p>
        <ul className="mt-3 space-y-3 text-xs">
          {[
            { c: "bg-success",     t: "Sauna 18h ligada por João" },
            { c: "bg-primary",     t: "Salão reservado · Apto 402" },
            { c: "bg-warning",     t: "Gás da sauna 15%" },
            { c: "bg-destructive", t: "Elevador social travou" },
          ].map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${a.c}`} />
              <span>{a.t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
