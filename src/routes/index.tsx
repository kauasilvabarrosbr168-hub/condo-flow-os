import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Bell,
  ListChecks,
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
  LifeBuoy,
  X,
} from "lucide-react";
import { Logo, Badge } from "@/components/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CondoFlow: automatize a operação do seu condomínio" },
      {
        name: "description",
        content:
          "CondoFlow automatiza reservas, manutenção, comunicação e tarefas do condomínio com IA. Síndicos livres, moradores satisfeitos.",
      },
      { property: "og:title", content: "CondoFlow: operação inteligente para condomínios" },
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

/* ─── useTilt: inclinação 3D sutil seguindo o cursor — só desktop com mouse,
   desliga sozinho em touch e em "reduzir movimento" (não é a animação principal,
   por isso não pode depender só da regra global de transição) ─── */
function useTilt(maxDeg = 3.5) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const canTilt =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canTilt) return;

    const handleMove = (e: PointerEvent) => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setStyle({
          transform: `perspective(1200px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg)`,
          transition: "transform 0.1s ease-out",
          willChange: "transform",
        });
      });
    };
    const handleLeave = () => {
      setStyle({
        transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform",
      });
    };

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerleave", handleLeave);
    return () => {
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerleave", handleLeave);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [maxDeg]);

  return { ref, style };
}

/* ─── useScrollProgress: 0→1 conforme a seção passa pela viewport ao rolar —
   liga o listener só enquanto a seção está por perto e desliga sozinho fora
   dela; nunca corre em prefers-reduced-motion ─── */
function useScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const update = () => {
      frame.current = null;
      const rect = el.getBoundingClientRect();
      setProgress(Math.min(Math.max(-rect.top / rect.height, 0), 1));
    };
    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(update);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.addEventListener("scroll", onScroll, { passive: true });
          update();
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "50% 0px 50% 0px" }
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return { ref, progress };
}

/* ─── ProblemReadouts: textura ambiente no fundo do hero — pequenos "registros"
   de resolução de problemas (ids, tempos, confirmações) em 3 profundidades,
   deslizando em velocidades diferentes conforme rola (sensação de paralaxe 3D).
   Puramente decorativo/ilustrativo — não é uma métrica real do produto. ─── */
function ProblemReadouts() {
  const { ref, progress } = useScrollProgress();

  const items: { t: string; x: string; y: string; depth: 1 | 2 | 3; tone?: "success" }[] = [
    { t: "#1042 resolvido", x: "8%",  y: "20%", depth: 1 },
    { t: "00:02:14",        x: "84%", y: "14%", depth: 2 },
    { t: "SLA ok",          x: "20%", y: "64%", depth: 2, tone: "success" },
    { t: "#1043 resolvido", x: "72%", y: "72%", depth: 1 },
    { t: "concluído",       x: "42%", y: "10%", depth: 3, tone: "success" },
    { t: "tarefa fechada",  x: "90%", y: "46%", depth: 1 },
    { t: "#1044 resolvido", x: "6%",  y: "84%", depth: 2 },
    { t: "0 pendências",    x: "60%", y: "88%", depth: 3 },
    { t: "ocorrência ✓",    x: "30%", y: "42%", depth: 2, tone: "success" },
    { t: "#1045 resolvido", x: "86%", y: "82%", depth: 1 },
    { t: "checklist ok",    x: "52%", y: "56%", depth: 3 },
  ];

  const depthCfg = {
    1: { mult: 14, opacity: 0.06, blur: "0.4px", size: "text-xs", scaleTo: 1.02 },
    2: { mult: 26, opacity: 0.09, blur: "0px",   size: "text-xs",     scaleTo: 1.05 },
    3: { mult: 42, opacity: 0.13, blur: "0px",   size: "text-sm",     scaleTo: 1.09 },
  } as const;

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => {
        const cfg = depthCfg[it.depth];
        const translate = -progress * cfg.mult;
        const scale = 1 + progress * (cfg.scaleTo - 1);
        return (
          <span
            key={i}
            className={`absolute font-mono tabular-nums text-muted-foreground ${cfg.size} ${it.depth === 1 ? "hidden sm:block" : ""}`}
            style={{
              left: it.x,
              top: it.y,
              opacity: cfg.opacity,
              filter: cfg.blur !== "0px" ? `blur(${cfg.blur})` : undefined,
              transform: `translateY(${translate}px) scale(${scale})`,
              color: it.tone === "success" ? "var(--success)" : undefined,
            }}
          >
            {it.t}
          </span>
        );
      })}
    </div>
  );
}

