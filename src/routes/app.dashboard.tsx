// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Sparkles,
  CalendarPlus,
  Building,
  Users,
  ListChecks,
  Activity,
  ArrowRight,
  PartyPopper,
  Wrench,
  Clock,
  TrendingUp,
  AlertTriangle,
  Loader2,
  AlarmClock,
  Check,
  StickyNote,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState, Stat } from "@/components/empty-state";
import { Badge } from "@/components/brand";
import { ReservationsCalendar } from "@/components/condo/reservations-calendar";
import { toast } from "sonner";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [{ title: "Início · CondoFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, condo, primaryRole, isAdmin, user } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;

  // No condo yet → onboarding
  if (!condoId) return <OnboardingNoCondo />;

  if (isAdmin) return <AdminHome condoId={condoId} userName={profile?.full_name ?? ""} />;
  if (primaryRole === "funcionario") return <StaffHome condoId={condoId} userId={user!.id} userName={profile?.full_name ?? ""} />;
  return <ResidentHome condoId={condoId} userId={user!.id} userName={profile?.full_name ?? ""} />;
}

function PageShell({ title, subtitle, children, action }: { title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-gradient-glow">
      <div className="px-4 lg:px-8 pt-8 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {action}
        </div>
      </div>
      <div className="px-4 lg:px-8 pb-12 space-y-6 animate-slide-up">{children}</div>
    </div>
  );
}

/* ──────────────── ONBOARDING ──────────────── */
function OnboardingNoCondo() {
  return (
    <PageShell
      title="Bem-vindo ao CondoFlow"
      subtitle="Sua conta foi criada, mas ainda não está vinculada a nenhum condomínio."
    >
      <EmptyState
        icon={Building}
        title="Aguardando vínculo a um condomínio"
        description="Peça ao síndico ou administradora para enviar um convite. Você receberá um link por email."
        tone="primary"
      />
    </PageShell>
  );
}

/* ──────────────── ADMIN / SÍNDICO ──────────────── */
function AdminHome({ condoId, userName }: { condoId: string; userName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "admin", condoId],
    queryFn: async () => {
      const [areas, reservations, tasks, members, invites, activity] = await Promise.all([
        supabase.from("common_areas").select("id", { count: "exact", head: true }).eq("condo_id", condoId),
        supabase.from("reservations").select("id,status,starts_at,area_id,resident_id").eq("condo_id", condoId).order("starts_at", { ascending: false }).limit(50),
        supabase.from("tasks").select("id,status,title,due_at,kind").eq("condo_id", condoId).neq("status", "concluida").order("due_at", { ascending: true, nullsFirst: false }).limit(20),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("condo_id", condoId),
        supabase.from("invitations").select("id,full_name,email,role,accepted_at").eq("condo_id", condoId).is("accepted_at", null),
        supabase.from("activity_events").select("id,title,kind,created_at").eq("condo_id", condoId).order("created_at", { ascending: false }).limit(8),
      ]);
      return {
        areasCount: areas.count ?? 0,
        reservations: reservations.data ?? [],
        tasks: tasks.data ?? [],
        membersCount: members.count ?? 0,
        pendingInvites: invites.data ?? [],
        activity: activity.data ?? [],
      };
    },
  });

  const upcoming = (data?.reservations ?? []).filter((r) => new Date(r.starts_at) >= new Date()).slice(0, 5);
  const operationalReady = (data?.areasCount ?? 0) > 0 && (data?.membersCount ?? 0) > 1;

  return (
    <PageShell
      title={`Olá, ${firstName(userName)}`}
      subtitle="Painel operacional do condomínio em tempo real."
      action={
        <Link
          to="/app/reservations"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 transition"
        >
          <CalendarPlus className="h-4 w-4" /> Nova reserva
        </Link>
      }
    >
      {/* Onboarding checklist when not configured */}
      {!operationalReady && (
        <SetupChecklist
          condoId={condoId}
          areasCount={data?.areasCount ?? 0}
          membersCount={data?.membersCount ?? 0}
          loading={isLoading}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Reservas ativas"
          value={data?.reservations?.length ?? 0}
          hint={(data?.reservations?.length ?? 0) === 0 ? "Nenhuma reserva ainda" : "Total registrado"}
          icon={PartyPopper}
          tone={(data?.reservations?.length ?? 0) > 0 ? "primary" : "default"}
        />
        <Stat
          label="Tarefas pendentes"
          value={data?.tasks?.length ?? 0}
          hint={(data?.tasks?.length ?? 0) === 0 ? "Nada na fila" : "A executar"}
          icon={ListChecks}
          tone={(data?.tasks?.length ?? 0) > 0 ? "warning" : "default"}
        />
        <Stat
          label="Áreas comuns"
          value={data?.areasCount ?? 0}
          hint={(data?.areasCount ?? 0) === 0 ? "Configure para liberar reservas" : "Disponíveis"}
          icon={Building}
          tone="default"
        />
        <Stat
          label="Pessoas no condomínio"
          value={data?.membersCount ?? 0}
          hint={(data?.pendingInvites?.length ?? 0) > 0 ? `${data!.pendingInvites.length} convite(s) pendente(s)` : "Convide moradores e funcionários"}
          icon={Users}
          tone="default"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Próximas reservas</h2>
              <p className="text-xs text-muted-foreground">Eventos confirmados para os próximos dias</p>
            </div>
            <Link to="/app/reservations" className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {upcoming.length === 0 ? (
              <div className="text-center py-10">
                <CalendarPlus className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">Você ainda não possui reservas registradas.</p>
                <Link
                  to="/app/reservations"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Criar primeira reserva <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 hover:border-primary/40 transition">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarPlus className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Reserva {r.id.slice(0, 6)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.starts_at)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-semibold">Timeline operacional</h2>
            <Link to="/app/timeline" className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline">
              <Activity className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {(data?.activity ?? []).length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-7 w-7 text-muted-foreground/50" />
                <p className="mt-3 text-xs text-muted-foreground">A timeline ganha vida conforme o condomínio é utilizado.</p>
              </div>
            ) : (
              <ol className="relative space-y-3 ml-1.5 border-l border-border/60">
                {(data?.activity ?? []).map((ev) => (
                  <li key={ev.id} className="pl-4 relative">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
                    <p className="text-xs font-medium">{ev.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{relativeTime(ev.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      <ReservationsCalendar condoId={condoId} />

      <ExploreTeaser />
    </PageShell>
  );
}

function SetupChecklist({
  condoId,
  areasCount,
  membersCount,
  loading,
}: {
  condoId: string;
  areasCount: number;
  membersCount: number;
  loading: boolean;
}) {
  const steps = [
    {
      title: "Cadastre as áreas comuns",
      desc: "Sauna, salão de festas, churrasqueira… O que pode ser reservado.",
      done: areasCount > 0,
      to: "/app/areas" as const,
      label: "Configurar áreas",
    },
    {
      title: "Convide moradores e funcionários",
      desc: "Cada pessoa entra com login próprio e permissões corretas.",
      done: membersCount > 1,
      to: "/app/invitations" as const,
      label: "Enviar convites",
    },
    {
      title: "Receba a primeira reserva",
      desc: "Quando um morador reservar, o fluxo automático começa.",
      done: false,
      to: "/app/reservations" as const,
      label: "Ver reservas",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  void condoId;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-card">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <Badge tone="primary">Primeiros passos</Badge>
            <h2 className="mt-2 text-lg font-semibold">Ative seu condomínio em 3 passos</h2>
            <p className="text-sm text-muted-foreground mt-0.5">As informações surgem aqui conforme o sistema for usado.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold tracking-tight">{pct}%</p>
          <p className="text-xs text-muted-foreground">{completed} de {steps.length}</p>
        </div>
      </div>

      <div className="relative mt-5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-hero transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="relative mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            className={`group rounded-xl border p-4 transition ${
              s.done
                ? "border-success/30 bg-success/5"
                : "border-border bg-background/50 hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  s.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <p className="text-sm font-medium">{s.title}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{s.desc}</p>
            {!s.done && !loading && (
              <p className="mt-3 text-xs font-medium text-primary inline-flex items-center gap-1">
                {s.label} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ──────────────── MORADOR ──────────────── */
function ResidentHome({ condoId, userId, userName }: { condoId: string; userId: string; userName: string }) {
  const { data } = useQuery({
    queryKey: ["dashboard", "resident", userId],
    queryFn: async () => {
      const [myReservations, areas] = await Promise.all([
        supabase
          .from("reservations")
          .select("id,status,starts_at,area_id")
          .eq("condo_id", condoId)
          .eq("resident_id", userId)
          .order("starts_at", { ascending: false })
          .limit(10),
        supabase.from("common_areas").select("id,name,description,cover_url,capacity").eq("condo_id", condoId).eq("active", true).limit(6),
      ]);
      return { mine: myReservations.data ?? [], areas: areas.data ?? [] };
    },
  });

  const upcoming = (data?.mine ?? []).filter((r) => new Date(r.starts_at) >= new Date());

  return (
    <PageShell
      title={`Olá, ${firstName(userName)}`}
      subtitle="Reserve áreas comuns e acompanhe seus eventos."
      action={
        <Link
          to="/app/reservations"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95"
        >
          <CalendarPlus className="h-4 w-4" /> Nova reserva
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Suas reservas ativas" value={upcoming.length} icon={PartyPopper} tone={upcoming.length > 0 ? "primary" : "default"} hint={upcoming.length ? "Próximas no calendário" : "Crie sua primeira reserva"} />
        <Stat label="Áreas disponíveis" value={data?.areas?.length ?? 0} icon={Building} hint={(data?.areas?.length ?? 0) === 0 ? "Aguardando configuração" : "Para reservar"} />
        <Stat label="Histórico" value={(data?.mine?.length ?? 0) - upcoming.length} icon={Clock} hint="Reservas anteriores" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-semibold">Suas próximas reservas</h2>
          </div>
          <div className="p-5">
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <CalendarPlus className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">Você ainda não tem reservas.</p>
                <Link to="/app/reservations" className="mt-3 inline-flex text-xs font-medium text-primary hover:underline">
                  Reservar agora →
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarPlus className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Reserva {r.id.slice(0, 6)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.starts_at)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Áreas comuns</h2>
            <Link to="/app/areas" className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-4">
            {(data?.areas ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma área comum disponível ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {(data?.areas ?? []).map((a: any) => (
                  <Link
                    key={a.id}
                    to="/app/areas"
                    className="group rounded-xl border border-border/60 overflow-hidden hover:border-primary/40 hover:shadow-elegant transition"
                  >
                    <div className="relative h-24 w-full bg-muted overflow-hidden">
                      {a.cover_url ? (
                        <img
                          src={a.cover_url}
                          alt={a.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                          <Building className="h-7 w-7 text-primary/40" />
                        </div>
                      )}
                      {a.capacity && (
                        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Cap. {a.capacity}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold truncate">{a.name}</p>
                      {a.description && <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{a.description}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReservationsCalendar condoId={condoId} />
    </PageShell>
  );
}

/* ──────────────── FUNCIONÁRIO ──────────────── */
function StaffHome({ condoId, userId, userName }: { condoId: string; userId: string; userName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "staff", userId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

      const [allRes, doneRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id,title,kind,status,due_at,description,urgency,ai_generated,notify_immediately")
          .eq("condo_id", condoId)
          .or(`assignee_id.eq.${userId},assignee_id.is.null`)
          .neq("status", "concluida")
          .order("due_at", { ascending: true, nullsFirst: false }),
        supabase
          .from("tasks")
          .select("id,title,kind,completed_at")
          .eq("condo_id", condoId)
          .or(`assignee_id.eq.${userId},assignee_id.is.null`)
          .eq("status", "concluida")
          .gte("completed_at", today.toISOString())
          .lt("completed_at", tomorrow.toISOString()),
      ]);

      const all = allRes.data ?? [];
      // Ordenar: urgente → normal → baixa, depois por due_at
      const urgOrder: Record<string, number> = { urgente: 0, normal: 1, baixa: 2 };
      const sorted = [...all].sort((a, b) => {
        const ua = urgOrder[a.urgency ?? "normal"] ?? 1;
        const ub = urgOrder[b.urgency ?? "normal"] ?? 1;
        if (ua !== ub) return ua - ub;
        if (!a.due_at && !b.due_at) return 0;
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      });

      return {
        tasks: sorted,
        doneToday: doneRes.data ?? [],
        urgent: all.filter((t) => t.urgency === "urgente"),
        todayTasks: all.filter((t) => t.due_at && new Date(t.due_at) >= today && new Date(t.due_at) < tomorrow),
      };
    },
  });

  const greeting = getGreeting();
  const shift    = getShift();
  const dateStr  = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const nextTask = data?.tasks?.[0] ?? null;

  const URGENCY_COLOR: Record<string, string> = {
    urgente: "text-destructive bg-destructive/10 border-destructive/30",
    normal:  "text-primary bg-primary/10 border-primary/30",
    baixa:   "text-muted-foreground bg-muted border-border",
  };
  const URGENCY_DOT: Record<string, string> = {
    urgente: "bg-destructive",
    normal:  "bg-primary",
    baixa:   "bg-muted-foreground/50",
  };

  return (
    <div className="bg-gradient-glow min-h-screen">
      {/* Header do colaborador */}
      <div className="px-4 lg:px-8 pt-8 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {greeting} · {shift}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{firstName(userName)}</h1>
            <p className="mt-1 text-sm text-muted-foreground capitalize">{dateStr}</p>
          </div>
          <Link
            to="/app/tasks"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 transition"
          >
            <ListChecks className="h-4 w-4" /> Ver todas as tarefas
          </Link>
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-12 space-y-6 animate-slide-up">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Tarefas hoje",    value: data?.todayTasks?.length ?? 0, icon: Clock,       tone: "default" as const },
            { label: "Pendentes",       value: data?.tasks?.length ?? 0,      icon: ListChecks,  tone: (data?.tasks?.length ?? 0) > 0 ? "warning" as const : "default" as const },
            { label: "Urgentes",        value: data?.urgent?.length ?? 0,     icon: Wrench,      tone: (data?.urgent?.length ?? 0) > 0 ? "destructive" as const : "default" as const },
            { label: "Concluídas hoje", value: data?.doneToday?.length ?? 0,  icon: TrendingUp,  tone: (data?.doneToday?.length ?? 0) > 0 ? "success" as const : "default" as const },
          ].map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} icon={s.icon} tone={s.tone} />
          ))}
        </div>

        {/* Próxima tarefa — destaque */}
        {nextTask && (
          <div className={`rounded-2xl border p-5 ${nextTask.urgency === "urgente" ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              ⚡ Próxima tarefa
            </p>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-base font-semibold">{nextTask.title}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${URGENCY_COLOR[nextTask.urgency ?? "normal"]}`}>
                    {nextTask.urgency === "urgente" ? "🔴" : nextTask.urgency === "normal" ? "🟡" : "⚪"} {(nextTask.urgency ?? "normal").charAt(0).toUpperCase() + (nextTask.urgency ?? "normal").slice(1)}
                  </span>
                </div>
                {nextTask.description && <p className="text-sm text-muted-foreground line-clamp-2">{nextTask.description}</p>}
                {nextTask.due_at && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Vence {formatDateTime(nextTask.due_at)}
                    {new Date(nextTask.due_at) < new Date() && <span className="text-destructive font-medium ml-1">— Atrasada</span>}
                  </p>
                )}
              </div>
              <Link
                to="/app/tasks"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-80 transition shrink-0"
              >
                Abrir <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Minha missão de hoje */}
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Minha missão de hoje</h2>
              <p className="text-xs text-muted-foreground">Execute nesta ordem — urgentes primeiro</p>
            </div>
            <Link to="/app/tasks" className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline">
              Ver tudo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (data?.tasks ?? []).length === 0 ? (
            <div className="p-8 text-center">
              <ListChecks className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma tarefa pendente</p>
              <p className="text-xs text-muted-foreground mt-1">O síndico ou a IA atribuirá tarefas conforme necessário.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(data?.tasks ?? []).slice(0, 8).map((t, idx) => (
                <li key={t.id}>
                  <Link to="/app/tasks" className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition">
                    {/* Número de ordem */}
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
                      {idx + 1}
                    </span>
                    {/* Dot urgência */}
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${URGENCY_DOT[t.urgency ?? "normal"]}`} />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {kindLabel(t.kind ?? "")}
                        {t.due_at ? ` · Vence ${formatDateTime(t.due_at)}` : ""}
                        {t.ai_generated ? " · ✨ CondoFlow AI" : ""}
                      </p>
                    </div>
                    {/* Status badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0 ${
                      t.status === "em_andamento"
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-border text-muted-foreground"
                    }`}>
                      {t.status === "em_andamento" ? "Em andamento" : "Pendente"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Lembretes pendentes */}
        <PendingRemindersWidget condoId={condoId} userId={userId} />

        {/* Reportar problema */}
        <ReportarProblema condoId={condoId} userId={userId} />

      </div>
    </div>
  );
}

/* ──────────────── LEMBRETES PENDENTES (COLABORADOR) ──────────────── */
function PendingRemindersWidget({ condoId, userId }: { condoId: string; userId: string }) {
  const [notes, setNotes] = useState<any[]>([]);

  const fetch = async () => {
    const { data } = await supabase
      .from("worker_notes")
      .select("id,content,remind_at")
      .eq("user_id", userId)
      .eq("condo_id", condoId)
      .eq("completed", false)
      .lte("remind_at", new Date().toISOString())
      .not("remind_at", "is", null)
      .order("remind_at", { ascending: true });
    setNotes(data ?? []);
  };

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 30_000);
    return () => clearInterval(id);
  }, [userId, condoId]);

  const markDone = async (noteId: string, done: boolean) => {
    await supabase
      .from("worker_notes")
      .update({ completed: done, completed_at: done ? new Date().toISOString() : null })
      .eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success(done ? "Lembrete cumprido!" : "Anotação reaberta");
  };

  const snooze = async (noteId: string) => {
    const newAt = new Date(Date.now() + 3_600_000).toISOString();
    await supabase.from("worker_notes").update({ remind_at: newAt }).eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success("Lembrete adiado 1h");
  };

  if (notes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 shadow-card overflow-hidden">
      <div className="flex items-center gap-2 p-5 border-b border-amber-400/30">
        <AlarmClock className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Lembretes aguardando ({notes.length})
        </h2>
      </div>

      <ul className="divide-y divide-amber-200/40 dark:divide-amber-700/30">
        {notes.map((note) => (
          <li key={note.id} className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-snug flex-1">
                {note.content}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => markDone(note.id, true)}
                className="flex-1 h-10 rounded-xl bg-success text-success-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Check className="h-4 w-4" /> Sim, cumpri!
              </button>
              <button
                onClick={() => snooze(note.id)}
                className="h-10 px-4 rounded-xl border border-amber-300 dark:border-amber-600 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition"
              >
                Não cumpri — adiar 1h
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportarProblema({ condoId, userId }: { condoId: string; userId: string }) {
  const [open, setOpen]   = useState(false);
  const [desc, setDesc]   = useState("");
  const [local, setLocal] = useState("");
  const [urgency, setUrg] = useState("normal");
  const [busy, setBusy]   = useState(false);

  const submit = async () => {
    if (!desc.trim()) return;
    setBusy(true);
    try {
      await supabase.from("tasks").insert({
        condo_id:    condoId,
        title:       `Problema reportado: ${desc.slice(0, 60)}`,
        description: `${desc}${local ? `\nLocal: ${local}` : ""}`,
        kind:        "incidente",
        urgency,
        status:      "pendente",
        ai_generated: false,
        notify_immediately: urgency === "urgente",
        location:    local || null,
      });
      toast.success("Problema reportado! O síndico foi notificado.");
      setOpen(false); setDesc(""); setLocal(""); setUrg("normal");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao reportar");
    } finally { setBusy(false); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-dashed border-destructive/30 text-destructive/80 hover:border-destructive hover:bg-destructive/5 transition text-sm font-medium"
      >
        <AlertTriangle className="h-4 w-4" /> Reportar problema
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elegant" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Reportar problema
              </h2>
              <button onClick={() => setOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Descreva o problema *</label>
                <textarea
                  value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                  placeholder="O que aconteceu? Seja específico..."
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Local</label>
                <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Piscina, Academia, Entrada..."
                  className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Urgência</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(["baixa","normal","urgente"] as const).map((u) => (
                    <button key={u} type="button" onClick={() => setUrg(u)}
                      className={`h-9 rounded-lg border text-xs font-medium transition capitalize ${
                        urgency === u
                          ? u === "urgente" ? "border-destructive bg-destructive/10 text-destructive"
                            : u === "normal" ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-foreground"
                          : "border-border text-muted-foreground"
                      }`}>{u}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-border">
              <button onClick={() => setOpen(false)} className="h-9 px-4 rounded-lg border border-border text-sm">Cancelar</button>
              <button onClick={submit} disabled={!desc.trim() || busy}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Enviar relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ──────────────── HELPERS ──────────────── */
function ExploreTeaser() {
  return (
    <Link
      to="/app/explore"
      className="block rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/40 hover:shadow-elegant transition group"
    >
      <div className="flex items-center gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Explorar módulos do CondoFlow</p>
          <p className="text-xs text-muted-foreground">Conheça o que está disponível e o que está chegando.</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "default" | "primary" | "success" | "warning" | "destructive" }> = {
    pendente: { label: "Pendente", tone: "warning" },
    confirmada: { label: "Confirmada", tone: "primary" },
    em_execucao: { label: "Em execução", tone: "primary" },
    concluida: { label: "Concluída", tone: "success" },
    cancelada: { label: "Cancelada", tone: "destructive" },
  };
  const v = map[status] ?? map.pendente;
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

function firstName(name: string) {
  return name.split(" ")[0] || "você";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getShift() {
  const h = new Date().getHours();
  if (h < 12) return "Turno: Manhã";
  if (h < 18) return "Turno: Tarde";
  return "Turno: Noite";
}

function kindLabel(k: string) {
  return ({
    pre_checklist: "Pré-uso", pos_checklist: "Pós-uso",
    manutencao: "Manutenção", incidente: "Incidente",
    limpeza: "Limpeza", verificacao: "Verificação",
  } as Record<string, string>)[k] ?? k;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}
