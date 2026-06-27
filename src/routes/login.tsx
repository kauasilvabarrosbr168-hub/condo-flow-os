import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Building2, Loader2, Mail, ShieldCheck, Users, HardHat, Home,
  Phone, ChevronLeft, KeyRound, MessageSquare, Send, CheckCircle2, RotateCcw,
  Eye, EyeOff,
} from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getInvitationByToken } from "@/lib/invitations.functions";
import { requestMembership } from "@/lib/membership.functions";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

type Mode = "signin" | "signup" | "forgot" | "phone-otp";
type ProfileType = "morador" | "sindico" | "funcionario";
type ForgotStep = "choose" | "email-form" | "email-sent";
type PhoneStep = "enter" | "verify";
type PhonePurpose = "login" | "recovery";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    invite: (search.invite as string) || undefined,
    mode: (search.mode as "signin" | "signup") || undefined,
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

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

function toE164(display: string) {
  const d = display.replace(/\D/g, "");
  if (d.length < 10 || d.length > 11) return null;
  return `+55${d}`;
}

function LoginPage() {
  const { invite, mode: modeParam } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const fetchInvitation = useServerFn(getInvitationByToken);
  const requestMembershipFn = useServerFn(requestMembership);
  const { session, signIn, signUp, loading } = useAuth();

  const [mode, setMode] = useState<Mode>(modeParam ?? (invite ? "signup" : "signin"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<{ full_name: string; email: string; role: string; condo_id: string } | null>(null);

  // Signin form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Signup form
  const [fullName, setFullName] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("morador");
  const [condoName, setCondoName] = useState("");
  const [condoAddress, setCondoAddress] = useState("");
  const [selectedCondoId, setSelectedCondoId] = useState<string>("");
  const [signupPhone, setSignupPhone] = useState("");
  const [publicCondos, setPublicCondos] = useState<{ id: string; name: string; address: string | null }[]>([]);

  // Forgot password
  const [forgotStep, setForgotStep] = useState<ForgotStep>("choose");
  const [forgotEmail, setForgotEmail] = useState("");

  // Phone OTP
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("enter");
  const [phonePurpose, setPhonePurpose] = useState<PhonePurpose>("login");
  const [otpCode, setOtpCode] = useState("");

  const showPhoneLoginHint = failedAttempts >= 3;

  // Load condos for funcionario signup
  useEffect(() => {
    if (mode !== "signup" || invite || profileType !== "funcionario") return;
    supabase.rpc("list_condos_for_signup").then(({ data, error }) => {
      if (error) { console.error("Falha ao carregar condomínios:", error.message); return; }
      if (data) setPublicCondos(data as { id: string; name: string; address: string | null }[]);
    });
  }, [mode, invite, profileType]);

  // Redirect if already logged in
  useEffect(() => {
    if (!session || loading) return;
    let ignore = false;
    (async () => {
      const { data: pa } = await supabase
        .from("platform_admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!ignore) navigate({ to: pa ? "/admin/dashboard" : "/app/dashboard" });
    })();
    return () => { ignore = true; };
  }, [session, loading, navigate]);

  // Load invite
  useEffect(() => {
    if (!invite) return;
    setMode("signup");
    fetchInvitation({ data: { token: invite } }).then((data) => {
      if (data) {
        setInvitation({ full_name: data.full_name, email: data.email, role: data.role, condo_id: data.condo_id });
        setEmail(data.email);
        setFullName(data.full_name);
      }
    });
  }, [invite, fetchInvitation]);

  const roleLabel = useMemo(() => {
    if (!invitation) return null;
    return ({ sindico: "Síndico", administradora: "Administradora", morador: "Morador", funcionario: "Funcionário" } as Record<string, string>)[invitation.role];
  }, [invitation]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const goToForgot = () => { setMode("forgot"); setForgotStep("choose"); setForgotEmail(email); setError(null); };
  const goToPhoneOtp = (purpose: PhonePurpose) => {
    setPhonePurpose(purpose);
    setPhoneStep("enter");
    setPhone("");
    setOtpCode("");
    setError(null);
    setMode("phone-otp");
  };
  const goBack = () => {
    setError(null);
    if (mode === "forgot") {
      if (forgotStep === "email-form") { setForgotStep("choose"); }
      else if (forgotStep === "email-sent") { setForgotStep("email-form"); }
      else { setMode("signin"); }
    } else if (mode === "phone-otp") {
      if (phoneStep === "verify") { setPhoneStep("enter"); setOtpCode(""); }
      else if (phonePurpose === "recovery") { setMode("forgot"); setForgotStep("choose"); }
      else { setMode("signin"); }
    }
  };

  const handleSigninSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const parsed = signinSchema.safeParse({ email, password });
      if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
      const { error: err } = await signIn(parsed.data.email, parsed.data.password);
      if (err) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (err.toLowerCase().includes("not found") || err.toLowerCase().includes("user")) {
          setError("Não encontramos uma conta com esse e-mail. Verifique ou crie uma conta.");
        } else if (next >= 3) {
          setError("Senha incorreta por 3 vezes. Tente outro método de acesso abaixo.");
        } else {
          setError(traduzErro(err));
        }
        return;
      }
      toast.success("Bem-vindo de volta");
      router.invalidate();
    } finally {
      setBusy(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const parsed = signupSchema.safeParse({ fullName, email, password });
      if (!parsed.success) { setError(parsed.error.issues[0].message); return; }

      if (invite) {
        const { error: err } = await signUp({ fullName: parsed.data.fullName, email: parsed.data.email, password: parsed.data.password, inviteToken: invite });
        if (err) { setError(traduzErro(err)); return; }
        toast.success("Convite aceito! Bem-vindo.");
        navigate({ to: "/app/dashboard" });
        return;
      }

      if (profileType === "sindico" && !condoName.trim()) { setError("Informe o nome do condomínio que você administra."); return; }
      if (profileType === "funcionario" && !selectedCondoId) { setError("Selecione o seu condomínio na lista."); return; }

      const phoneNumber = toE164(signupPhone) ?? undefined;
      const { error: suErr } = await signUp({ fullName: parsed.data.fullName, email: parsed.data.email, password: parsed.data.password, phoneNumber });
      if (suErr) { setError(traduzErro(suErr)); return; }

      if (profileType !== "morador") {
        try {
          await requestMembershipFn({
            data: {
              requestedRole: profileType,
              condoId: profileType === "sindico" ? undefined : selectedCondoId,
              proposedCondoName: profileType === "sindico" ? condoName.trim() : undefined,
              proposedCondoAddress: profileType === "sindico" ? (condoAddress.trim() || undefined) : undefined,
            },
          });
        } catch (reqErr) {
          toast.error("Cadastro criado, mas falhou ao enviar solicitação: " + (reqErr instanceof Error ? reqErr.message : String(reqErr)));
        }
      }

      toast.success(profileType === "morador" ? "Conta criada! Agora entre no seu condomínio pelo código." : "Cadastro enviado para aprovação.");
      navigate({ to: "/app/dashboard" });
    } finally {
      setBusy(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setError("Informe seu e-mail."); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (err) {
      if (err.message.toLowerCase().includes("not found") || err.message.toLowerCase().includes("user")) {
        setError("Não encontramos uma conta com esse e-mail.");
      } else {
        setError(traduzErro(err.message));
      }
      return;
    }
    setForgotStep("email-sent");
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = toE164(phone);
    if (!e164) { setError("Número inválido. Use formato (11) 99999-9999."); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: e164 });
    setBusy(false);
    if (err) {
      if (err.message.toLowerCase().includes("sms") || err.message.toLowerCase().includes("phone")) {
        setError("Serviço de SMS não configurado. Use outra opção de acesso.");
      } else {
        setError(traduzErro(err.message));
      }
      return;
    }
    setPhoneStep("verify");
    setOtpCode("");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = toE164(phone);
    if (!e164 || otpCode.length < 6) { setError("Digite o código de 6 dígitos."); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.verifyOtp({ phone: e164, token: otpCode, type: "sms" });
    setBusy(false);
    if (err) { setError("Código incorreto ou expirado. Tente novamente."); return; }
    if (phonePurpose === "recovery") {
      toast.success("Identidade verificada! Redefina sua senha nas configurações.");
    } else {
      toast.success("Bem-vindo!");
    }
    router.invalidate();
  };

  const handleResendOtp = async () => {
    const e164 = toE164(phone);
    if (!e164) return;
    setBusy(true);
    await supabase.auth.signInWithOtp({ phone: e164 });
    setBusy(false);
    toast.info("Novo código enviado.");
  };

  // ─── Profile options ──────────────────────────────────────────────────────

  const profileOptions: { value: ProfileType; label: string; desc: string; icon: typeof Home }[] = [
    { value: "morador", label: "Morador", desc: "Aprovado pelo síndico", icon: Home },
    { value: "sindico", label: "Síndico", desc: "Aprovado pelo CondoFlow", icon: Users },
    { value: "funcionario", label: "Colaborador", desc: "Síndico + CondoFlow", icon: HardHat },
  ];

  // ─── Render helpers ───────────────────────────────────────────────────────

  const BackButton = ({ label = "Voltar" }: { label?: string }) => (
    <button type="button" onClick={goBack} className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition">
      <ChevronLeft className="h-3.5 w-3.5" /> {label}
    </button>
  );

  // ─── MODE: forgot ─────────────────────────────────────────────────────────

  if (mode === "forgot") {
    const forgotBackLabel = forgotStep === "choose" ? "Voltar ao login" : forgotStep === "email-sent" ? "Voltar" : "Outras opções";
    return (
      <Layout rightPanel={<RecoveryPanel />}>
        <div className="w-full max-w-sm mx-auto animate-fade-in">
          {forgotStep !== "email-sent" && <BackButton label={forgotBackLabel} />}

          {forgotStep === "choose" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Recuperar acesso</h1>
              <p className="mt-2 text-sm text-muted-foreground">Como você quer redefinir sua senha?</p>

              <div className="mt-8 grid grid-cols-1 gap-3">
                <button
                  onClick={() => { setForgotStep("email-form"); setError(null); }}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition group"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Link no e-mail</p>
                    <p className="text-xs text-muted-foreground">Receba um link no Gmail cadastrado</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>

                <button
                  onClick={() => goToPhoneOtp("recovery")}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition group"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Código por SMS</p>
                    <p className="text-xs text-muted-foreground">Receba um código no seu celular</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </button>
              </div>

              <div className="mt-8 border-t pt-6 text-center">
                <p className="text-xs text-muted-foreground">Não tem conta?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
                    Criar conta
                  </button>
                </p>
              </div>
            </>
          )}

          {forgotStep === "email-form" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Link de recuperação</h1>
              <p className="mt-2 text-sm text-muted-foreground">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>

              <form onSubmit={handleSendResetEmail} className="mt-8 space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">E-mail cadastrado</span>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setError(null); }}
                      placeholder="voce@gmail.com"
                      className={inputCls + " pl-9"}
                    />
                  </div>
                </label>

                {error && <ErrorMsg>{error}</ErrorMsg>}

                <button type="submit" disabled={busy} className={btnCls}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar link
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Criar conta</button>
              </p>
            </>
          )}

          {forgotStep === "email-sent" && (
            <div className="text-center">
              <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success mb-5">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Link enviado!</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Enviamos um link para{" "}
                <span className="font-medium text-foreground">{forgotEmail}</span>.
                Verifique sua caixa de entrada e a pasta de spam.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">O link expira em 1 hora.</p>
              <button
                onClick={() => { setMode("signin"); setForgotStep("choose"); }}
                className="mt-8 inline-flex items-center gap-2 h-11 rounded-xl border border-border px-5 text-sm font-medium hover:bg-muted transition"
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // ─── MODE: phone-otp ──────────────────────────────────────────────────────

  if (mode === "phone-otp") {
    return (
      <Layout rightPanel={<PhonePanel purpose={phonePurpose} />}>
        <div className="w-full max-w-sm mx-auto animate-fade-in">
          <BackButton />

          {phoneStep === "enter" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <Phone className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {phonePurpose === "login" ? "Entrar por SMS" : "Verificar por SMS"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {phonePurpose === "login"
                  ? "Informe o número cadastrado na sua conta. Enviaremos um código de verificação."
                  : "Verifique sua identidade pelo celular cadastrado na conta."}
              </p>

              <form onSubmit={handleSendPhoneOtp} className="mt-8 space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Número de telefone</span>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(formatPhone(e.target.value)); setError(null); }}
                      placeholder="(11) 99999-9999"
                      className={inputCls + " pl-9 tracking-wide"}
                      autoComplete="tel"
                    />
                  </div>
                </label>

                {error && <ErrorMsg>{error}</ErrorMsg>}

                <button type="submit" disabled={busy} className={btnCls}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar código
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                Não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Criar conta</button>
              </p>
            </>
          )}

          {phoneStep === "verify" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Digite o código</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviamos um código de 6 dígitos para{" "}
                <span className="font-medium text-foreground">{phone}</span>.
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Código de verificação</span>
                  <div className="mt-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(null); }}
                      placeholder="000000"
                      className={inputCls + " text-center text-2xl font-mono tracking-[0.5em] placeholder:tracking-[0.3em]"}
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>
                </label>

                {error && <ErrorMsg>{error}</ErrorMsg>}

                <button type="submit" disabled={busy || otpCode.length < 6} className={btnCls}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Verificar código
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Não recebi — reenviar código
                </button>
              </div>
            </>
          )}
        </div>
      </Layout>
    );
  }

  // ─── MODE: signin / signup ────────────────────────────────────────────────

  return (
    <Layout rightPanel={<HeroPanel />}>
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
          {mode === "signin" ? "Bem-vindo de volta" : invite ? "Aceitar convite" : "Criar sua conta"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Acesse a operação do seu condomínio."
            : invite
            ? "Defina uma senha para acessar."
            : "Escolha como você participa do condomínio."}
        </p>

        {!invite && (
          <div className="mt-6 inline-flex items-center rounded-lg border border-border bg-card p-0.5">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setFailedAttempts(0); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={mode === "signin" ? handleSigninSubmit : handleSignupSubmit} className="mt-6 space-y-3">
          {/* Signup: profile type */}
          {mode === "signup" && !invite && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Eu sou</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {profileOptions.map((opt, idx) => {
                  const Icon = opt.icon;
                  const active = profileType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProfileType(opt.value)}
                      style={{ animationDelay: `${idx * 70}ms` }}
                      className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 animate-fade-in hover:-translate-y-0.5 ${
                        active
                          ? "border-primary bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 ring-2 ring-primary/40 shadow-elegant"
                          : "border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card hover:border-primary/60 hover:from-primary/15"
                      }`}
                    >
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        active
                          ? "bg-gradient-hero text-primary-foreground shadow-elegant"
                          : "bg-primary/15 text-primary group-hover:bg-primary/25"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className={`mt-2 text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{opt.desc}</p>
                      {active && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signup: full name */}
          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Nome completo</span>
              <div className="mt-1">
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Marina Souza" className={inputCls} />
              </div>
            </label>
          )}

          {/* Signup: sindico condo info */}
          {mode === "signup" && !invite && profileType === "sindico" && (
            <>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Nome do condomínio</span>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input required value={condoName} onChange={(e) => setCondoName(e.target.value)} placeholder="Edifício Aurora" className={inputCls + " pl-9"} />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Endereço (opcional)</span>
                <div className="mt-1">
                  <input value={condoAddress} onChange={(e) => setCondoAddress(e.target.value)} placeholder="Rua das Palmeiras, 123" className={inputCls} />
                </div>
              </label>
            </>
          )}

          {/* Signup: morador — code info banner */}
          {mode === "signup" && !invite && profileType === "morador" && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
              <p className="text-xs text-primary font-medium">Você vai entrar no condomínio por código</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Após criar sua conta, você receberá o código do seu síndico e poderá acessar o app.</p>
            </div>
          )}

          {/* Signup: funcionario condo select */}
          {mode === "signup" && !invite && profileType === "funcionario" && (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Condomínio</span>
              <div className="mt-1">
                <select required value={selectedCondoId} onChange={(e) => setSelectedCondoId(e.target.value)} className={inputCls}>
                  <option value="">Selecione…</option>
                  {publicCondos.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.address ? ` — ${c.address}` : ""}</option>
                  ))}
                </select>
              </div>
            </label>
          )}

          {/* Email */}
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">E-mail</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                disabled={!!invitation}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="voce@condominio.com"
                className={inputCls + " pl-9 disabled:opacity-70"}
              />
            </div>
          </label>

          {/* Password */}
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Senha</span>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "••••••••"}
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {/* Signup: optional phone */}
          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                Celular <span className="text-muted-foreground/60">(opcional — para recuperar acesso por SMS)</span>
              </span>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className={inputCls + " pl-9"}
                />
              </div>
            </label>
          )}

          {error && <ErrorMsg>{error}</ErrorMsg>}

          {/* Forgot password link — only in signin */}
          {mode === "signin" && (
            <div className="flex justify-end">
              <button type="button" onClick={goToForgot} className="text-xs text-muted-foreground hover:text-primary transition">
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button type="submit" disabled={busy} className={btnCls}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {mode === "signin" ? "Entrar" : invite ? "Aceitar convite" : "Criar conta"}
          </button>
        </form>

        {/* After 3 failed attempts: phone login option */}
        {mode === "signin" && showPhoneLoginHint && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-center text-muted-foreground mb-3">Outro jeito de entrar</p>
            <button
              type="button"
              onClick={() => goToPhoneOtp("login")}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition"
            >
              <Phone className="h-4 w-4" /> Entrar com número de telefone
            </button>
          </div>
        )}

        {/* Switch mode link */}
        <p className="mt-6 text-xs text-center text-muted-foreground">
          {mode === "signin" ? (
            <>Ainda não tem conta?{" "}
              <button onClick={() => { setMode("signup"); setError(null); }} className="text-primary font-medium hover:underline">Criar agora</button>
            </>
          ) : (
            <>Já tem conta?{" "}
              <button onClick={() => { setMode("signin"); setError(null); }} className="text-primary font-medium hover:underline">Entrar</button>
            </>
          )}
        </p>
      </div>
    </Layout>
  );
}

