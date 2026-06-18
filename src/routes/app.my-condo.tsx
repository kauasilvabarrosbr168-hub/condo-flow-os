import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Copy, RefreshCw, Check } from "lucide-react";
import { CondoEditor } from "@/components/condo/condo-editor";
import { getMyCondoId, getCondoJoinCode, regenerateCondoJoinCode } from "@/lib/admin-condo.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/my-condo")({
  head: () => ({ meta: [{ title: "Meu condomínio · CondoFlow" }] }),
  component: MyCondoPage,
});

function MyCondoPage() {
  const fetchId = useServerFn(getMyCondoId);
  const fetchCode = useServerFn(getCondoJoinCode);
  const regenCode = useServerFn(regenerateCondoJoinCode);

  const [condoId, setCondoId] = useState<string | null | undefined>(undefined);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [regenBusy, setRegenBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchId().then((r) => setCondoId(r.condoId)).catch(() => setCondoId(null));
  }, [fetchId]);

  useEffect(() => {
    if (!condoId) return;
    fetchCode({ data: { condoId } }).then((r) => setJoinCode(r.joinCode)).catch(() => {});
  }, [condoId, fetchCode]);

  const handleCopy = () => {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegen = async () => {
    if (!condoId) return;
    setRegenBusy(true);
    try {
      const r = await regenCode({ data: { condoId } });
      setJoinCode(r.joinCode);
      toast.success("Código regenerado com sucesso.");
    } catch {
      toast.error("Erro ao regenerar o código.");
    } finally {
      setRegenBusy(false);
    }
  };

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

      {/* Código de entrada — visível só para síndico/admin */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Código de entrada do condomínio</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compartilhe com os moradores para que possam solicitar acesso ao app. Somente você e o super admin têm acesso a este código.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 font-mono text-2xl font-bold tracking-[0.25em] text-foreground bg-muted rounded-xl px-4 py-3 select-all">
            {joinCode ?? "········"}
          </div>
          <button
            onClick={handleCopy}
            disabled={!joinCode}
            title="Copiar código"
            className="h-12 w-12 inline-flex items-center justify-center rounded-xl border border-border hover:bg-muted transition disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={handleRegen}
            disabled={regenBusy}
            title="Gerar novo código"
            className="h-12 w-12 inline-flex items-center justify-center rounded-xl border border-border hover:bg-muted transition disabled:opacity-40"
          >
            {regenBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          ⚠ Ao gerar um novo código, o código anterior deixará de funcionar.
        </p>
      </div>

      <CondoEditor condoId={condoId} variant="sindico" />
    </div>
  );
}
