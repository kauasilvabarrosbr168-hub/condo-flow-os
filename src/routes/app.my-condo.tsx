import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { CondoEditor } from "@/components/condo/condo-editor";
import { getMyCondoId } from "@/lib/admin-condo.functions";

export const Route = createFileRoute("/app/my-condo")({
  head: () => ({ meta: [{ title: "Meu condomínio · CondoFlow" }] }),
  component: MyCondoPage,
});

function MyCondoPage() {
  const fetchId = useServerFn(getMyCondoId);
  const [condoId, setCondoId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetchId().then((r) => setCondoId(r.condoId)).catch(() => setCondoId(null));
  }, [fetchId]);

  if (condoId === undefined) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!condoId) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Nenhum condomínio vinculado</h1>
        <p className="text-sm text-muted-foreground">Você ainda não está associado a um condomínio como síndico.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Meu condomínio</h1>
        <p className="text-sm text-muted-foreground mt-1">Edite identidade visual, estrutura, áreas, regras e contatos do seu condomínio.</p>
      </div>
      <CondoEditor condoId={condoId} variant="sindico" />
    </div>
  );
}
