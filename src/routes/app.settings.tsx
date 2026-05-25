import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Configurações · CondoFlow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, condo, refresh } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [unit, setUnit] = useState(profile?.unit_label ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() || null, unit_label: unit.trim() || null }).eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Perfil atualizado"); await refresh(); }
  };

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Seu perfil, preferências e dados do condomínio.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-card p-6">
        <h2 className="text-sm font-semibold mb-4">Aparência</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Tema</p>
            <p className="text-xs text-muted-foreground">Claro, escuro ou automático (acompanha o sistema).</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <form onSubmit={save} className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-3">
        <h2 className="text-sm font-semibold mb-2">Perfil</h2>
        <Field label="Nome completo"><input required value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Telefone"><input value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
          <Field label="Unidade"><input value={unit} maxLength={20} onChange={(e) => setUnit(e.target.value)} placeholder="Apto 402" className={inputCls} /></Field>
        </div>
        <Field label="Email"><input disabled value={profile?.email ?? ""} className={inputCls + " opacity-60"} /></Field>
        <div className="pt-2">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </button>
        </div>
      </form>

      {condo && (
        <section className="rounded-2xl border border-border bg-card shadow-card p-6">
          <h2 className="text-sm font-semibold mb-2">Condomínio</h2>
          <p className="text-sm">{condo.name}</p>
          {condo.address && <p className="text-xs text-muted-foreground mt-1">{condo.address}</p>}
        </section>
      )}
    </div>
  );
}

const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
