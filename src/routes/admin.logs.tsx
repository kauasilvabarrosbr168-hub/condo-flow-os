import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScrollText, Loader2 } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Logs · CondoFlow Admin" }] }),
  component: LogsPage,
});

function LogsPage() {
  const [rows, setRows] = useState<{ id: string; action: string; target_kind: string | null; target_id: string | null; created_at: string; meta: Record<string, unknown> }[] | null>(null);

  useEffect(() => {
    supabase.from("platform_audit_logs").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setRows((data ?? []) as never));
  }, []);

  return (
    <div>
      <PageHeader title="Logs de auditoria" description="Histórico completo de ações administrativas na plataforma." />
      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyBlock icon={<ScrollText className="h-5 w-5" />} title="Sem registros ainda" description="Ações administrativas (suspensões, mudanças de plano, impersonação) serão registradas aqui." />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="px-5 py-3 flex items-start gap-3 text-sm hover:bg-muted/30">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{r.action}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.target_kind ?? "—"} · {new Date(r.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
