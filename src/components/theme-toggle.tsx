import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const options = [
    { v: "light" as const, icon: Sun, label: "Claro" },
    { v: "system" as const, icon: Monitor, label: "Auto" },
    { v: "dark" as const, icon: Moon, label: "Escuro" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 shadow-card"
    >
      {options.map((o) => {
        const active = theme === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.v)}
            title={o.label}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all ${
              active
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <o.icon className="h-3.5 w-3.5" />
            {!compact && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
