import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Flame,
  ListChecks,
  Smartphone,
  MessageSquareWarning,
  HardHat,
  Bell,
  Search,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Logo, SoonBadge } from "@/components/brand";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, mvp: true },
  { to: "/app/reservations", label: "Reservas", icon: CalendarDays, mvp: true },
  { to: "/app/sauna", label: "Fluxo automático", icon: Flame, mvp: true },
  { to: "/app/checklist", label: "Checklist & operações", icon: ListChecks, mvp: true },
  { to: "/app/staff", label: "Execução (funcionários)", icon: HardHat, mvp: true },
  { to: "/app/notifications", label: "Notificações", icon: Bell, mvp: true },
  { to: "/app/issues", label: "Problemas & votação", icon: MessageSquareWarning, mvp: false },
  { to: "/app/resident", label: "App do morador", icon: Smartphone, mvp: false },
] as const;

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
          <Logo />
        </div>
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-xs text-sidebar-foreground/70">
            <Search className="h-3.5 w-3.5" />
            <span>Buscar</span>
            <kbd className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">MVP · Fluxo de reserva</p>
          {nav.filter((i) => i.mvp).map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <p className="px-3 pt-5 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Próximas entregas</p>
          {nav.filter((i) => !i.mvp).map((item) => (
            <div
              key={item.to}
              aria-disabled
              title="Em desenvolvimento"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/40 cursor-not-allowed select-none"
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              <SoonBadge />
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-hero text-xs font-semibold text-primary-foreground">
              MS
            </span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Marina Souza</p>
              <p className="text-[11px] text-sidebar-foreground/60">Síndica · Edifício Aurora</p>
            </div>
            <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card/50 backdrop-blur px-6">
          <div className="lg:hidden">
            <Logo withText={false} />
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 w-80 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>Buscar reservas, moradores, tarefas…</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
