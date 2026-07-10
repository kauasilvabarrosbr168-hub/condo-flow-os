import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/app/timeline")({
  head: () => ({ meta: [{ title: "Timeline · CondoFlow" }] }),
  component: TimelinePage,
});

function TimelinePage() {
  const { condo, profile } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;

  const { data, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["timeline", condoId],
    queryFn: async () => {
      const { data } = await supabase.from("activity_events").select("*").eq("condo_id", condoId!).order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timeline operacional</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tudo que acontece no condomínio, em tempo real.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState icon={Activity} title="A timeline está em silêncio" description="Conforme o condomínio for utilizado — reservas, tarefas, manutenções — tudo será registrado aqui." />
      ) : (
        <ol className="relative border-l-2 border-border ml-2 space-y-4">
          {data!.map((ev) => (
            <li key={ev.id} className="pl-6 relative">
              <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{ev.title}</p>
                  <span className="text-[11px] text-muted-foreground">{new Date(ev.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">{ev.kind}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
