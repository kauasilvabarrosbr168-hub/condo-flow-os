// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Brain, Loader2, Save, CheckCircle2, Sparkles, RefreshCw,
  AlertTriangle, Info, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { saveCondoAiContext, getCondoAiContext } from "@/lib/ai-context.functions";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/app/ai-setup")({
  head: () => ({ meta: [{ title: "Configurar IA · CondoFlow" }] }),
  component: AiSetupPage,
});

type ServiceRule = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  priority: string;
  active: boolean;
};

const PLACEHOLDER = `Descreva como seu condomínio funciona. Quanto mais detalhes, melhor a IA vai trabalhar.

Exemplos do que incluir:
- Horários de funcionamento das áreas (piscina, salão, academia…)
- Frequência de limpeza de cada área
- Manutenções periódicas (filtro da piscina, elevador, gerador…)
- Regras específicas após reservas (ex: área gourmet deve ser limpa em até 2h)
- Número de colaboradores e seus turnos
- Prestadores fixos de serviço e o que cada um faz
- Qualquer rotina importante que a IA deve respeitar`;

function AiSetupPage() {
  const { condo, profile, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;

  const fetchCtx  = useServerFn(getCondoAiContext);
  const saveCtx   = useServerFn(saveCondoAiContext);

  const [context, setContext]       = useState("");
  const [onboardedAt, setOnboarded] = useState<string | null>(null);
  const [rules, setRules]           = useState<ServiceRule[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [rulesOpen, setRulesOpen]   = useState(false);

  useEffect(() => {
    if (!condoId) return;
    setLoading(true);
    fetchCtx({ data: { condoId } })
      .then((r) => {
        setContext(r.aiContext ?? "");
        setOnboarded(r.onboardedAt ?? null);
        setRules(r.serviceRules as ServiceRule[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [condoId, fetchCtx]);

  if (!condoId || !isAdmin) {
    return (
      <div className="p-8">
        <EmptyState icon={Brain} title="Acesso restrito" description="Configuração da IA disponível apenas para síndicos e administradoras." />
      </div>
    );
  }

  const handleSave = async () => {
    if (!condoId || context.trim().length < 20) {
      toast.error("Descreva o condomínio com pelo menos 20 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveCtx({ data: { condoId, context: context.trim() } });
      toast.success(`Contexto salvo! ${result.rulesCreated} regra${result.rulesCreated !== 1 ? "s" : ""} operacional${result.rulesCreated !== 1 ? "is" : ""} gerada${result.rulesCreated !== 1 ? "s" : ""} pela IA.`);
      // Recarrega regras
      const updated = await fetchCtx({ data: { condoId } });
      setRules(updated.serviceRules as ServiceRule[]);
      setOnboarded(updated.onboardedAt ?? null);
      setRulesOpen(true);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar contexto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const { error } = await supabase.from("condo_service_rules").delete().eq("id", ruleId);
    if (error) { toast.error(error.message); return; }
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    toast.success("Regra removida.");
  };

  const handleToggleRule = async (rule: ServiceRule) => {
    const { error } = await supabase.from("condo_service_rules").update({ active: !rule.active }).eq("id", rule.id);
    if (error) { toast.error(error.message); return; }
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isFirstTime = !onboardedAt;
  const activeRules = rules.filter((r) => r.active);

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-elegant shrink-0">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isFirstTime ? "Configure a IA do seu condomínio" : "Configuração da IA"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isFirstTime
              ? "Explique como seu condomínio funciona para a IA aprender a rotina e gerar tarefas e lembretes automáticos."
              : "Atualize o contexto sempre que as regras ou a rotina do condomínio mudar."}
          </p>
        </div>
      </div>

      {/* Banner de primeira vez */}
      {isFirstTime && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-primary">Como funciona</p>
              <ul className="mt-2 space-y-1 text-muted-foreground text-xs">
                <li>• Você descreve a rotina, as regras e as manutenções do seu condomínio</li>
                <li>• A IA lê o texto e cria regras operacionais estruturadas automaticamente</li>
                <li>• A partir daí, ao clicar "Gerar com IA" em Tarefas, ela cria sugestões baseadas nessa rotina</li>
                <li>• Cada sugestão precisa da sua aprovação antes de virar uma tarefa real para o colaborador</li>
                <li>• Você pode atualizar o contexto aqui sempre que necessário</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Status atual */}
      {!isFirstTime && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">IA configurada</p>
            <p className="text-[11px] text-muted-foreground">
              Configurada em {new Date(onboardedAt!).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} · {activeRules.length} regra{activeRules.length !== 1 ? "s" : ""} ativa{activeRules.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
            <Sparkles className="h-3 w-3" /> Ativo
          </span>
        </div>
      )}

      {/* Área de texto principal */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Descrição do condomínio para a IA
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={14}
          maxLength={8000}
          placeholder={PLACEHOLDER}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring resize-y"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{context.length}/8000 caracteres</p>
          {context.length < 20 && context.length > 0 && (
            <p className="text-[11px] text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Mínimo 20 caracteres
            </p>
          )}
        </div>
      </div>

      {/* Botão salvar */}
      <button
        onClick={handleSave}
        disabled={saving || context.trim().length < 20}
        className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-gradient-hero text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60 transition shadow-elegant"
      >
        {saving
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando com IA…</>
          : isFirstTime
          ? <><Brain className="h-4 w-4" /> Configurar e ativar IA</>
          : <><RefreshCw className="h-4 w-4" /> Atualizar e regerar regras</>}
      </button>

      {/* Regras geradas */}
      {rules.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setRulesOpen((v) => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-muted/40 transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">
                Regras operacionais geradas pela IA ({rules.length})
              </p>
            </div>
            {rulesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {rulesOpen && (
            <div className="divide-y divide-border border-t border-border">
              {rules.map((rule) => (
                <div key={rule.id} className={`flex items-start gap-3 px-5 py-3 ${!rule.active ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{rule.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        rule.priority === "alta"
                          ? "text-destructive bg-destructive/10 border-destructive/30"
                          : rule.priority === "normal"
                          ? "text-primary bg-primary/10 border-primary/30"
                          : "text-muted-foreground bg-muted border-border"
                      }`}>
                        {rule.priority === "alta" ? "⚠ Alta" : rule.priority === "normal" ? "Normal" : "Baixa"}
                      </span>
                      {rule.frequency && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full border border-border">
                          {rule.frequency}
                        </span>
                      )}
                    </div>
                    {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition ${
                        rule.active
                          ? "border-border text-muted-foreground hover:bg-muted"
                          : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      {rule.active ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition text-muted-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