// ─── Shared layout ────────────────────────────────────────────────────────────

function Layout({ children, rightPanel }: { children: React.ReactNode; rightPanel: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col px-6 py-8 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle compact />
        </div>
        <div className="flex-1 flex items-center">
          {children}
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
          {rightPanel}
        </div>
      </div>
    </div>
  );
}

function HeroPanel() {
  return (
    <>
      <Link to="/" className="absolute top-8 left-8 text-xs text-primary-foreground/70 hover:text-primary-foreground">← Voltar ao site</Link>
      <div className="max-w-md">
        <h2 className="text-4xl font-semibold tracking-tight text-balance">Um centro de comando vivo para o seu condomínio.</h2>
        <p className="mt-4 text-primary-foreground/80">Reservas, áreas comuns, tarefas e timeline operacional — orquestrados com inteligência.</p>
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
    </>
  );
}

function RecoveryPanel() {
  return (
    <div className="max-w-md">
      <h2 className="text-4xl font-semibold tracking-tight text-balance">Recupere seu acesso com segurança.</h2>
      <p className="mt-4 text-primary-foreground/80">Escolha o método mais prático para você. O link de e-mail expira em 1 hora.</p>
      <div className="mt-8 grid grid-cols-1 gap-3 text-xs max-w-xs">
        {[
          { k: "Via e-mail", v: "Link direto para o Gmail cadastrado" },
          { k: "Via SMS", v: "Código de 6 dígitos no celular" },
          { k: "Seguro", v: "Nenhum dado é compartilhado" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-primary-foreground/10 backdrop-blur p-3 border border-primary-foreground/20">
            <p className="text-sm font-semibold">{s.k}</p>
            <p className="text-primary-foreground/70 mt-1">{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhonePanel({ purpose }: { purpose: PhonePurpose }) {
  return (
    <div className="max-w-md">
      <h2 className="text-4xl font-semibold tracking-tight text-balance">
        {purpose === "login" ? "Entre sem precisar lembrar a senha." : "Verifique sua identidade pelo celular."}
      </h2>
      <p className="mt-4 text-primary-foreground/80">
        {purpose === "login"
          ? "Um código de 6 dígitos vai para o seu celular. Só você recebe."
          : "O código confirma que você é dono da conta. Rápido e seguro."}
      </p>
      <div className="mt-8 grid grid-cols-1 gap-3 text-xs max-w-xs">
        {[
          { k: "Rápido", v: "Código chega em segundos" },
          { k: "Seguro", v: "Expira em 10 minutos" },
          { k: "Único", v: "Só você tem acesso ao número" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-primary-foreground/10 backdrop-blur p-3 border border-primary-foreground/20">
            <p className="text-sm font-semibold">{s.k}</p>
            <p className="text-primary-foreground/70 mt-1">{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const inputCls = "w-full h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/40 focus:border-ring";
const btnCls = "inline-flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-60 transition";

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{children}</p>
  );
}

function traduzErro(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Email ou senha incorretos.";
  if (m.includes("user already registered") || m.includes("already registered")) return "Já existe uma conta com este email.";
  if (m.includes("password")) return "Senha inválida. Use ao menos 8 caracteres.";
  if (m.includes("rate")) return "Muitas tentativas. Aguarde alguns segundos.";
  if (m.includes("email not confirmed")) return "Email ou senha incorretos.";
  return msg;
}
