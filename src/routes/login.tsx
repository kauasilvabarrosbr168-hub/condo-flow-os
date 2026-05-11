import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — CondoFlow" },
      { name: "description", content: "Acesse sua operação de condomínio no CondoFlow." },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col px-6 py-10 lg:px-16">
        <Logo />
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <h1 className="text-3xl font-semibold tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Automatize a operação do seu condomínio.
            </p>

            <div className="mt-8 space-y-2.5">
              <button className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition">
                <GoogleIcon /> Entrar com Google
              </button>
              <button className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition">
                <Phone className="h-4 w-4" /> Entrar com telefone
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex-1 h-px bg-border" /> ou com e-mail <span className="flex-1 h-px bg-border" />
            </div>

            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">E-mail</span>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="voce@condominio.com"
                    className="w-full h-11 rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
                  />
                </div>
              </label>
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Senha</span>
                  <a href="#" className="text-xs text-primary hover:underline">Esqueci a senha</a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="mt-1 w-full h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
                />
              </label>
              <Link
                to="/app/dashboard"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95"
              >
                Entrar <ArrowRight className="h-4 w-4" />
              </Link>
            </form>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              Ainda não tem conta? <a href="#" className="text-primary font-medium">Criar conta</a>
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Criptografia ponta a ponta · LGPD
        </p>
      </div>

      {/* Right: visual */}
      <div className="relative hidden lg:block bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-primary-foreground">
          <div className="max-w-md">
            <h2 className="text-4xl font-semibold tracking-tight text-balance">
              Um centro de comando para o seu condomínio.
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Reservas, manutenção, comunicação e tarefas — orquestrados com inteligência.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-xs">
            {[
              { k: "98%", v: "Tarefas no prazo" },
              { k: "−72%", v: "Mensagens no grupo" },
              { k: "4.9★", v: "Satisfação síndicos" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-primary-foreground/10 backdrop-blur p-4 border border-primary-foreground/20">
                <p className="text-2xl font-semibold">{s.k}</p>
                <p className="text-primary-foreground/70 mt-1">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
