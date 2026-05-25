import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePlatformAdmin } from "@/hooks/use-platform-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "CondoFlow Admin · Acesso restrito" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { session, signIn, loading: authLoading } = useAuth();
  const { isAdmin, hasAnyAdmin, loading, claimFirst, refresh } = usePlatformAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!authLoading && !loading && session && isAdmin) {
      navigate({ to: "/admin/dashboard" });
    }
  }, [authLoading, loading, session, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) { toast.error(error); return; }
    await refresh();
    toast.success("Verificando privilégios…");
  };

  const handleClaim = async () => {
    setClaiming(true);
    const { error } = await claimFirst();
    setClaiming(false);
    if (error) { toast.error(error); return; }
    toast.success("Você agora é o administrador da plataforma.");
    navigate({ to: "/admin/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warning/5" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/90 backdrop-blur-xl shadow-elegant overflow-hidden">
          <div className="px-8 py-7 border-b border-border bg-gradient-to-br from-foreground/[0.03] to-transparent">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/70 text-background shadow-elegant">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">CondoFlow</p>
                <h1 className="text-lg font-semibold tracking-tight">Admin · Backoffice SaaS</h1>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Acesso restrito ao operador da plataforma
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email administrativo</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@condoflow.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha exclusiva</label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>

            <Button type="submit" className="w-full h-10" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar no painel <ShieldCheck className="h-4 w-4" /></>}
            </Button>

            {session && !isAdmin && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground space-y-2">
                <p className="flex items-start gap-1.5 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Sua conta não tem privilégios de plataforma.
                </p>
                {hasAnyAdmin === false ? (
                  <>
                    <p className="text-warning-foreground/80">
                      Nenhum admin foi cadastrado ainda. Como você está logado, pode reivindicar o acesso de fundador agora.
                    </p>
                    <Button type="button" size="sm" variant="outline" className="w-full" onClick={handleClaim} disabled={claiming}>
                      {claiming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Tornar-me o primeiro admin"}
                    </Button>
                  </>
                ) : (
                  <p className="text-warning-foreground/80">Solicite ao administrador atual para promover sua conta.</p>
                )}
              </div>
            )}
          </form>

          <div className="px-8 py-3 border-t border-border bg-muted/30 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground/80">Acesso padrão do dono da plataforma</p>
            <p>Email: <code className="text-foreground">admin@condoflow.com</code></p>
            <p>Senha: <code className="text-foreground">CondoFlow@2026</code></p>
          </div>
          <div className="px-8 py-4 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition">← Login de clientes</Link>
            <span>v1.0 · enterprise</span>
          </div>
        </div>
      </div>
    </div>
  );
}
