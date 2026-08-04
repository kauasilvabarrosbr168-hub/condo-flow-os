import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "default" | "primary" | "warning";
}) {
  const toneClasses = {
    default: "bg-slate-500 text-white",
    primary: "bg-blue-600 text-white",
    warning: "bg-amber-500 text-white",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center shadow-card animate-fade-in">
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-base font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "destructive";
}) {
  const toneText: Record<string, string> = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning-foreground",
    destructive: "text-destructive",
  };
  const toneBg: Record<string, string> = {
    default:     "bg-slate-500 text-white",
    primary:     "bg-blue-600 text-white",
    success:     "bg-emerald-500 text-white",
    warning:     "bg-amber-500 text-white",
    destructive: "bg-red-600 text-white",
  };
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneBg[tone]}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${toneText[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
