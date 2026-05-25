import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Loader2, Mail, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    invite: (search.invite as string) || undefined,
    mode: (search.mode as Mode) || undefined,
  }),
  head: () => ({ meta: [{ title: "Entrar — CondoFlow" }] }),
  component: LoginPage,
});

const signinSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha muito curta"),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

function LoginPage() {
  const { invite, mode: modeParam } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const { session, signIn, signUp, loading } = useAuth();
  const [mode, setMode] = useState<Mode>(modeParam ?? (invite ? "signup" : "signin"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<{ full_name: string; email: string; role: string; condo_id: string } | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [condoName, setCondoName] = useState("");
  const [condoAddress, setCondoAddress] = useState("");

  useEffect(() => {
    if (session && !loading) {
      (async () => {
        const { data: pa } = await supabase
          .from("platform_admins")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        navigate({ to: pa ? "/admin/dashboard" : "/app/dashboard" });
      })();
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    if (!invite) return;
    setMode("signup");
    supabase
      .rpc("get_invitation_by_token", { p_token: invite })
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setInvitation({
            full_name: data.full_name,
            email: data.email,
            role: data.role,
            condo_id: data.condo_id,
          });
          setEmail(data.email);
          setFullName(data.full_name);
        }
      });
  }, [invite]);

  const roleLabel = useMemo(() => {
    if (!invitation) return null;
    return {
      sindico: "Síndico",
      administradora: "Administradora",
      morador: "Morador",
      funcionario: "Funcionário",
    }[invitation.role as "sindico" | "administradora" | "morador" | "funcionario"];
  }, [invitation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const parsed = signinSchema.safeParse({ email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        const { error } = await signIn(parsed.data.email, parsed.data.password);
        if (error) {
          setError(traduzErro(error));
          return;
        }
        toast.success("Bem-vindo de volta");
        router.invalidate();
        // navigation handled by session effect (platform admins → /admin)
      } else {
        const parsed = signupSchema.safeParse({ fullName, email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        if (!invite && !condoName.trim()) {
          setError("Informe o nome do condomínio que você administra.");
          return;
        }
        const { error } = await signUp({
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          password: parsed.data.password,
          inviteToken: invite,
          condoName: invite ? undefined : condoName.trim(),
          condoAddress: invite ? undefined : condoAddress.trim() || undefined,
        });
        if (error) {
          setError(traduzErro(error));
          return;
        }
        toast.success(invite ? "Convite aceito! Bem-vindo." : "Condomínio criado com sucesso.");
        navigate({ to: "/app/dashboard" });
      }
    } finally {
      setBusy(false);
    }
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
            {invitation && (
              <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs font-medium text-primary">Convite recebido</p>
                <p className="mt-1 text-sm">
                  Você foi convidado como <strong>{roleLabel}</strong>. Crie sua conta para entrar no condomínio.
                </p>
              </div>
            )}

            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "signin" ? "Bem-vindo de volta" : invite ? "Aceitar convite" : "Criar seu CondoFlow"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Acesse a operação do seu condomínio."
                : invite
                ? "Defina uma senha para acessar."
                : "Cadastre o condomínio que você administra. Você será o síndico."}
            </p>

            {!invite && (
              <div className="mt-6 inline-flex items-center rounded-lg border border-border bg-card p-0.5">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setError(null); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "signin" ? "Entrar" : "Criar conta"}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {mode === "signup" && (
                <Field label="Nome completo">
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marina Souza"
                    className={inputCls}
                  />
                </Field>
              )}

              {mode === "signup" && !invite && (
                <>
                  <Field label="Nome do condomínio">
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        required
                        value={condoName}
                        onChange={(e) => setCondoName(e.target.value)}
                        placeholder="Edifício Aurora"
                        className={inputCls + " pl-9"}
                      />
                    </div>
                  </Field>
                  <Field label="Endereço (opcional)">
                    <input
                      value={condoAddress}
                      onChange={(e) => setCondoAddress(e.target.value)}
                      placeholder="Rua das Palmeiras, 123"
                      className={inputCls}
                    />
                  </Field>
                </>
              )}

              <Field label="E-mail">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    disabled={!!invitation}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@condominio.com"
                    className={inputCls + " pl-9 disabled:opacity-70"}
                  />
                </div>
              </Field>

              <Field label="Senha">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "••••••••"}
                  className={inputCls}
                />
              </Field>

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
                {mode === "signin" ? "Entrar" : invite ? "Aceitar convite" : "Criar condomínio"}
              </button>
            </form>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              {mode === "signin" ? (
                <>Ainda não tem conta?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                    Criar agora
                  </button>
                </>
              ) : (
                <>Já tem conta?{" "}
                  <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Criptografia ponta a ponta · LGPD
        </p>
      </div>

      {/* Right visual */}
      <div className="relative hidden lg:block bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="relative h-full flex flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="text-xs text-primary-foreground/70 hover:text-primary-foreground">
            ← Voltar ao site
          </Link>
          <div className="max-w-md">
            <h2 className="text-4xl font-semibold tracking-tight text-balance">
              Um centro de comando vivo para o seu condomínio.
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Reservas, áreas comuns, tarefas e timeline operacional — orquestrados com inteligência.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
              {[
                { k: "Síndico", v: "Operação no controle" },
                { k: "Morador", v: "Reserva em 1 clique" },
                { k: "Funcionário", v: "Tarefa clara" },
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
    </div>
  );
}

const inputCls =
  "w-full h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function traduzErro(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Email ou senha incorretos.";
  if (m.includes("user already registered")) return "Já existe uma conta com este email.";
  if (m.includes("password")) return "Senha inválida. Use ao menos 8 caracteres.";
  if (m.includes("rate")) return "Muitas tentativas. Aguarde alguns segundos.";
  return msg;
}
