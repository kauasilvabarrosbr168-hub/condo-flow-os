// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState, Stat } from "@/components/empty-state";
import { Badge } from "@/components/brand";
import { ReservationsCalendar } from "@/components/condo/reservations-calendar";

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
  const { data } = useQuery({
    queryKey: ["dashboard", "staff", userId],
    queryFn: async () => {
      const { data: myTasks } = await supabase
        .from("tasks")
        .select("id,title,kind,status,due_at,description")
        .eq("condo_id", condoId)
        .eq("assignee_id", userId)
        .neq("status", "concluida")
        .order("due_at", { ascending: true, nullsFirst: false });
      return { myTasks: myTasks ?? [] };
    },
  });

  return (
    <PageShell
      title={`Bom dia, ${firstName(userName)}`}
      subtitle="Suas tarefas do turno e checklists em ordem de prioridade."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Tarefas no turno" value={data?.myTasks?.length ?? 0} icon={ListChecks} tone={(data?.myTasks?.length ?? 0) > 0 ? "warning" : "default"} />
        <Stat label="Concluídas hoje" value={0} icon={TrendingUp} hint="Comece executando uma tarefa" />
        <Stat label="Manutenções abertas" value={0} icon={Wrench} hint="Nenhuma atribuída" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold">Sua fila</h2>
          <p className="text-xs text-muted-foreground">As tarefas aparecem aqui quando o síndico atribuir.</p>
        </div>
        <div className="p-5">
          {(data?.myTasks ?? []).length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Nenhuma tarefa atribuída"
              description="Quando um morador reservar uma área ou o síndico designar uma manutenção, ela aparecerá aqui em tempo real."
            />
          ) : (
            <ul className="space-y-2">
              {(data?.myTasks ?? []).map((t) => (
                <li key={t.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/40 transition">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
                    <ListChecks className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
                    {t.due_at && <p className="text-[11px] text-muted-foreground mt-1">Vence {relativeTime(t.due_at)}</p>}
                  </div>
                  <Link to="/app/tasks" className="text-xs text-primary font-medium">Abrir</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
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
