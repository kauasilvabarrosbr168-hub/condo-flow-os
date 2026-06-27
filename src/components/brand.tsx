import { Link } from "@tanstack/react-router";
import { Building2, Construction, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function SoonBadge({ children = "em breve" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 shadow-sm">
      <Construction className="h-2.5 w-2.5" />
      {children}
    </span>
  );
}

export function InDevOverlay({ label = "Em desenvolvimento" }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-2xl bg-card/70 backdrop-blur-[2px] flex items-center justify-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/60 bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200 shadow-card">
        <Construction className="h-3.5 w-3.5" />
        {label}
      </span>
    </div>
  );
}

export function MvpBanner() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-elegant">
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-[240px]">
        <p className="text-sm font-semibold">MVP CondoFlow · fluxo de reserva ponta a ponta</p>
        <p className="text-xs text-muted-foreground">
          Morador reserva → sistema cria fluxo, notifica responsáveis, gera checklist, confirma execução e registra tudo. Outros módulos estão marcados como <span className="font-medium text-warning-foreground">em desenvolvimento</span>.
        </p>
      </div>
    </div>
  );
}

export function Logo({ withText = true, className = "" }: { withText?: boolean; className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 group ${className}`}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-elegant">
        <Building2 className="h-5 w-5 text-primary-foreground" />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </span>
      {withText && (
        <span className="font-semibold text-[17px] tracking-tight">
          Condo<span className="text-primary">Flow</span>
        </span>
      )}
    </Link>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "destructive" | "primary" }) {
  const tones: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatDot({ tone = "primary" }: { tone?: "primary" | "success" | "warning" | "destructive" }) {
  const map: Record<string, string> = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[tone]}`} />;
}
