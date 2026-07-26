// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ScrollText, Plus, Trash2, Pencil, Brain, AlertTriangle,
  CheckCircle2, Clock, Building, Loader2, X, Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/brand";
import { toast } from "sonner";

export const Route = createFileRoute("/app/condo-rules")({
  head: () => ({ meta: [{ title: "Regras Operacionais · CondoFlow" }] }),
  component: CondoRulesPage,
});

type Area = { id: string; name: string };
type Rule = {
  id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  area_id: string | null;
  priority: "baixa" | "normal" | "alta";
  active: boolean;
  created_at: string;
};

const FREQUENCY_OPTIONS = [
  "diária",
  "2x por semana",
  "semanal",
  "quinzenal",
  "mensal",
  "após cada reserva",
  "sob demanda",
];

const PRIORITY_TONE: Record<string, "default" | "warning" | "destructive"> = {
  baixa:  "default",
  normal: "warning",
  alta:   "destructive",
};

const PRIORITY_LABEL: Record<string, string> = {
  baixa:  "Baixa",
  normal: "Normal",
  alta:   "Alta",
};

function CondoRulesPage() {
  const { profile, condo, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;

  const [rules,   setRules]   = useState<Rule[]>([]);
  const [areas,   setAreas]   = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState<null | "new" | Rule>(null);

  const fetchAll = async () => {
    if (!condoId) return;
    const [rulesRes, areasRes] = await Promise.all([
      supabase
        .from("condo_service_rules")
        .select("*")
        .eq("condo_id", condoId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("common_areas")
        .select("id,name")
        .eq("condo_id", condoId)
        .eq("active", true),
    ]);
    setRules(rulesRes.data ?? []);
    setAreas(areasRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [condoId]);

  const remove = async (id: string) => {
    if (!confirm("Remover esta regra?")) return;
    await supabase.from("condo_service_rules").delete().eq("id", id);
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Regra removida");
  };

  const toggleActive = async (rule: Rule) => {
    const { data, error } = await supabase
      .from("condo_service_rules")
      .update({ active: !rule.active })
      .eq("id", rule.id)
      .select().single();
    if (!error && data) {
      setRules((prev) => prev.map((r) => r.id === rule.id ? data : r));
      toast.success(data.active ? "Regra reativada" : "Regra pausada");
    }
  };

  const areaName = (id: string | null) =>
    id ? (areas.find((a) => a.id === id)?.name ?? "—") : null;

  if (!isAdmin) {
    return (
      <div className="p-8">
        <EmptyState
          icon={ScrollText}
          title="Acesso restrito"
          description="Apenas síndicos e administradoras podem gerenciar as regras operacionais."
        />
      </div>
    );
  }

  const active   = rules.filter((r) => r.active);
  const inactive = rules.filter((r) => !r.active);

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Regras Operacionais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina as regras de limpeza e serviço do condomínio. A IA as usa ao gerar tarefas automáticas.
          </p>
        </div>
        <button
          onClick={() => setDialog("new")}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95 transition"
        >
          <Plus className="h-4 w-4" /> Nova regra
        </button>
      </div>

      {/* Explicação IA */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary">Como a IA usa estas regras</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toda vez que o síndico clica em "Gerar com IA" na área de Tarefas, o motor de IA recebe estas regras
            como contexto obrigatório — garantindo que as tarefas geradas respeitem as rotinas do seu condomínio.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Regras ativas */}
      {!loading && active.length === 0 && inactive.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma regra ainda"
          description='Clique em "Nova regra" para ensinar a IA como seu condomínio funciona.'
          tone="primary"
        />
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ativas ({active.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                areaName={areaName(rule.area_id)}
                onEdit={() => setDialog(rule)}
                onRemove={() => remove(rule.id)}
                onToggle={() => toggleActive(rule)}
              />
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pausadas ({inactive.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {inactive.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                areaName={areaName(rule.area_id)}
                onEdit={() => setDialog(rule)}
                onRemove={() => remove(rule.id)}
                onToggle={() => toggleActive(rule)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Dialog criar / editar */}
      {dialog !== null && (
        <RuleDialog
          rule={dialog === "new" ? null : dialog}
          condoId={condoId!}
          areas={areas}
          onClose={() => setDialog(null)}
          onSaved={(saved) => {
            setRules((prev) => {
              const existing = prev.find((r) => r.id === saved.id);
              return existing
                ? prev.map((r) => r.id === saved.id ? saved : r)
                : [saved, ...prev];
            });
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Card de regra ──────────────────────────────────────────────── */
function RuleCard({
  rule, areaName, onEdit, onRemove, onToggle,
}: {
  rule: Rule;
  areaName: string | null;
  onEdit: () => void;
  onRemove: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-4 space-y-3 flex flex-col">
      {/* Topo */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{rule.title}</p>
          {rule.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rule.description}</p>
          )}
        </div>
        <Badge tone={PRIORITY_TONE[rule.priority]}>{PRIORITY_LABEL[rule.priority]}</Badge>
      </div>

      {/* Metadados */}
      <div className="flex flex-wrap gap-2">
        {rule.frequency && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {rule.frequency}
          </span>
        )}
        {areaName && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Building className="h-3 w-3" /> {areaName}
          </span>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 pt-1 border-t border-border/60 mt-auto">
        <button
          onClick={onToggle}
          title={rule.active ? "Pausar" : "Reativar"}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
            rule.active
              ? "border-border text-muted-foreground hover:border-warning/50 hover:text-warning"
              : "border-success/40 text-success hover:bg-success/10"
          }`}
        >
          {rule.active ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onEdit}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Dialog criar / editar regra ────────────────────────────────── */
function RuleDialog({
  rule, condoId, areas, onClose, onSaved,
}: {
  rule: Rule | null;
  condoId: string;
  areas: Area[];
  onClose: () => void;
  onSaved: (r: Rule) => void;
}) {
  const isNew = !rule;
  const [title,    setTitle]    = useState(rule?.title ?? "");
  const [desc,     setDesc]     = useState(rule?.description ?? "");
  const [freq,     setFreq]     = useState(rule?.frequency ?? "");
  const [areaId,   setAreaId]   = useState(rule?.area_id ?? "");
  const [priority, setPriority] = useState<"baixa"|"normal"|"alta">(rule?.priority ?? "normal");
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        condo_id:    condoId,
        title:       title.trim(),
        description: desc.trim() || null,
        frequency:   freq || null,
        area_id:     areaId || null,
        priority,
        active:      rule?.active ?? true,
        updated_at:  new Date().toISOString(),
      };
      const query = isNew
        ? supabase.from("condo_service_rules").insert(payload).select().single()
        : supabase.from("condo_service_rules").update(payload).eq("id", rule!.id).select().single();
      const { data, error } = await query;
      if (error) throw error;
      toast.success(isNew ? "Regra criada!" : "Regra atualizada!");
      onSaved(data as Rule);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elegant" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            {isNew ? "Nova regra operacional" : "Editar regra"}
          </h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Ex: "Limpeza da piscina" ou "Verificação da academia"'
              className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 transition"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Descrição / detalhes</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Quais etapas? Quais produtos? Qual padrão esperado?"
              rows={3}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-ring/40 transition"
            />
          </div>

          {/* Frequência + Área */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Frequência</label>
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
              >
                <option value="">— Selecione —</option>
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Área (opcional)</label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
              >
                <option value="">Geral (todas as áreas)</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Prioridade para a IA</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["baixa", "normal", "alta"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`h-9 rounded-lg border text-xs font-medium capitalize transition ${
                    priority === p
                      ? p === "alta"    ? "border-destructive bg-destructive/10 text-destructive"
                        : p === "normal" ? "border-warning bg-warning/10 text-warning-foreground"
                        : "border-border bg-muted text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              "Alta" faz a IA priorizar e gerar tarefas relacionadas com mais frequência.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted transition">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!title.trim() || saving}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-gradient-hero text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-95 transition"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {isNew ? "Criar regra" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
