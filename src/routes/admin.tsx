import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  DollarSign,
  LifeBuoy,
  BarChart3,
  MailCheck,
  Package,
  Settings2,
  ScrollText,
  ShieldAlert,
  Loader2,
  Search,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePlatformAdmin } from "@/hooks/use-platform-admin";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { to: "/admin/dashboard", label: "Dashboard global", icon: LayoutDashboard, group: "Visão geral" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, group: "Visão geral" },
  { to: "/admin/revenue", label: "Receita", icon: DollarSign, group: "Visão geral" },

  { to: "/admin/condos", label: "Condomínios", icon: Building2, group: "Clientes" },
  { to: "/admin/users", label: "Usuários", icon: Users, group: "Clientes" },
  { to: "/admin/invitations", label: "Convites", icon: MailCheck, group: "Clientes" },
  { to: "/admin/requests", label: "Solicitações", icon: ShieldCheck, group: "Clientes" },


  { to: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard, group: "Comercial" },
  { to: "/admin/plans", label: "Planos", icon: Package, group: "Comercial" },

  { to: "/admin/tickets", label: "Suporte", icon: LifeBuoy, group: "Operação" },
  { to: "/admin/logs", label: "Logs", icon: ScrollText, group: "Operação" },
  { to: "/admin/security", label: "Segurança", icon: ShieldAlert, group: "Operação" },
  { to: "/admin/settings", label: "Configurações SaaS", icon: Settings2, group: "Operação" },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, loading: authLoading, signOut, profile } = useAuth();
  const { isAdmin, loading } = usePlatformAdmin();

  useEffect(() => {
    if (authLoading || loading) return;
    if (!session) navigate({ to: "/admin/login" });
    else if (!isAdmin) navigate({ to: "/admin/login" });
  }, [authLoading, loading, session, isAdmin, navigate]);

  if (authLoading || loading || !session || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  const initials = (profile?.full_name ?? "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 z-30 h-screen w-64 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="h-16 px-5 flex items-center gap-2 border-b border-sidebar-border">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/70 text-background shadow-elegant">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">CondoFlow</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Admin · Backoffice</p>
          </div>
        </div>

        <div className="px-3 py-3">
          <button className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition">
            <Search className="h-3.5 w-3.5" />
            <span>Buscar workspace, usuário…</span>
            <kbd className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
          {groups.map((g) => (
            <div key={g}>
              <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{g}</p>
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === g).map((item) => {
                  const active = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="truncate">{item.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-foreground to-foreground/70 text-xs font-semibold text-background">
              {initials}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name ?? "Admin"}</p>
              <p className="text-[11px] text-sidebar-foreground/60 truncate">Super Admin · Plataforma</p>
            </div>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/admin/login" }); }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/70 glass px-6">
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-1.5 w-96 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>Buscar condomínios, usuários, tickets…</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground">
              <ShieldCheck className="h-3 w-3" /> Modo Admin Plataforma
            </span>
            <ThemeToggle compact />
            <Link
              to="/app/dashboard"
              className="hidden sm:inline-flex items-center h-9 px-3 rounded-lg border border-border text-xs font-medium hover:bg-muted transition"
            >
              Voltar ao app
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
