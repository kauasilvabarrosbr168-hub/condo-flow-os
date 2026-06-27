import { createFileRoute, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, Building, Plus, Loader2, Trash2, ImagePlus, Upload, X, Save, Pencil,
  Users as UsersIcon, ShieldCheck, CalendarDays,
} from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";
import { getCondoDetails, upsertArea, deleteArea } from "@/lib/admin-condo.functions";
import { AreaCalendarView } from "@/components/condo/area-calendar-view";
import { AreaSchedulePicker, EMPTY_SCHEDULE, type WeekSchedule } from "@/components/condo/area-schedule-picker";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/condos/$condoId")({
  head: () => ({ meta: [{ title: "Editar condomínio · CondoFlow Admin" }] }),
  component: CondoDetailPage,
});

type Area = {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  capacity: number | null;
  min_advance_hours: number;
  requires_checklist: boolean;
  cover_url: string | null;
  gallery: string[];
  active: boolean;
  available_slots: WeekSchedule | null;
};

type Detail = {
  condo: { id: string; name: string; address: string | null };
  areas: Area[];
  members: { user_id: string; role: string; profiles: { full_name: string; email: string; unit_label: string | null } | null }[];
  subscription: { status: string; plans: { name: string } | null } | null;
};

function CondoDetailPage() {
  const { condoId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Child route matched (e.g. /edit) — let the child render
  if (pathname !== `/admin/condos/${condoId}`) {
    return <Outlet />;
  }

  return <CondoDetailContent condoId={condoId} />;
}

function CondoDetailContent({ condoId }: { condoId: string }) {
  const navigate = useNavigate();
  const fetchDetail = useServerFn(getCondoDetails);
  const upsert = useServerFn(upsertArea);
  const del = useServerFn(deleteArea);

  const [data, setData] = useState<Detail | null>(null);
  const [editing, setEditing] = useState<Partial<Area> | null>(null);
  const [calendarArea, setCalendarArea] = useState<Area | null>(null);
  const [services, setServices] = useState<{ id: string; title: string; notes: string | null; photo_url: string | null; done_at: string; worker_id: string }[] | null>(null);

  const load = useCallback(() => {
    fetchDetail({ data: { condoId } }).then((d) => setData(d as unknown as Detail));
  }, [fetchDetail, condoId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.from("service_logs")
      .select("id, title, notes, photo_url, done_at, worker_id")
      .eq("condo_id", condoId)
      .order("done_at", { ascending: false })
      .limit(50)
      .then(({ data: d }) => setServices(d ?? []));
  }, [condoId]);

  const onSave = async (a: Partial<Area>) => {
    try {
      await upsert({ data: { condoId, area: a as any } });
      toast.success("Área salva");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Remover esta área?")) return;
    try {
      await del({ data: { areaId: id } });
      toast.success("Área removida");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  if (!data) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <button
        onClick={() => navigate({ to: "/admin/condos" })}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para condomínios
      </button>

      <PageHeader
        title={data.condo.name}
        description={data.condo.address ?? "Sem endereço cadastrado"}
        actions={
          <div className="flex items-center gap-2">
            {data.subscription?.plans?.name && <Badge tone="primary">{data.subscription.plans.name}</Badge>}
            {data.subscription?.status && <Badge tone={data.subscription.status === "active" ? "success" : "warning"}>{data.subscription.status}</Badge>}
          </div>
        }
      />

      <Tabs defaultValue="areas">
        <TabsList>
          <TabsTrigger value="areas"><Building className="h-3.5 w-3.5 mr-1.5" />Áreas comuns</TabsTrigger>
          <TabsTrigger value="members"><UsersIcon className="h-3.5 w-3.5 mr-1.5" />Membros</TabsTrigger>
          <TabsTrigger value="services"><ShieldCheck className="h-3.5 w-3.5 mr-1.5" />Serviços</TabsTrigger>
          {calendarArea && (
            <TabsTrigger value="calendar"><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Calendário — {calendarArea.name}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="areas" className="mt-5">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setEditing({ min_advance_hours: 24, requires_checklist: true, gallery: [], active: true })}>
              <Plus className="h-4 w-4" /> Nova área
            </Button>
          </div>
          {data.areas.length === 0 ? (
            <EmptyBlock
              icon={<Building className="h-5 w-5" />}
              title="Nenhuma área cadastrada"
              description="Adicione salão de festas, churrasqueira, quadra, sauna… com fotos, regras e capacidade."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.areas.map((a) => (
                <div key={a.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elegant transition group">
                  <div className="aspect-video bg-muted relative">
                    {a.cover_url ? (
                      <img src={a.cover_url} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Building className="h-8 w-8 opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setCalendarArea(a)} className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-background/90 backdrop-blur hover:bg-background" title="Ver calendário"><CalendarDays className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditing(a)} className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-background/90 backdrop-blur hover:bg-background" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onDelete(a.id)} className="h-7 w-7 inline-flex items-center justify-center rounded-lg bg-background/90 backdrop-blur hover:bg-destructive hover:text-destructive-foreground" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm">{a.name}</h3>
                    {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      {a.capacity && <span className="rounded-full bg-muted px-2 py-0.5">Cap. {a.capacity}</span>}
                      <span className="rounded-full bg-muted px-2 py-0.5">{a.min_advance_hours}h antec.</span>
                      {a.requires_checklist && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">Checklist</span>}
                      {a.gallery?.length > 0 && <span className="rounded-full bg-muted px-2 py-0.5">{a.gallery.length} fotos</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-5">
          {data.members.length === 0 ? (
            <EmptyBlock icon={<UsersIcon className="h-5 w-5" />} title="Sem membros" description="Use a tela de Condomínios para adicionar membros existentes." />
          ) : (
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {data.members.map((m) => (
                <div key={m.user_id + m.role} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{m.profiles?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{m.profiles?.email}{m.profiles?.unit_label ? ` · Unid. ${m.profiles.unit_label}` : ""}</p>
                  </div>
                  <Badge tone="primary">{m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {calendarArea && (
          <TabsContent value="calendar" className="mt-5">
            <AreaCalendarView
              area={calendarArea}
              condoId={condoId}
              onClose={() => setCalendarArea(null)}
            />
          </TabsContent>
        )}

        <TabsContent value="services" className="mt-5">
          {!services ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : services.length === 0 ? (
            <EmptyBlock icon={<ShieldCheck className="h-5 w-5" />} title="Nenhum serviço registrado" description="Os check-ins de colaboradores aparecem aqui." />
          ) : (
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {services.map((s) => (
                <div key={s.id} className="flex items-start gap-4 p-4">
                  {s.photo_url && <img src={s.photo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    {s.notes && <p className="text-xs text-muted-foreground mt-0.5">{s.notes}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(s.done_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editing && (
        <AreaEditor
          condoId={condoId}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={onSave}
        />
      )}
    </div>
  );
}

export function AreaEditor({
  condoId, initial, onClose, onSave,
}: {
  condoId: string;
  initial: Partial<Area>;
  onClose: () => void;
  onSave: (a: Partial<Area>) => Promise<void> | void;
}) {
  const [a, setA] = useState<Partial<Area>>({
    ...initial,
    gallery: initial.gallery ?? [],
    available_slots: initial.available_slots ?? null,
  });
  const [scheduleEnabled, setScheduleEnabled] = useState(!!initial.available_slots);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "gallery" | null>(null);

  const upload = async (file: File, kind: "cover" | "gallery") => {
    setUploading(kind);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${condoId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("condo-areas").upload(path, file, { cacheControl: "3600", upsert: false });
    setUploading(null);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("condo-areas").getPublicUrl(path);
    if (kind === "cover") setA((p) => ({ ...p, cover_url: data.publicUrl }));
    else setA((p) => ({ ...p, gallery: [...(p.gallery ?? []), data.publicUrl] }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a.name?.trim()) return;
    setBusy(true);
    await onSave(a);
    setBusy(false);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{a.id ? "Editar área" : "Nova área comum"}</DialogTitle>
          <DialogDescription>Imagens, regras, capacidade e antecedência de reserva.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capa</label>
            <div className="mt-1.5 aspect-video rounded-xl border-2 border-dashed border-border bg-muted/30 relative overflow-hidden">
              {a.cover_url ? (
                <>
                  <img src={a.cover_url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setA((p) => ({ ...p, cover_url: null }))} className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-background/90 backdrop-blur inline-flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"><X className="h-3.5 w-3.5" /></button>
                </>
              ) : (
                <label className="flex h-full flex-col items-center justify-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  {uploading === "cover" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  Clique para enviar uma imagem de capa
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "cover"); }} />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Galeria</label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {(a.gallery ?? []).map((url) => (
                <div key={url} className="aspect-square rounded-lg overflow-hidden relative group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setA((p) => ({ ...p, gallery: p.gallery?.filter((g) => g !== url) }))} className="absolute top-1 right-1 h-6 w-6 rounded-md bg-background/90 inline-flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition text-muted-foreground">
                {uploading === "gallery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "gallery"); }} />
              </label>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</span>
              <Input required value={a.name ?? ""} onChange={(e) => setA((p) => ({ ...p, name: e.target.value }))} placeholder="Salão de festas" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Capacidade</span>
              <Input type="number" min={0} value={a.capacity ?? ""} onChange={(e) => setA((p) => ({ ...p, capacity: e.target.value === "" ? null : Number(e.target.value) }))} />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</span>
              <Textarea rows={2} value={a.description ?? ""} onChange={(e) => setA((p) => ({ ...p, description: e.target.value }))} />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Regras de uso</span>
              <Textarea rows={4} value={a.rules ?? ""} onChange={(e) => setA((p) => ({ ...p, rules: e.target.value }))} placeholder="Horário de uso, número máximo de convidados, multas…" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Antecedência (h)</span>
              <Input type="number" min={0} value={a.min_advance_hours ?? 24} onChange={(e) => setA((p) => ({ ...p, min_advance_hours: Number(e.target.value) }))} />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={a.requires_checklist ?? true} onChange={(e) => setA((p) => ({ ...p, requires_checklist: e.target.checked }))} className="h-4 w-4 rounded border-border" />
              <span className="text-sm">Gerar checklist pré/pós uso</span>
            </label>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Horários disponíveis</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => {
                    setScheduleEnabled(e.target.checked);
                    setA((p) => ({ ...p, available_slots: e.target.checked ? EMPTY_SCHEDULE : null }));
                  }}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Definir horários</span>
              </label>
            </div>
            {scheduleEnabled && (
              <AreaSchedulePicker
                value={a.available_slots ?? EMPTY_SCHEDULE}
                onChange={(v) => setA((p) => ({ ...p, available_slots: v }))}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
