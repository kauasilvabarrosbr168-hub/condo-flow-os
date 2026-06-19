import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, KeyRound, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha · CondoFlow" }] }),
  component: ResetPasswordPage,
});

type Status = "loading" | "ready" | "done" | "invalid";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase sends tokens in the URL hash after the reset link is clicked.
    // Parse them here and call setSession to authenticate the user.
    const hash = typeof window !== "undefined" ? window.location.hash.substring(1) : "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");

    if (type !== "recovery" || !access_token || !refresh_token) {
      setStatus("invalid");
      return;
    }

    supabase.auth.setSession({ access_token, refresh_token }).then(({ error: err }) => {
      if (err) setStatus("invalid");
      else setStatus("ready");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("A senha deve ter ao menos 8 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setStatus("done");
    toast.success("Senha redefinida com sucesso!");
    setTimeout(() => navigate({ to: "/login" }), 2500);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col px-6 py-8 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle compact />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto animate-fade-in">

            {status === "loading" && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Verificando link…</p>
              </div>
            )}

            {status === "invalid" && (
              <div className="text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-5">
                  <XCircle className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Link inválido ou expirado</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  O link de recuperação expirou ou já foi utilizado. Solicite um novo link.
                </p>
                <Link
                  to="/login"
                  className="mt-8 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground hover:opacity-95 transition"
                >
                  Solicitar novo link
                </Link>
              </div>
            )}

            {status === "ready" && (
              <>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Criar nova senha</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Escolha uma senha forte com ao menos 8 caracteres.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-3">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Nova senha</span>
                    <div className="relative mt-1">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full h-11 rounded-xl border border-input bg-card px-3 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground">Confirmar senha</span>
                    <div className="mt-1">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                        placeholder="Repita a senha"
                        className="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring"
                      />
                    </div>
                  </label>

                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <StrengthBar password={password} />
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
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Salvar nova senha
                  </button>
                </form>
              </>
            )}

            {status === "done" && (
              <div className="text-center">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success mb-5">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Senha redefinida!</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sua nova senha foi salva. Você será redirecionado para o login em instantes.
                </p>
                <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

          </div>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Criptografia ponta a ponta · LGPD
        </p>
      </div>

      <div className="relative hidden lg:block bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative h-full flex flex-col justify-center p-12 text-primary-foreground">
          <h2 className="text-4xl font-semibold tracking-tight text-balance">
            Crie uma senha que só você conhece.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Use letras, números e símbolos para uma senha mais segura. Nunca compartilhe com ninguém.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 text-xs max-w-xs">
            {[
              { k: "Seguro", v: "Criptografada com bcrypt" },
              { k: "Privado", v: "Nenhum colaborador tem acesso" },
              { k: "Você no controle", v: "Troque quando quiser" },
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

function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: "Muito fraca", color: "bg-destructive" },
    { label: "Fraca", color: "bg-warning" },
    { label: "Média", color: "bg-warning" },
    { label: "Boa", color: "bg-success/70" },
    { label: "Forte", color: "bg-success" },
  ];
  const level = levels[Math.min(score, 4)];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= score ? level.color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{level.label}</p>
    </div>
  );
}
