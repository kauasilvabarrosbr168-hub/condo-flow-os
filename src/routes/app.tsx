import { Link, Outlet, useRouterState, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  Bell,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sparkles,
  Building,
  Users,
  Mail,
  Activity,
  Compass,
  MessageSquare,
  BarChart3,
  Loader2,
  Menu,
  X,
  Clock,
  ShieldCheck,
  XCircle,
  Brain,
  CreditCard,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { useAuth, type Role } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";
import { getMyMembershipStatus } from "@/lib/membership.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[]; // if omitted: all
};

type NavGroup = {
  label: string;
  items: NavItem[];
  roles?: Role[];
};

const NAV: (NavItem | NavGroup)[] = [
  { to: "/app/dashboard", label: "Início", icon: LayoutDashboard },
  { to: "/app/reservations", label: "Reservas", icon: CalendarDays },
  { to: "/app/charges", label: "Cobranças", icon: CreditCard, roles: ["sindico", "administradora", "morador"] },
  {
    label: "Operações",
    items: [
      { to: "/app/my-condo", label: "Meu condomínio", icon: Building, roles: ["sindico", "administradora"] },
      { to: "/app/areas", label: "Áreas comuns", icon: Building, roles: ["sindico", "administradora"] },
      { to: "/app/tasks", label: "Tarefas", icon: ListChecks, roles: ["sindico", "administradora", "funcionario"] },
      { to: "/app/services", label: "Serviços", icon: ListChecks, roles: ["funcionario"] },
      { to: "/app/ai-monitor", label: "IA Operacional", icon: Brain, roles: ["sindico", "administradora"] },
      { to: "/app/timeline", label: "Timeline", icon: Activity },
    ],
  },


  {
    label: "Pessoas",
    roles: ["sindico", "administradora"],
    items: [
      { to: "/app/team", label: "Equipe & moradores", icon: Users, roles: ["sindico", "administradora"] },
      { to: "/app/invitations", label: "Convites", icon: Mail, roles: ["sindico", "administradora"] },
    ],
  },
  { to: "/app/feedback", label: "Mural do condomínio", icon: MessageSquare },
  { to: "/app/communication", label: "Comunicação", icon: Bell },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, roles: ["sindico", "administradora"] },
];

const SECONDARY: NavItem[] = [
  { to: "/app/explore", label: "Explorar CondoFlow", icon: Compass },
  { to: "/app/settings", label: "Configurações", icon: Settings },
];

