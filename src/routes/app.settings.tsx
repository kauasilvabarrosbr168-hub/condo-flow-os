import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Save, MessageSquare, Mail, Bell, Phone, CheckCircle2, CalendarX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { HOLIDAY_CATALOG } from "@/lib/holidays";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Configurações · CondoFlow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, condo, primaryRole, refresh } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const isSindico = primaryRole === "sindico" || primaryRole === "administradora";
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [unit, setUnit] = useState(profile?.unit_label ?? "");
  const [busy, setBusy] = useState(false);
  const [blockedHolidays, setBlockedHolidays] = useState<Set<string>>(new Set());
  const [holidaysBusy, setHolidaysBusy] = useState(false);

  useEffect(() => {
    if (!condoId || !isSindico) return;
    supabase
      .from("condo_holiday_rules")
      .select("holiday_key")
      .eq("condo_id", condoId)
      .eq("blocked", true)
      .then(({ data }) => {
        setBlockedHolidays(new Set((data ?? []).map((r) => r.holiday_key)));
      });
  }, [condoId, isSindico]);

  const toggleHoliday = async (key: string) => {
    if (!condoId) return;
    setHolidaysBusy(true);
    const isBlocked = blockedHolidays.has(key);
    if (isBlocked) {
      await supabase.from("condo_holiday_rules").delete().eq("condo_id", condoId).eq("holiday_key", key);
      setBlockedHolidays((prev) => { const s = new Set(prev); s.delete(key); return s; });
    } else {
      await supabase.from("condo_holiday_rules").upsert({ condo_id: condoId, holiday_key: key, blocked: true });
      setBlockedHolidays((prev) => new Set([...prev, key]));
    }
    setHolidaysBusy(false);
    toast.success(isBlocked ? "Feriado liberado" : "Feriado bloqueado");
  };

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

      <section className="rounded-2xl border border-border bg-card shadow-card p-6">
        <h2 className="text-sm font-semibold mb-1">Notificações</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Configure seu celular no perfil acima para receber SMS e WhatsApp.
        </p>
        <div className="space-y-3">
          {[
            { icon: Mail, title: "E-mail", desc: "Aprovações, reservas e tarefas", active: !!profile?.email },
            { icon: MessageSquare, title: "WhatsApp / SMS", desc: "Alertas no celular cadastrado", active: !!profile?.phone },
            { icon: Bell, title: "Push (em breve)", desc: "Notificações no navegador", active: false },
          ].map((n) => (
            <div key={n.title} className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${n.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <n.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
              </div>
              {n.active
                ? <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Ativo</span>
                : <span className="text-xs text-muted-foreground">{n.title.includes("breve") ? "Em breve" : "Cadastre seu celular"}</span>
              }
            </div>
          ))}
        </div>

        {!profile?.phone && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-start gap-2">
            <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-primary">
              Adicione seu celular no perfil acima para receber notificações via SMS e WhatsApp sobre aprovações, reservas e muito mais.
            </p>
          </div>
        )}
      </section>

      {isSindico && condoId && (
        <section className="rounded-2xl border border-border bg-card shadow-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarX className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold">Feriados bloqueados</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Selecione os feriados em que reservas de áreas comuns não são permitidas. Dias bloqueados aparecem em <span className="text-red-500 font-medium">vermelho</span> no calendário.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {HOLIDAY_CATALOG.map((h) => {
              const blocked = blockedHolidays.has(h.key);
              return (
                <button
                  key={h.key}
                  onClick={() => toggleHoliday(h.key)}
                  disabled={holidaysBusy}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition text-sm ${
                    blocked
                      ? "border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/40 text-red-600 dark:text-red-400"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${blocked ? "bg-red-500 border-red-500" : "border-muted-foreground"}`}>
                    {blocked && <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  <span className="text-xs font-medium">{h.name}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {blockedHolidays.size === 0 ? "Nenhum feriado bloqueado — todas as datas estão liberadas." : `${blockedHolidays.size} feriado${blockedHolidays.size > 1 ? "s" : ""} bloqueado${blockedHolidays.size > 1 ? "s" : ""}.`}
          </p>
        </section>
      )}
    </div>
  );
}

const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
