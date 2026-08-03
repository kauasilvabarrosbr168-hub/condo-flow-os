import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Building2, ArrowRight, Loader2, CheckCircle2, LogOut, Home, Briefcase } from "lucide-react";
import { joinCondoByCode } from "@/lib/membership.functions";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

export const Route = createFileRoute("/app/join-condo")({
  head: () => ({ meta: [{ title: "Entrar no condomínio · CondoFlow" }] }),
  component: JoinCondoPage,
});

type UserType = "morador" | "funcionario";

function JoinCondoPage() {
  const navigate = useNavigate();
  const { signOut, condo } = useAuth();
  const joinFn = useServerFn(joinCondoByCode);

  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [code, setCode] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<{ condoName?: string } | null>(null);

  // Quando o síndico aprova, user_roles é inserido e o AuthProvider
  // detecta em real-time e carrega o condo. Assim que condo aparecer,
  // redirecionamos automaticamente sem precisar de refresh manual.
  useEffect(() => {
    if (joined && condo) {
      navigate({ to: "/app/dashboard" });
    }
  }, [joined, condo]);

  const handleSelectType = (type: UserType) => {
    setUserType(type);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError("Informe o código do condomínio."); return; }
    setError(null);
    setBusy(true);
    try {
      const result = await joinFn({
        data: {
          code: code.trim(),
          unitLabel: unitLabel.trim() || undefined,
          requestedRole: userType ?? "morador",
        },
      });
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

            {/* PASSO 1 — Escolha do tipo */}
            {step === 1 && (
              <>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                  <Building2 className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Bem-vindo!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Como você faz parte do condomínio?
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSelectType("morador")}
                    className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-6 text-center hover:border-primary hover:bg-primary/5 transition group"
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <Home className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-sm">Morador</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Resido no condomínio</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectType("funcionario")}
                    className="flex flex-col items-center gap-3 rounded-2xl border-2 border-border bg-card p-6 text-center hover:border-primary hover:bg-primary/5 transition group"
                  >
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <Briefcase className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-sm">Colaborador</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Trabalho no condomínio</p>
                    </div>
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    Sair da conta
                  </button>
                </div>
              </>
            )}

            {/* PASSO 2 — Código do condomínio */}
            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                >
                  ← Voltar
                </button>

                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                  {userType === "funcionario" ? <Briefcase className="h-5 w-5" /> : <Home className="h-5 w-5" />}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Entrar no condomínio</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {userType === "funcionario"
                    ? "Insira o código do condomínio onde você trabalha."
                    : "Peça o código ao síndico e insira abaixo para solicitar acesso."}
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

                  {userType === "morador" && (
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
                  )}

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

                <div className="mt-6 text-center">
                  <button
                    onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    Sair da conta
                  </button>
                </div>
              </>
            )}
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