function Landing() {
  const tilt = useTilt();
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 950);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Logo />
          <nav className="ml-10 hidden lg:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#video"       className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Vídeo</a>
            <a href="#features"    className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Produto</a>
            <a href="#ia"          className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">IA</a>
            <a href="#how-it-works" className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Como funciona</a>
            <a href="#pricing"     className="rounded-sm transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">Preços</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex h-9 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg">
              Entrar
            </Link>
            <Link
              to="/app/dashboard"
              className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-hero px-3.5 text-sm font-medium text-primary-foreground btn-plate hover:opacity-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Começar grátis <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <ProblemReadouts />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-28 lg:pb-20">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <Badge tone="primary" className="uppercase tracking-wide">
              <Brain className="h-3 w-3" /> IA Nativa · Automação ponta a ponta
            </Badge>
            <h1 className="mt-6 text-balance text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight">
              O condomínio que se administra{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">sozinho.</span>
            </h1>
            <p className="mt-5 text-balance text-lg text-muted-foreground max-w-2xl mx-auto">
              CondoFlow conecta síndico, moradores e funcionários em uma única plataforma inteligente.
              Reservas automáticas, tarefas geradas por IA, manutenções em dia. Sem grupo de WhatsApp, sem planilha, sem caos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/app/dashboard"
                className="group inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-hero px-6 text-sm font-medium text-primary-foreground btn-plate hover:opacity-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Começar agora <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#video"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-medium hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Play className="h-4 w-4 fill-current" /> Ver o vídeo
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Implantação em 7 dias · Cancele quando quiser · 30 dias grátis a partir do Profissional
            </p>
          </div>

          {/* Stats row */}
          <StatsRow />

          {/* Dashboard mock */}
          <div className="relative mt-16 mx-auto max-w-6xl animate-slide-up" style={{ perspective: "1200px" }}>
            <div className="absolute -inset-x-10 -inset-y-6 bg-gradient-hero opacity-20 blur-3xl rounded-[3rem]" />
            <div
              ref={tilt.ref}
              style={tilt.style}
              className="relative rounded-2xl bg-card panel-plate overflow-hidden"
            >
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted/40">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60 dot-power-on" style={{ animationDelay: "650ms" }} />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70 dot-power-on" style={{ animationDelay: "780ms" }} />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70 dot-power-on" style={{ animationDelay: "910ms" }} />
                <span className="ml-3 min-w-0 flex-1 truncate text-xs text-muted-foreground">condoflow.site/dashboard</span>
              </div>
              <DashboardPreview booted={booted} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos ── */}
      <section className="border-y border-border/60 bg-muted/30 py-10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
            Usado por administradoras e síndicos profissionais em todo o Brasil
          </p>
        </div>
        <div className="mt-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex marquee-track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="flex shrink-0 min-w-[100vw] items-center justify-around gap-10 px-6 opacity-50"
              >
                {["Aurora", "Vista Park", "Solar", "Atlântico", "Belvedere", "Skyline"].map((n) => (
                  <div key={n} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-medium tracking-tight">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {n[0]}
                    </span>
                    {n}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vídeo ── */}
      <section id="video" className="scroll-mt-20 mx-auto max-w-7xl px-6 py-24">
        <VideoSection />
      </section>

      {/* ── Problem ── */}
      <ProblemSection />

      {/* ── Para quem é o CondoFlow ── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <AudienceSection />
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-20 mx-auto max-w-7xl px-6 py-24">
        <FeaturesSection />
      </section>

      {/* ── IA ── */}
      <section id="ia" className="scroll-mt-20 bg-gradient-soft border-y border-border/60">
        <IASection />
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-7xl px-6 py-24">
        <HowItWorksSection />
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-muted/30 border-y border-border/60 py-24">
        <TestimonialsSection />
      </section>

      {/* ── CTA / Pricing ── */}
      <section id="pricing" className="scroll-mt-20 mx-auto max-w-7xl px-6 py-24">
        <PricingSection />
        <div className="mt-12">
          <CTASection />
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
          <div className={`text-5xl font-semibold tracking-tight tabular-nums ${s.color}`}>
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
        <Badge tone="primary" className="uppercase tracking-wide"><Play className="h-3 w-3 fill-current" /> Vídeo demonstração</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Veja o CondoFlow em{" "}
          <span className="bg-gradient-hero bg-clip-text text-transparent">60 segundos</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Do caos do grupo de WhatsApp à operação inteligente: em um minuto você entende por que síndicos trocam planilha pelo CondoFlow.
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

        <div className="relative rounded-2xl overflow-hidden panel-plate">
          {/* Barra de título estilo browser */}
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 bg-muted/60">
            <span className={`h-2.5 w-2.5 rounded-full bg-destructive/60 ${inView ? "dot-power-on" : "opacity-0"}`} style={{ animationDelay: "350ms" }} />
            <span className={`h-2.5 w-2.5 rounded-full bg-warning/70 ${inView ? "dot-power-on" : "opacity-0"}`} style={{ animationDelay: "480ms" }} />
            <span className={`h-2.5 w-2.5 rounded-full bg-success/70 ${inView ? "dot-power-on" : "opacity-0"}`} style={{ animationDelay: "610ms" }} />
            <span className="ml-3 min-w-0 flex-1 truncate text-xs text-muted-foreground">CondoFlow · Demonstração oficial</span>
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
    { icon: Users,                text: "Funcionários sem saber o que fazer hoje, com o síndico respondendo WhatsApp às 23h" },
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
              Administrar condomínio virou um segundo emprego. E não deveria.
            </h2>
            <p className="mt-4 text-background/70 leading-relaxed">
              Síndicos passam horas por semana respondendo mensagens repetitivas, lembrando funcionários de tarefas básicas e tentando
              organizar informações espalhadas em grupos, e-mails e cadernos. Isso não é gestão, é apagar incêndio.
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
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive buzzer-chip">
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

/* ════════════════════════ AUDIENCE SECTION ════════════════════════ */
function AudienceSection() {
  const { ref, inView } = useInView(0.05);
  const [tab, setTab] = useState<"sindico" | "administradora" | "morador">("sindico");

  const content = {
    sindico: {
      label: "Síndico",
      image: "/persona-sindico.png",
      alt: "Síndico consultando o CondoFlow pelo celular",
      heading: "Para o síndico que quer ser mais eficiente",
      desc: "Cuide do condomínio sem virar um segundo emprego. A tecnologia assume o operacional, você só supervisiona.",
      bullets: [
        "Emissão rápida de avisos e gestão de chamados",
        "Reservas de áreas comuns automatizadas",
        "Agenda de manutenções completa",
        "Tarefas geradas e atribuídas pela IA",
      ],
      cards: [
        { label: "Chamados abertos", value: "2" },
        { label: "Próxima reserva", value: "Salão · 19h" },
      ],
    },
    administradora: {
      label: "Administradora",
      image: "/persona-administradora.png",
      alt: "Equipe de administradora acompanhando os condomínios no CondoFlow",
      heading: "Para a administradora que gerencia várias operações",
      desc: "Um painel só pra todos os condomínios que você administra, com gestão de conta dedicada.",
      bullets: [
        "Multi-condomínio num painel só",
        "Relatórios consolidados entre condomínios",
        "Gestor de conta exclusivo",
        "Onboarding dedicado para toda a equipe",
      ],
      cards: [
        { label: "Condomínios ativos", value: "8" },
        { label: "Unidades administradas", value: "142" },
      ],
    },
    morador: {
      label: "Morador",
      image: "/persona-morador.png",
      alt: "Moradora resolvendo demandas do condomínio pelo celular",
      heading: "Para o morador que quer mais conforto e praticidade",
      desc: "Com o CondoFlow, todas as demandas são resolvidas pelo celular, sem estresse.",
      bullets: [
        "Abertura de chamados e reclamações",
        "Reserva rápida de áreas comuns",
        "Recebimento de avisos e notificações",
        "Organização de encomendas e entregas",
      ],
      cards: [
        { label: "Encomenda chegou", value: "Hoje · 14h32" },
        { label: "Reserva confirmada", value: "Salão · sáb" },
      ],
    },
  } as const;

  const c = content[tab];

  return (
    <div ref={ref}>
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge tone="primary" className="uppercase tracking-wide">Plataforma completa</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">Para quem é o CondoFlow?</h2>
      </div>

      <div className="flex justify-center mb-10">
        <div className="inline-flex rounded-full bg-muted p-1">
          {(Object.keys(content) as Array<keyof typeof content>).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {content[t].label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="grid lg:grid-cols-2 gap-12 items-center"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Foto por persona salva em public/persona-*.png. */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted panel-plate">
          <img src={c.image} alt={c.alt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute left-6 top-6 rounded-xl bg-card panel-plate px-4 py-3">
            <p className="text-xs text-muted-foreground">{c.cards[0].label}</p>
            <p className="text-lg font-semibold tabular-nums">{c.cards[0].value}</p>
          </div>
          <div className="absolute bottom-6 right-6 rounded-xl bg-card panel-plate px-4 py-3">
            <p className="text-xs text-muted-foreground">{c.cards[1].label}</p>
            <p className="text-lg font-semibold tabular-nums">{c.cards[1].value}</p>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-balance">{c.heading}</h3>
          <p className="mt-3 text-muted-foreground leading-relaxed">{c.desc}</p>
          <ul className="mt-5 space-y-3">
            {c.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /> {b}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link
              to="/app/dashboard"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-hero px-6 text-sm font-medium text-primary-foreground btn-plate hover:opacity-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Começar agora <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a href="#video" className="text-sm font-medium text-primary hover:underline">Assista uma demonstração</a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ FEATURES SECTION ════════════════════════ */
function FeaturesSection() {
  const { ref, inView } = useInView(0.05);

  const features = [
    {
      icon: CalendarCheck,
      title: "Reservas inteligentes",
      desc: "Calendário de áreas comuns em tempo real. Moradores reservam pelo app, o sistema verifica conflitos, aplica as regras do condomínio e envia confirmação automática, sem o síndico tocar em nada.",
      detail: "Suporta taxas, limite por apartamento, horários bloqueados e aprovação manual quando necessário.",
    },
    {
      icon: Zap,
      title: "Automação pós-reserva",
      desc: "Quando uma reserva é confirmada, o CondoFlow cria automaticamente a tarefa pro zelador preparar a área no horário certo, avisa o morador antes do evento e registra tudo em log.",
      detail: "Funciona pra qualquer área: sauna, piscina, churrasqueira, salão de festas, academia.",
    },
    {
      icon: Brain,
      title: "IA que gera tarefas",
      desc: "Descreva o que precisa ser feito e a IA do CondoFlow cria um plano de tarefas completo, atribui responsáveis, define prazos e organiza por prioridade em segundos.",
      detail: "\"Reformar a área da piscina\" vira 10 tarefas detalhadas com responsáveis e prazos.",
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
      desc: "Moradores reportam problemas com foto, localização e descrição. Outros moradores votam na prioridade. O síndico responde e o status é atualizado para todos, sem grupo de reclamação.",
      detail: "Dashboard mostra ocorrências por área, frequência e tempo médio de resolução.",
    },
    {
      icon: Bell,
      title: "Notificações multicanal",
      desc: "Push no app, e-mail e WhatsApp: cada pessoa recebe no canal que prefere, só sobre o que é relevante para ela. Sem spam, sem silêncio: o certo, na hora certa, para quem importa.",
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
      icon: LifeBuoy,
      title: "Suporte quando você precisar",
      desc: "Chat em horário comercial com gente de verdade, base de conhecimento em vídeo, e o time que implantou seu condomínio continua acompanhando depois que o app está no ar.",
      detail: "Sem depender só de IA: se travar, tem humano do outro lado.",
    },
  ];

  return (
    <>
      <div className="max-w-2xl">
        <Badge tone="primary" className="uppercase tracking-wide">Plataforma completa</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Tudo que o seu condomínio precisa, em um só lugar
        </h2>
        <p className="mt-3 text-muted-foreground">
          Da reserva do salão à manutenção do elevador, o CondoFlow conecta moradores, funcionários e síndicos com automação inteligente e IA nativa.
        </p>
      </div>

      <div ref={ref} className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="group rounded-2xl bg-card p-6 panel-plate panel-plate-hover"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(28px)",
              transition: `opacity 0.55s ease ${i * 60}ms, transform 0.55s ease ${i * 60}ms, box-shadow 0.3s ease`,
            }}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary buzzer-chip transition">
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
    { title: "Relatórios automáticos", desc: "Relatório mensal gerado e formatado pela IA para apresentar em assembleia, sem precisar montar planilha." },
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
          <Badge tone="primary" className="uppercase tracking-wide"><Brain className="h-3 w-3" /> Inteligência artificial</Badge>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            A IA trabalha enquanto você descansa.
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            O CondoFlow tem IA nativa: não é uma integração de terceiros, é parte do núcleo da plataforma.
            Ela aprende o ritmo do seu condomínio e antecipa o que precisa ser feito.
          </p>
          <div className="mt-8">
            <PhoneAIDemo />
          </div>
        </div>

        <ul className="space-y-5">
          {iaFeatures.map((f, i) => (
            <li
              key={f.title}
              className="flex items-start gap-4 rounded-2xl bg-card panel-plate p-5"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : "translateX(30px)",
                transition: `opacity 0.6s ease ${100 + i * 120}ms, transform 0.6s ease ${100 + i * 120}ms`,
              }}
            >
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary buzzer-chip">
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

/* ─── PhoneAIDemo: mockup de celular com chat estilo WhatsApp — mostra a IA
   recebendo o pedido e gerando as tarefas, como no canal real do produto. ─── */
function PhoneAIDemo() {
  const { ref, inView } = useInView(0.4);
  return (
    <div ref={ref} className="mx-auto w-full max-w-[260px]">
      <div className="relative rounded-[2.25rem] border-[8px] border-foreground bg-foreground shadow-elegant">
        <span className="absolute left-1/2 top-0 z-10 h-4 w-24 -translate-x-1/2 rounded-b-xl bg-foreground" />
        <div className="relative aspect-[9/18] overflow-hidden rounded-[1.75rem] bg-background">
          <div className="flex items-center gap-2 bg-gradient-hero px-3 py-2.5 text-primary-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <Brain className="h-3.5 w-3.5" />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold">CondoFlow IA</p>
              <p className="text-xs opacity-80">online</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <ChatTaskDemo active={inView} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ChatTaskDemo: só começa a animar quando o celular entra na tela (não
   no mount da página) e repete em loop, com pausa de leitura entre cada
   tarefa e no final. Respeita prefers-reduced-motion (mostra tudo estático,
   sem repetir). ─── */
function ChatTaskDemo({ active }: { active: boolean }) {
  const lines = [
    "Verificar bomba da piscina · Pedro · 15/nov",
    "Limpeza completa da piscina · João · 20/nov",
    "Checar chuveiros da área externa · Carlos · 18/nov",
    "Manutenção do filtro de areia · Pedro · 22/nov",
    "Repor cloro e pH · João · semanal",
  ];
  const [tapped, setTapped] = useState(false);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (!active) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTapped(true);
      setVisible(lines.length);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (fn: () => void, ms: number) => {
      timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));
    };

    const runCycle = () => {
      setTapped(false);
      setVisible(0);
      after(() => {
        setTapped(true);
        for (let i = 1; i <= lines.length; i++) {
          after(() => setVisible(i), i * 1000);
        }
        after(runCycle, lines.length * 1000 + 3500);
      }, 1000);
    };

    runCycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active, lines.length]);

  return (
    <>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-xs text-primary-foreground">
        Gerar tarefas para preparar o condomínio para o verão
      </div>
      {!tapped ? (
        <div className="relative mr-auto w-fit">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Gerar tarefas
          </span>
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary animate-ping" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
        </div>
      ) : (
        <div className="mr-auto max-w-[92%] rounded-2xl rounded-tl-sm bg-card panel-plate px-3 py-2 text-xs">
          <p className="font-medium text-success">✦ Criando {lines.length} tarefas...</p>
          <ul className="mt-1.5 space-y-1">
            {lines.slice(0, visible).map((l, i) => (
              <li key={i} className="flex items-start gap-1.5 text-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
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
        <Badge tone="primary" className="uppercase tracking-wide">Como funciona</Badge>
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
            className="rounded-2xl bg-card panel-plate p-7"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(28px)",
              transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms`,
            }}
          >
            <div className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent tracking-tight leading-none tabular-nums mb-4">{s.number}</div>
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
      quote: "Reduzi 80% das mensagens no WhatsApp do prédio. Em 3 semanas o grupo de moradores parou de pedir informações, porque agora eles encontram tudo no app.",
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
      role: "Administradora · 4 condomínios · MG",
      quote: "Administro 4 condomínios e antes era impossível. Hoje o CondoFlow gerencia a operação dos 4. Eu só monitoro o painel uma vez por dia e resolvo as exceções.",
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
        <Badge tone="primary" className="uppercase tracking-wide"><Star className="h-3 w-3 fill-current" /> Depoimentos reais</Badge>
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
            className="rounded-2xl bg-card panel-plate panel-plate-hover p-6 flex flex-col"
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

/* ════════════════════════ PRICING SECTION ════════════════════════ */
// Precificação decidida em 2026-09-17: 4 planos por faixa de unidades,
// benchmarked contra uCondo (R$139) e Residente Online (R$229/até 100u).
// IA nativa é o divisor: só a partir do Profissional. Revisar após os
// primeiros clientes pagantes — preço de lançamento é hipótese, não dogma.
function PricingSection() {
  const { ref, inView } = useInView(0.05);

  const plans = [
    {
      icon: Building2,
      name: "Essencial",
      note: "até 20 unidades",
      highlight: false,
      features: [
        "Reservas de áreas comuns (até 2)",
        "Chamados de manutenção com histórico",
        "Notificações por WhatsApp e e-mail",
        "Cadastro de moradores e funcionários",
        "Suporte via chat em horário comercial",
      ],
      excluded: ["IA nativa (tarefas automáticas)"],
    },
    {
      icon: Star,
      name: "Profissional",
      note: "até 60 unidades",
      highlight: true,
      features: [
        "Tudo do Essencial",
        "IA nativa: tarefas geradas e atribuídas automaticamente",
        "Áreas comuns ilimitadas",
        "Relatório mensal automático pra assembleia",
        "30 dias grátis pra testar",
      ],
      excluded: [] as string[],
    },
    {
      icon: Zap,
      name: "Premium",
      note: "até 100 unidades",
      highlight: false,
      features: [
        "Tudo do Profissional",
        "Feito pra condomínios maiores (até 100 unidades)",
        "Suporte prioritário",
        "30 dias grátis pra testar",
      ],
      excluded: [] as string[],
    },
    {
      icon: Users,
      name: "Administradora",
      note: "+100 unidades",
      highlight: false,
      features: [
        "Tudo do Profissional e do Premium",
        "Multi-condomínio num painel só",
        "Gestor de conta exclusivo",
        "Onboarding dedicado para toda a equipe",
        "30 dias grátis pra testar",
      ],
      excluded: [] as string[],
    },
  ];

  return (
    <div ref={ref}>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <Badge tone="primary" className="uppercase tracking-wide"><Sparkles className="h-3 w-3" /> Planos</Badge>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight">
          Um plano feito pro tamanho do seu condomínio
        </h2>
        <p className="mt-3 text-muted-foreground">
          Cada condomínio tem uma realidade diferente — fale com a gente e a equipe monta o plano certo pra você.
        </p>
      </div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {plans.map((p, i) => (
          <div
            key={p.name}
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(24px)",
              transition: `opacity 0.55s ease ${i * 100}ms, transform 0.55s ease ${i * 100}ms`,
            }}
          >
            <div className={`pricing-card-frame rounded-2xl p-[2px] h-full ${p.highlight ? "pricing-card-frame-highlight" : ""}`}>
              <div className="rounded-2xl bg-white p-6 h-full">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full buzzer-chip ${p.highlight ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <p.icon className="h-5 w-5" />
                  </span>
                  {p.highlight && <Badge tone="primary">Mais escolhido</Badge>}
                </div>
                <p className="mt-4 text-sm font-semibold bg-gradient-hero bg-clip-text text-transparent">{p.name}</p>
                <p className="mt-1 text-lg font-semibold text-success">Fale com a gente</p>
                <p className="text-xs text-muted-foreground">{p.note}</p>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {p.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/60">
                      <X className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:vendas@condoflow.site?subject=${encodeURIComponent(`Quero conhecer o plano ${p.name}`)}`}
                  className="group mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-hero px-4 text-sm font-medium text-primary-foreground btn-plate hover:opacity-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  Falar com vendas <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
              </div>
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
      className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 sm:p-10 lg:p-16 text-center shadow-elegant"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1)" : "scale(0.97)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="relative max-w-2xl mx-auto">
        <Badge tone="primary" className="uppercase tracking-wide">
          <Sparkles className="h-3 w-3" /> 30 dias grátis
        </Badge>
        <h2 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-primary-foreground text-balance">
          Seu condomínio já pode se administrar sozinho.
        </h2>
        <p className="mt-4 text-primary-foreground/80 leading-relaxed">
          Implantação em 7 dias. Treinamento incluído. Suporte humano. Cancele quando quiser.
          Nosso time configura tudo. Você só precisa dizer "vamos".
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/dashboard"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-card px-7 text-sm font-semibold text-foreground hover:opacity-95 btn-plate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Começar agora <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-primary-foreground/30 px-7 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Já tenho uma conta
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
function DashboardPreview({ booted }: { booted: boolean }) {
  const values = Array.from({ length: 28 }, (_, i) => 20 + ((i * 13) % 80));
  const vw = 280;
  const vh = 100;
  const step = vw / (values.length - 1);
  const linePoints = values.map((v, i) => `${(i * step).toFixed(1)},${(vh - v).toFixed(1)}`).join(" ");
  const areaPoints = `0,${vh} ${linePoints} ${vw},${vh}`;
  const lastY = vh - values[values.length - 1];

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 bg-background md:grid-cols-12">
      <div className="grid grid-cols-3 gap-3 md:col-span-3 md:grid-cols-1 md:space-y-3 md:gap-0">
        {[
          { l: "Reservas hoje", v: "12", tone: "text-primary" },
          { l: "Tarefas pendentes", v: "7", tone: "text-warning" },
          { l: "Ocorrências", v: "3", tone: "text-destructive" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">{s.l}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone}`}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 md:col-span-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Operação em tempo real</p>
          <Badge tone="success">Tudo sob controle</Badge>
        </div>
        <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none" className="mt-4 w-full h-24 sm:h-28" aria-hidden="true">
          <defs>
            <linearGradient id="telemetry-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={vw} y1={vh * f} y2={vh * f} stroke="var(--border)" strokeWidth="0.5" />
          ))}
          <polygon
            points={areaPoints}
            fill="url(#telemetry-fill)"
            style={{ opacity: booted ? 1 : 0, transition: "opacity 0.7s ease 0.35s" }}
          />
          <polyline
            points={linePoints}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1000}
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: booted ? 0 : 1000,
              transition: "stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
          <circle
            cx={vw}
            cy={lastY}
            r="2.6"
            fill="var(--primary)"
            style={{ opacity: booted ? 1 : 0, transition: "opacity 0.3s ease 1.15s" }}
          />
        </svg>
        <div className="mt-2 grid grid-cols-7 text-xs text-muted-foreground">
          {["S","T","Q","Q","S","S","D"].map((d, i) => <span key={i} className="text-center">{d}</span>)}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 md:col-span-3">
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
