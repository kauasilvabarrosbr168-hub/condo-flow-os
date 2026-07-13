// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Building, Plus, Loader2, X, Trash2, CalendarDays, Clock, Sparkles, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { AreaCalendarView } from "@/components/condo/area-calendar-view";
import { scheduleLabel, type WeekSchedule } from "@/components/condo/area-schedule-picker";
import { toast } from "sonner";
import { AREA_CATALOG, type AreaType } from "@/lib/area-catalog";
import { configureAreaWithAI, type AIAreaConfig } from "@/lib/ai-engine/area-config.functions";

export const Route = createFileRoute("/app/areas")({
  head: () => ({ meta: [{ title: "Áreas comuns · CondoFlow" }] }),
  component: AreasPage,
});

type Area = {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  capacity: number | null;
  cover_url: string | null;
  min_advance_hours: number;
  requires_checklist: boolean;
  available_slots: WeekSchedule | null;
};

function AreasPage() {
  const { condo, profile, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [calendarArea, setCalendarArea] = useState<Area | null>(null);

  const { data: areas, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["areas", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("common_areas")
        .select("id,name,description,rules,capacity,cover_url,min_advance_hours,requires_checklist,available_slots")
        .eq("condo_id", condoId!)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as Area[];
    },
  });

  if (!condoId) {
    return <div className="p-8"><EmptyState icon={Building} title="Sem condomínio" description="Você ainda não está vinculado a um condomínio." /></div>;
  }

  if (calendarArea) {
    return (
      <div className="px-4 lg:px-8 py-8">
        <button
          onClick={() => setCalendarArea(null)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition"
        >
          ← Voltar para áreas
        </button>
        <AreaCalendarView area={calendarArea} condoId={condoId} onClose={() => setCalendarArea(null)} />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Áreas comuns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Configure e gerencie os espaços do condomínio." : "Espaços disponíveis para reserva."}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant hover:opacity-95">
            <Plus className="h-4 w-4" /> Nova área
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (areas?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Building}
          title="Nenhuma área cadastrada"
          description={isAdmin ? "Escolha o tipo de área e a IA configura as regras automaticamente." : "O síndico ainda não cadastrou áreas comuns."}
          tone="primary"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {areas!.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card shadow-card hover:shadow-elegant transition overflow-hidden group">
              <div className="relative">
                {a.cover_url ? (
                  <div className="h-36 w-full bg-muted overflow-hidden">
                    <img src={a.cover_url} alt={a.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-36 w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Building className="h-8 w-8 text-primary/40" />
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Remover "${a.name}"?`)) return;
                      const { count } = await supabase
                        .from("reservations")
                        .select("id", { count: "exact", head: true })
                        .eq("area_id", a.id)
                        .gte("ends_at", new Date().toISOString());
                      if ((count ?? 0) > 0) {
                        toast.error(`Esta área tem ${count} reserva(s) ativa(s). Cancele-as antes de remover.`);
                        return;
                      }
                      const { error } = await supabase.from("common_areas").delete().eq("id", a.id);
                      if (error) toast.error(error.message);
                      else { toast.success("Área removida"); qc.invalidateQueries({ queryKey: ["areas", condoId] }); }
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-background/90 backdrop-blur inline-flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition"
                    title="Remover área"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold">{a.name}</h3>
                {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                {a.available_slots && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{scheduleLabel(a.available_slots)}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  {a.capacity && <span className="rounded-full bg-muted px-2 py-0.5">Cap. {a.capacity}</span>}
                  <span className="rounded-full bg-muted px-2 py-0.5">{a.min_advance_hours}h antec.</span>
                  {a.requires_checklist && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">Checklist</span>}
                </div>
                <button
                  onClick={() => setCalendarArea(a)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border text-xs hover:bg-muted transition"
                >
                  <CalendarDays className="h-3.5 w-3.5" /> Ver calendário e reservas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <NewAreaDialog
          condoId={condoId!}
          onClose={() => setOpen(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["areas", condoId] })}
        />
      )}
    </div>
  );
}

/* ── Dialog em 2 etapas ── */
function NewAreaDialog({ condoId, onClose, onCreated }: { condoId: string; onClose: () => void; onCreated: () => void }) {
  const configureArea = useServerFn(configureAreaWithAI);
  const [step, setStep] = useState<"choose" | "configure">("choose");
  const [selectedType, setSelectedType] = useState<AreaType | null>(null);
  const [userRules, setUserRules] = useState("");
  const [name, setName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AIAreaConfig | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState(false);

  const onFile = (f: File | null) => {
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(f ? URL.createObjectURL(f) : null);
  };

  const pickType = (type: AreaType) => {
    setSelectedType(type);
    setName(type.name);
    setAiConfig(null);
    setUserRules("");
    setStep("configure");
  };

  const analyzeRules = async () => {
    if (!selectedType) return;
    setAnalyzing(true);
    try {
      const config = await configureArea({ data: { areaType: selectedType, userRules } });
      setAiConfig(config);
      toast.success("IA analisou as regras!");
    } catch {
      toast.error("Falha ao analisar. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !name.trim()) return;
    setBusy(true);
    try {
      // Se não analisou ainda, analisa agora
      let config = aiConfig;
      if (!config) {
        config = await configureArea({ data: { areaType: selectedType, userRules } });
        setAiConfig(config);
      }

      let cover_url: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() || "jpg";
        const path = `${condoId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("condo-areas").upload(path, coverFile, { cacheControl: "3600" });
        if (upErr) { toast.error("Falha no upload: " + upErr.message); setBusy(false); return; }
        cover_url = supabase.storage.from("condo-areas").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("common_areas").insert({
        condo_id: condoId,
        name: name.trim(),
        description: selectedType.description,
        rules: config.rules_summary || userRules || null,
        cover_url,
        capacity: config.max_simultaneous ?? selectedType.defaultCapacity,
        min_advance_hours: selectedType.defaultAdvanceHours,
        requires_checklist: config.requires_checklist,
        available_slots: config.operating_hours,
      });

      if (error) { toast.error(error.message); return; }
      toast.success(`${selectedType.emoji} ${name} criada com sucesso!`);
      onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-elegant animate-pop my-8">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            {step === "configure" && (
              <button type="button" onClick={() => setStep("choose")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold">
                {step === "choose" ? "Qual área você quer adicionar?" : `${selectedType?.emoji} ${name}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === "choose" ? "Escolha o tipo e a IA configura automaticamente" : "Descreva as regras do seu condomínio"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Etapa 1 — Escolher tipo */}
        {step === "choose" && (
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {AREA_CATALOG.map((type) => (
                <button
                  key={type.key}
                  onClick={() => pickType(type)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 hover:border-primary/50 hover:bg-primary/5 transition text-center group"
                >
                  <span className="text-2xl">{type.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Etapa 2 — Configurar com IA */}
        {step === "configure" && selectedType && (
          <form onSubmit={submit}>
            <div className="p-5 space-y-4">

              {/* Nome personalizado */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome da área</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                  className={inputCls + " mt-1"}
                />
              </div>

              {/* Foto */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Foto da área (opcional)</label>
                <div className="mt-1 space-y-2">
                  {coverPreview && <img src={coverPreview} alt="Prévia" className="w-full h-32 object-cover rounded-lg border border-border" />}
                  <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="text-xs" />
                </div>
              </div>

              {/* Regras */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Regras do seu condomínio <span className="text-muted-foreground/60">(escreva como quiser — a IA entende)</span>
                </label>
                <textarea
                  value={userRules}
                  onChange={(e) => { setUserRules(e.target.value); setAiConfig(null); }}
                  rows={4}
                  placeholder={`Ex: Nossa ${selectedType.name.toLowerCase()} funciona das 8h às 22h. Máximo de 20 pessoas. Precisa reservar com 24h de antecedência. Proibido som alto após 22h.`}
                  className={inputCls + " py-2.5 resize-none h-auto mt-1"}
                />
              </div>

              {/* Botão analisar */}
              <button
                type="button"
                onClick={analyzeRules}
                disabled={analyzing}
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition disabled:opacity-60"
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {analyzing ? "IA analisando as regras…" : "Analisar regras com IA"}
              </button>

              {/* Resultado da IA */}
              {aiConfig && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs font-semibold text-primary">IA configurou a área</p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">"{aiConfig.ai_interpretation}"</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip label={aiConfig.requires_reservation ? "Reserva obrigatória" : "Uso livre"} active={aiConfig.requires_reservation} />
                    <Chip label="Aprovação do síndico" active={aiConfig.requires_approval} />
                    <Chip label="Checklist" active={aiConfig.requires_checklist} />
                    {aiConfig.max_simultaneous && <Chip label={`Máx. ${aiConfig.max_simultaneous} pessoas`} active />}
                    {aiConfig.slot_duration_hours && <Chip label={`Slots de ${aiConfig.slot_duration_hours}h`} active />}
                  </div>
                  {aiConfig.checklist_items.length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground mb-1">Checklist gerado:</p>
                      <ul className="space-y-0.5">
                        {aiConfig.checklist_items.map((item, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-border">
              <button type="button" onClick={() => setStep("choose")} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted">
                Voltar
              </button>
              <button
                type="submit"
                disabled={busy || analyzing}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-gradient-hero text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiConfig ? "Criar área" : "Analisar e criar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Chip({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground line-through opacity-50"}`}>
      {label}
    </span>
  );
}

const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";
