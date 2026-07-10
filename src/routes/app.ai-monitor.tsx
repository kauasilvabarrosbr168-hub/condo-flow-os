import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Brain, Zap, AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, MessageCircle, Phone, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/app/ai-monitor")({
  head: () => ({ meta: [{ title: "IA Operacional · CondoFlow" }] }),
  component: AIMonitorPage,
});

type EventLog = {
  id: string;
  event_type: string;
  entity_type: string | null;
  severity: string;
  summary: string;
  rules_handled: boolean | null;
  ai_called: boolean | null;
  ai_analysis: string | null;
  actions_taken: string[] | null;
  created_at: string;
};

type AISettings = {
  condo_id: string;
  enabled: boolean;
  can_create_tasks: boolean;
  can_change_priority: boolean;
  can_create_reminders: boolean;
  can_redistribute_tasks: boolean;
  whatsapp_phone?: string | null;
  notify_warning?: boolean;
  notify_critical?: boolean;
};

function AIMonitorPage() {
  const { condo, profile, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  const { data: events, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["ai_event_log", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_event_log")
        .select("id,event_type,entity_type,severity,summary,rules_handled,ai_called,ai_analysis,actions_taken,created_at")
        .eq("condo_id", condoId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as EventLog[];
    },
    refetchInterval: 30_000,
  });

  const { data: settings } = useQuery({
    enabled: !!condoId,
    queryKey: ["condo_ai_settings", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("condo_ai_settings")
        .select("*")
        .eq("condo_id", condoId!)
        .maybeSingle();
      return (data ?? { condo_id: condoId!, enabled: true, can_create_tasks: true, can_change_priority: true, can_create_reminders: true, can_redistribute_tasks: false }) as AISettings;
    },
  });

  useEffect(() => {
    if (settings?.whatsapp_phone) setWhatsappPhone(settings.whatsapp_phone);
  }, [settings?.whatsapp_phone]);

  if (!condoId || !isAdmin) {
    return (
      <div className="p-8">
        <EmptyState icon={Brain} title="Acesso restrito" description="O painel de IA é visível apenas para síndicos e administradoras." />
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = (events ?? []).filter((e) => e.created_at.startsWith(today));
  const aiCallsToday = todayEvents.filter((e) => e.ai_called).length;
  const criticalToday = todayEvents.filter((e) => e.severity === "critical").length;
  const totalActionsToday = todayEvents.reduce((acc, e) => acc + (e.actions_taken?.length ?? 0), 0);

  const savePhone = async () => {
    if (!condoId || !settings) return;
    setPhoneSaving(true);
    const phone = whatsappPhone.trim().replace(/\s/g, "");
    const { error } = await supabase
      .from("condo_ai_settings")
      .upsert({ ...settings, condo_id: condoId, whatsapp_phone: phone || null });
    setPhoneSaving(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["condo_ai_settings", condoId] });
    toast.success(phone ? "WhatsApp salvo! Alertas serão enviados para esse número." : "Número removido.");
  };

  const toggleEnabled = async () => {
    if (!settings) return;
    setSettingsBusy(true);
    const newVal = !settings.enabled;
    const { error } = await supabase
      .from("condo_ai_settings")
      .upsert({ ...settings, condo_id: condoId, enabled: newVal });
    setSettingsBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["condo_ai_settings", condoId] });
    toast.success(newVal ? "Motor de IA ativado" : "Motor de IA pausado");
  };

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Motor de IA Operacional
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Análise automática de eventos — age silenciosamente, sem chatbot.</p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={settingsBusy || !settings}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-sm font-medium hover:bg-muted transition disabled:opacity-50"
        >
          {settingsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : settings?.enabled ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          {settings?.enabled ? "Ativo" : "Pausado"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Eventos hoje", value: todayEvents.length, icon: Zap, tone: "text-primary" },
          { label: "Chamadas IA", value: aiCallsToday, icon: Brain, tone: "text-violet-500" },
          { label: "Alertas críticos", value: criticalToday, icon: AlertTriangle, tone: "text-destructive" },
          { label: "Ações tomadas", value: totalActionsToday, icon: CheckCircle2, tone: "text-success" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.tone}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Engine status */}
      {settings && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold mb-3">Permissões do motor</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { key: "can_create_tasks", label: "Criar tarefas" },
              { key: "can_change_priority", label: "Escalar prioridade" },
              { key: "can_create_reminders", label: "Criar lembretes" },
              { key: "can_redistribute_tasks", label: "Redistribuir tarefas" },
            ].map((p) => {
              const on = settings[p.key as keyof AISettings] as boolean;
              return (
                <div key={p.key} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border ${on ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-primary" : "bg-muted-foreground"}`} />
                  {p.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WhatsApp */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="h-4 w-4 text-green-500" />
          <p className="text-sm font-semibold">Notificações via WhatsApp</p>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Alertas de nível <strong>aviso</strong> e <strong>crítico</strong> chegam direto no seu WhatsApp em tempo real.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="+55 11 99999-9999"
              className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
            />
          </div>
          <button
            onClick={savePhone}
            disabled={phoneSaving}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-60 transition"
          >
            {phoneSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        </div>
        {settings?.whatsapp_phone && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            ✓ Ativo — alertas sendo enviados para {settings.whatsapp_phone}
          </p>
        )}
        {!settings?.whatsapp_phone && (
          <p className="mt-2 text-xs text-muted-foreground">Nenhum número cadastrado — notificações desativadas.</p>
        )}
      </div>

      {/* Event timeline */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <p className="text-sm font-semibold">Linha do tempo de eventos</p>
          <span className="text-xs text-muted-foreground">{(events ?? []).length} eventos recentes</span>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (events ?? []).length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Os eventos aparecem automaticamente quando moradores criam reservas, funcionários atualizam tarefas, etc.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(events ?? []).map((e) => {
              const isOpen = expanded === e.id;
              return (
                <li key={e.id}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/40 transition text-left"
                  >
                    <SeverityDot severity={e.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{eventTypeLabel(e.event_type)}</span>
                        {e.ai_called && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500">
                            <Brain className="h-2.5 w-2.5" /> IA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{e.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{fmtTime(e.created_at)}</span>
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 space-y-2 bg-muted/20">
                      {e.ai_analysis && (
                        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                          <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Brain className="h-3 w-3" /> Análise da IA</p>
                          <p className="text-xs text-foreground">{e.ai_analysis}</p>
                        </div>
                      )}
                      {(e.actions_taken ?? []).length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Ações executadas</p>
                          <ul className="space-y-0.5">
                            {(e.actions_taken as string[]).map((a, i) => (
                              <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />{a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>Tipo: {e.entity_type ?? "—"}</span>
                        <span>Regras: {e.rules_handled ? "tratado" : "não tratado"}</span>
                        <span>IA chamada: {e.ai_called ? "sim" : "não"}</span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const cls = severity === "critical" ? "bg-destructive" : severity === "warning" ? "bg-yellow-500" : "bg-primary";
  return <span className={`mt-2 h-2 w-2 rounded-full shrink-0 ${cls}`} />;
}

function eventTypeLabel(t: string) {
  const map: Record<string, string> = {
    reservation_created: "Reserva criada",
    reservation_cancelled: "Reserva cancelada",
    task_created: "Tarefa criada",
    task_status_changed: "Tarefa atualizada",
    cleaning_requested: "Limpeza solicitada",
    service_completed: "Serviço concluído",
    incident_reported: "Incidente reportado",
  };
  return map[t] ?? t;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
