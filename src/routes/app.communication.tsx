import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/app/communication")({
  head: () => ({ meta: [{ title: "Comunicação · CondoFlow" }] }),
  component: () => (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comunicação</h1>
        <p className="mt-1 text-sm text-muted-foreground">Notificações, avisos e canais multicanal.</p>
      </div>
      <EmptyState
        icon={MessageSquare}
        title="Módulo em desenvolvimento"
        description="Em breve: push, email e WhatsApp orquestrados para o condomínio inteiro. Por enquanto, todo evento importante é registrado na timeline."
        tone="warning"
        action={<Link to="/app/timeline" className="text-xs font-medium text-primary hover:underline">Ver timeline →</Link>}
      />
    </div>
  ),
});
