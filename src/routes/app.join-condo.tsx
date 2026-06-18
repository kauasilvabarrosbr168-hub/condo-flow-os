import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Building2, ArrowRight, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { joinCondoByCode } from "@/lib/membership.functions";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export const Route = createFileRoute("/app/join-condo")({
  head: () => ({ meta: [{ title: "Entrar no condomínio · CondoFlow" }] }),
  component: JoinCondoPage,
});

function JoinCondoPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const joinFn = useServerFn(joinCondoByCode);

  const [code, setCode] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<{ condoName?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError("Informe o código do condomínio."); return; }
    setError(null);
    setBusy(true);
    try {
      const result = await joinFn({ data: { code: code.trim(), unitLabel: unitLabel.trim() || undefined } });
      if (result.alreadyPending) {
        toast.info("Você já tem uma solicitação pendente.");
      } else {
        toast.success("Solicitação enviada! Aguarde a aprovação do síndico.");
      }
      setJoined({ condoName: result.condoName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o código.");
    } finally {
      setBusy(false);
    }
  };

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Solicitação enviada!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {joined.condoName
              ? `Sua solicitação para entrar em "${joined.condoName}" foi enviada.`
              : "Sua solicitação foi enviada."}{" "}
            O síndico precisa aprovar o seu acesso. Você será notificado assim que liberado.
          </p>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
            className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-medium hover:bg-muted transition"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col px-6 py-8 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle compact />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Entrar no condomínio</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Peça o código do seu condomínio ao síndico e insira abaixo para solicitar acesso.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Código do condomínio</span>
                <div className="mt-1">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: A3F92B1C"
                    maxLength={12}
                    className="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm font-mono tracking-widest uppercase outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Sua unidade (opcional)</span>
                <div className="mt-1">
                  <input
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="Bloco A · Apto 302"
                    className="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring"
                  />
                </div>
              </label>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-60 transition"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Solicitar entrada
              </button>
            </form>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              Não tem o código?{" "}
              <span className="text-foreground font-medium">Peça ao síndico do seu condomínio.</span>
            </p>

            <div className="mt-4 text-center">
              <button
                onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative h-full flex flex-col justify-center p-12 text-primary-foreground">
          <h2 className="text-4xl font-semibold tracking-tight text-balance">
            Seu condomínio está a um código de distância.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            O síndico gera um código único e exclusivo para garantir que só os moradores certos tenham acesso.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 text-xs max-w-xs">
            {[
              { k: "Seguro", v: "Código aleatório e exclusivo por condomínio" },
              { k: "Rápido", v: "Entre sem depender de seleção manual" },
              { k: "Controlado", v: "Síndico aprova cada morador individualmente" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-primary-foreground/10 backdrop-blur p-3 border border-primary-foreground/20">
                <p className="text-sm font-semibold">{s.k}</p>
                <p className="text-primary-foreground/70 mt-1">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
