import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building, Plus, Loader2, X, Trash2, CalendarDays, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { AreaCalendarView } from "@/components/condo/area-calendar-view";
import { scheduleLabel, type WeekSchedule } from "@/components/condo/area-schedule-picker";
import { toast } from "sonner";

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

  // Calendar detail view
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
          description={isAdmin ? "Cadastre sauna, salão, churrasqueira, quadra… qualquer espaço que possa ser reservado." : "O síndico ainda não cadastrou áreas comuns."}
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

function NewAreaDialog({ condoId, onClose, onCreated }: { condoId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [minAdvance, setMinAdvance] = useState(24);
  const [requiresChecklist, setRequiresChecklist] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = (f: File | null) => {
    setCoverFile(f);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
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
        description: description.trim() || null,
        rules: rules.trim() || null,
        cover_url,
        capacity: capacity === "" ? null : Number(capacity),
        min_advance_hours: minAdvance,
        requires_checklist: requiresChecklist,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Área criada");
      onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elegant animate-pop my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold">Nova área comum</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Capa (imagem)">
            <div className="space-y-2">
              {coverPreview && <img src={coverPreview} alt="Prévia" className="w-full h-32 object-cover rounded-lg border border-border" />}
              <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="text-xs" />
            </div>
          </Field>
          <Field label="Nome"><input required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Salão de festas" className={inputCls} /></Field>
          <Field label="Descrição"><textarea value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls + " py-2 resize-none"} /></Field>
          <Field label="Regras de uso"><textarea value={rules} maxLength={500} onChange={(e) => setRules(e.target.value)} rows={3} placeholder="Horário, limite de convidados, taxa de limpeza…" className={inputCls + " py-2 resize-none h-auto"} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacidade"><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} /></Field>
            <Field label="Antecedência (h)"><input type="number" min={0} value={minAdvance} onChange={(e) => setMinAdvance(Number(e.target.value))} className={inputCls} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={requiresChecklist} onChange={(e) => setRequiresChecklist(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Gerar checklist automático pré e pós-uso
          </label>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-hero text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}