function visibleFor(role: Role | null, allowed?: Role[]) {
  if (!allowed) return true;
  if (!role) return false;
  return allowed.includes(role);
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, loading, profile, condo, primaryRole, roles, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const getStatusFn = useServerFn(getMyMembershipStatus);

  const noRoles = !loading && !!session && roles.length === 0;
  const { data: membership, isLoading: loadingStatus } = useQuery({
    enabled: noRoles,
    queryKey: ["membership-status", session?.user.id],
    queryFn: () => getStatusFn(),
  });

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    let ignore = false;
    supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!ignore && data) navigate({ to: "/admin/dashboard" });
      });
    return () => { ignore = true; };
  }, [loading, session, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Waiting-for-approval gate
  if (noRoles) {
    if (loadingStatus) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    // No pending request: send morador to enter by code
    const noRequest = !membership?.status;
    if (noRequest && pathname !== "/app/join-condo") {
      navigate({ to: "/app/join-condo" });
      return null;
    }
    if (!noRequest) {
      return <PendingApprovalScreen status={membership?.status ?? null} reason={membership?.rejection_reason ?? null} onSignOut={async () => { await signOut(); navigate({ to: "/login" }); }} />;
    }
  }

  const roleLabel: Record<Role, string> = {
    sindico: "Síndico",
    administradora: "Administradora",
    morador: "Morador",
    funcionario: "Funcionário",
  };

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
        <Logo />
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-3">
        <button className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition">
          <Search className="h-3.5 w-3.5" />
          <span>Buscar…</span>
          <kbd className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
        {NAV.map((entry, i) => {
          if ("items" in entry) {
            if (!visibleFor(primaryRole, entry.roles)) return null;
            const filtered = entry.items.filter((it) => visibleFor(primaryRole, it.roles));
            if (!filtered.length) return null;
            const hasActive = filtered.some((it) => pathname === it.to);
            return (
              <NavSection key={i} label={entry.label} defaultOpen={hasActive}>
                {filtered.map((it) => (
                  <SidebarLink key={it.to} item={it} active={pathname === it.to} nested />
                ))}
              </NavSection>
            );
          }
          if (!visibleFor(primaryRole, entry.roles)) return null;
          return <SidebarLink key={entry.to} item={entry} active={pathname === entry.to} />;
        })}

        <div className="pt-4 mt-2 border-t border-sidebar-border/60">
          {SECONDARY.map((it) => (
            <SidebarLink key={it.to} item={it} active={pathname === it.to} />
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/60 transition">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero text-xs font-semibold text-primary-foreground shadow-elegant">
                {initials}
              </span>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{profile?.full_name ?? "Usuário"}</p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">
                  {primaryRole ? roleLabel[primaryRole] : "Sem papel"} · {condo?.name ?? "Sem condomínio"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs">
              {profile?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/app/settings" })}>
              <Settings className="mr-2 h-4 w-4" /> Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/app/explore" })}>
              <Compass className="mr-2 h-4 w-4" /> Explorar módulos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 z-50 lg:z-auto h-screen w-72 lg:w-64 shrink-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/70 glass px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-1.5 w-80 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>Buscar reservas, áreas, pessoas…</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle compact />
            {(primaryRole === "sindico" || primaryRole === "administradora") && (
              <Link
                to="/app/ai-monitor"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition"
                title="Motor de IA Operacional"
              >
                <Brain className="h-4 w-4 text-primary" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
              </Link>
            )}
            <Link
              to="/app/communication"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition"
              title="Notificações"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <Link
              to="/app/explore"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-primary/30 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> Explorar
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* AI monitor badge — fixed bottom-right corner */}
      <Link
        to="/app/ai-monitor"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/90 backdrop-blur-sm px-3.5 py-2 text-xs font-semibold text-primary shadow-elegant hover:bg-primary/10 transition group"
        title="Ver painel de IA"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Monitorado por IA
        <Brain className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition" />
      </Link>
    </div>
  );
}

function PendingApprovalScreen({ status, reason, onSignOut }: { status: string | null; reason: string | null; onSignOut: () => void }) {
  const isRejected = status === "rejected";
  const isPartial = status === "sindico_approved";
  const noRequest = !status;

  const Icon = isRejected ? XCircle : isPartial ? ShieldCheck : Clock;
  const tone = isRejected ? "text-destructive" : isPartial ? "text-primary" : "text-warning";
  const bg = isRejected ? "bg-destructive/10" : isPartial ? "bg-primary/10" : "bg-warning/10";

  const title = isRejected
    ? "Solicitação recusada"
    : isPartial
    ? "Quase lá — aguardando CondoFlow"
    : noRequest
    ? "Sem solicitação ativa"
    : "Aguardando aprovação";

  const description = isRejected
    ? (reason || "Sua solicitação de acesso foi recusada. Entre em contato com o síndico ou suporte.")
    : isPartial
    ? "O síndico já aprovou. Agora estamos aguardando a confirmação final da equipe CondoFlow."
    : noRequest
    ? "Sua conta foi criada, mas não há nenhuma solicitação de acesso a um condomínio. Volte ao cadastro para selecionar seu perfil."
    : "Recebemos sua solicitação e ela está na fila de aprovação. Você receberá acesso assim que for aprovada.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <div className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl ${bg} ${tone}`}>
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={onSignOut} className="h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition">
            <LogOut className="inline h-4 w-4 mr-2" /> Sair
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ item, active, nested = false }: { item: NavItem; active: boolean; nested?: boolean }) {
  return (
    <Link
      to={item.to}
      className={`group flex items-center gap-3 rounded-lg ${nested ? "pl-8 pr-3" : "px-3"} py-2 text-sm font-medium transition-all ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
    >
      <item.icon className={`h-4 w-4 transition-transform ${active ? "" : "group-hover:scale-110"}`} />
      <span className="truncate">{item.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />}
    </Link>
  );
}

function NavSection({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="pt-3">
      <CollapsibleTrigger className="w-full flex items-center gap-1 px-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition">
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
        <span>{label}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1 overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
