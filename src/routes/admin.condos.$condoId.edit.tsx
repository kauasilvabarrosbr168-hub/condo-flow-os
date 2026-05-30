import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/admin-shell";
import { CondoEditor } from "@/components/condo/condo-editor";

export const Route = createFileRoute("/admin/condos/$condoId/edit")({
  head: () => ({ meta: [{ title: "Editar condomínio · CondoFlow Admin" }] }),
  component: EditCondoPage,
});

function EditCondoPage() {
  const { condoId } = Route.useParams();
  const navigate = useNavigate();
  return (
    <div>
      <button
        onClick={() => navigate({ to: "/admin/condos" })}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para condomínios
      </button>
      <PageHeader title="Editar condomínio" description="Gerencie identidade visual, estrutura, áreas, regras e contatos." />
      <CondoEditor condoId={condoId} variant="admin" />
    </div>
  );
}
