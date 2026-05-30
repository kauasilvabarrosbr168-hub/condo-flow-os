import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Save, Upload, X, Plus, Trash2, Phone, Mail, MessageCircle, Link as LinkIcon, ImageIcon, Building2, Image as ImageBanner,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getCondoDetails, updateCondo } from "@/lib/admin-condo.functions";
import { AreaEditor } from "@/routes/admin.condos.$condoId";
import { upsertArea, deleteArea } from "@/lib/admin-condo.functions";
import { toast } from "sonner";

type Contact = { label: string; value: string; kind?: "phone" | "email" | "whatsapp" | "other" };

type CondoForm = {
  name: string;
  address: string;
  description: string;
  logo_url: string | null;
  cover_url: string | null;
  towers_count: number | null;
  blocks_count: number | null;
  rules: string;
  general_info: string;
  contacts: Contact[];
};

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
};

export function CondoEditor({
  condoId,
  variant = "admin",
}: {
  condoId: string;
  variant?: "admin" | "sindico";
}) {
  const fetchDetail = useServerFn(getCondoDetails);
  const save = useServerFn(updateCondo);
  const upsert = useServerFn(upsertArea);
  const del = useServerFn(deleteArea);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [form, setForm] = useState<CondoForm | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [editingArea, setEditingArea] = useState<Partial<Area> | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CondoForm, string>>>({});
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDetail({ data: { condoId } })
      .then((d) => {
        const c = d.condo as any;
        setForm({
          name: c.name ?? "",
          address: c.address ?? "",
          description: c.description ?? "",
          logo_url: c.logo_url ?? null,
          cover_url: c.cover_url ?? null,
          towers_count: c.towers_count ?? null,
          blocks_count: c.blocks_count ?? null,
          rules: c.rules ?? "",
          general_info: c.general_info ?? "",
          contacts: Array.isArray(c.contacts) ? c.contacts : [],
        });
        setAreas((d.areas ?? []) as Area[]);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [condoId, fetchDetail]);

  const uploadBranding = async (file: File, kind: "logo" | "cover") => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem maior que 5MB"); return; }
    setUploading(kind);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${condoId}/${kind}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("condo-branding").upload(path, file, { cacheControl: "3600", upsert: false });
    setUploading(null);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("condo-branding").getPublicUrl(path);
    setForm((p) => (p ? { ...p, [kind === "logo" ? "logo_url" : "cover_url"]: data.publicUrl } : p));
  };

  const validate = (f: CondoForm) => {
    const e: typeof errors = {};
    if (!f.name.trim() || f.name.trim().length < 2) e.name = "Informe o nome do condomínio";
    if (f.towers_count != null && (f.towers_count < 0 || f.towers_count > 500)) e.towers_count = "Entre 0 e 500";
    if (f.blocks_count != null && (f.blocks_count < 0 || f.blocks_count > 500)) e.blocks_count = "Entre 0 e 500";
    f.contacts.forEach((c, i) => {
      if (!c.label.trim() || !c.value.trim()) e.contacts = `Contato #${i + 1} incompleto`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!form) return;
    if (!validate(form)) { toast.error("Revise os campos destacados"); return; }
    setSaving(true);
    try {
      await save({
        data: {
          condoId,
          patch: {
            name: form.name.trim(),
            address: form.address.trim() || null,
            description: form.description.trim() || null,
            logo_url: form.logo_url,
            cover_url: form.cover_url,
            towers_count: form.towers_count,
            blocks_count: form.blocks_count,
            rules: form.rules.trim() || null,
            general_info: form.general_info.trim() || null,
            contacts: form.contacts.map((c) => ({ label: c.label.trim(), value: c.value.trim(), kind: c.kind })),
          },
        },
      });
      setSavedAt(Date.now());
      toast.success("Alterações salvas com sucesso");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const reloadAreas = () => {
    fetchDetail({ data: { condoId } }).then((d) => setAreas((d.areas ?? []) as Area[]));
  };

  if (loading || !form) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const update = <K extends keyof CondoForm>(k: K, v: CondoForm[K]) => setForm((p) => (p ? { ...p, [k]: v } : p));

  return (
    <div className="space-y-6">
      {/* Live preview header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="aspect-[5/1] bg-gradient-to-br from-primary/20 via-primary/10 to-background relative">
          {form.cover_url && <img src={form.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        </div>
        <div className="px-6 pb-5 -mt-10 relative flex items-end gap-4">
          <div className="h-20 w-20 rounded-2xl border-4 border-card bg-muted shadow-elegant overflow-hidden shrink-0 flex items-center justify-center">
            {form.logo_url ? <img src={form.logo_url} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div className="min-w-0 pb-1">
            <h2 className="text-xl font-semibold truncate">{form.name || "Nome do condomínio"}</h2>
            <p className="text-xs text-muted-foreground truncate">{form.address || "Endereço…"}</p>
          </div>
          <div className="ml-auto pb-1 flex items-center gap-2">
            {savedAt && Date.now() - savedAt < 4000 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-fade-in">✓ Salvo</span>
            )}
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar alterações
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="identity">
        <TabsList>
          <TabsTrigger value="identity">Identidade</TabsTrigger>
          <TabsTrigger value="structure">Estrutura</TabsTrigger>
          <TabsTrigger value="areas">Áreas comuns</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        {/* IDENTITY */}
        <TabsContent value="identity" className="mt-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <BrandUpload
              label="Logo do condomínio"
              icon={<ImageIcon className="h-4 w-4" />}
              url={form.logo_url}
              uploading={uploading === "logo"}
              aspect="aspect-square max-w-[180px]"
              onPick={(f) => uploadBranding(f, "logo")}
              onRemove={() => update("logo_url", null)}
            />
            <BrandUpload
              label="Capa / banner"
              icon={<ImageBanner className="h-4 w-4" />}
              url={form.cover_url}
              uploading={uploading === "cover"}
              aspect="aspect-[16/6]"
              onPick={(f) => uploadBranding(f, "cover")}
              onRemove={() => update("cover_url", null)}
            />
          </div>
          <Field label="Nome do condomínio" error={errors.name} required>
            <Input value={form.name} maxLength={120} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Endereço">
            <Input value={form.address} maxLength={300} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, bairro, cidade" />
          </Field>
          <Field label="Descrição" hint="Aparece para moradores e no portal público.">
            <Textarea rows={4} value={form.description} maxLength={2000} onChange={(e) => update("description", e.target.value)} />
          </Field>
        </TabsContent>

        {/* STRUCTURE */}
        <TabsContent value="structure" className="mt-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Quantidade de torres" error={errors.towers_count}>
              <Input type="number" min={0} max={500} value={form.towers_count ?? ""} onChange={(e) => update("towers_count", e.target.value === "" ? null : Number(e.target.value))} />
            </Field>
            <Field label="Quantidade de blocos" error={errors.blocks_count}>
              <Input type="number" min={0} max={500} value={form.blocks_count ?? ""} onChange={(e) => update("blocks_count", e.target.value === "" ? null : Number(e.target.value))} />
            </Field>
          </div>
        </TabsContent>

        {/* AREAS */}
        <TabsContent value="areas" className="mt-5">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setEditingArea({ min_advance_hours: 24, requires_checklist: true, gallery: [], active: true })}>
              <Plus className="h-4 w-4" /> Nova área
            </Button>
          </div>
          {areas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Nenhuma área cadastrada.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {areas.map((a) => (
                <div key={a.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-card group">
                  <div className="aspect-video bg-muted">
                    {a.cover_url ? <img src={a.cover_url} alt="" className="h-full w-full object-cover" /> : <div className="h-full grid place-items-center text-muted-foreground"><Building2 className="h-6 w-6 opacity-30" /></div>}
                  </div>
                  <div className="p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      {a.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{a.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingArea(a)} className="h-7 w-7 rounded-md hover:bg-muted inline-flex items-center justify-center"><Save className="h-3.5 w-3.5 rotate-0 opacity-0" /></button>
                      <button onClick={() => setEditingArea(a)} className="text-xs text-primary hover:underline px-2">Editar</button>
                      <button onClick={async () => { if (confirm("Remover esta área?")) { await del({ data: { areaId: a.id } }); toast.success("Removida"); reloadAreas(); } }} className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive inline-flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {editingArea && (
            <AreaEditor
              condoId={condoId}
              initial={editingArea}
              onClose={() => setEditingArea(null)}
              onSave={async (a) => {
                try { await upsert({ data: { condoId, area: a as any } }); toast.success("Área salva"); setEditingArea(null); reloadAreas(); }
                catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
              }}
            />
          )}
        </TabsContent>

        {/* RULES */}
        <TabsContent value="rules" className="mt-5">
          <Field label="Regras gerais do condomínio" hint="Horários de silêncio, mudanças, visitas, animais, etc.">
            <Textarea rows={14} value={form.rules} maxLength={10000} onChange={(e) => update("rules", e.target.value)} placeholder="Ex: Silêncio das 22h às 8h…" />
          </Field>
        </TabsContent>

        {/* CONTACTS */}
        <TabsContent value="contacts" className="mt-5 space-y-3">
          {form.contacts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>}
          {form.contacts.map((c, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[140px_1fr_1fr_auto] items-center">
              <Select value={c.kind ?? "other"} onValueChange={(v) => update("contacts", form.contacts.map((x, idx) => idx === i ? { ...x, kind: v as Contact["kind"] } : x))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone"><span className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5" />Telefone</span></SelectItem>
                  <SelectItem value="email"><span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5" />Email</span></SelectItem>
                  <SelectItem value="whatsapp"><span className="inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</span></SelectItem>
                  <SelectItem value="other"><span className="inline-flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5" />Outro</span></SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Título (ex: Portaria)" maxLength={80} value={c.label} onChange={(e) => update("contacts", form.contacts.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
              <Input placeholder="Valor" maxLength={200} value={c.value} onChange={(e) => update("contacts", form.contacts.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} />
              <Button type="button" size="icon" variant="ghost" onClick={() => update("contacts", form.contacts.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          {errors.contacts && <p className="text-xs text-destructive">{errors.contacts}</p>}
          <Button type="button" variant="outline" onClick={() => update("contacts", [...form.contacts, { label: "", value: "", kind: "phone" }])}>
            <Plus className="h-4 w-4" /> Adicionar contato
          </Button>
        </TabsContent>

        {/* INFO */}
        <TabsContent value="info" className="mt-5">
          <Field label="Informações gerais" hint="Texto livre exibido aos moradores (horários, regulamento interno, observações).">
            <Textarea rows={14} value={form.general_info} maxLength={10000} onChange={(e) => update("general_info", e.target.value)} />
          </Field>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <div className="rounded-full border border-border bg-card/95 backdrop-blur shadow-elegant px-4 py-2 flex items-center gap-3">
          {savedAt && Date.now() - savedAt < 4000 && <span className="text-xs text-emerald-600 dark:text-emerald-400">✓ Salvo</span>}
          <Button onClick={onSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
        </div>
      </div>
      {variant === "sindico" && null}
    </div>
  );
}

function Field({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}{required && <span className="text-destructive"> *</span>}</span>
      {children}
      {hint && !error && <span className="text-[11px] text-muted-foreground block">{hint}</span>}
      {error && <span className="text-[11px] text-destructive block">{error}</span>}
    </label>
  );
}

function BrandUpload({
  label, icon, url, uploading, aspect, onPick, onRemove,
}: {
  label: string; icon: React.ReactNode; url: string | null; uploading: boolean; aspect: string;
  onPick: (f: File) => void; onRemove: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1.5">{icon}{label}</span>
      </div>
      <div className={`${aspect} rounded-xl border-2 border-dashed border-border bg-muted/30 relative overflow-hidden`}>
        {url ? (
          <>
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={onRemove} className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-background/90 backdrop-blur inline-flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition"><X className="h-3.5 w-3.5" /></button>
          </>
        ) : (
          <label className="flex h-full flex-col items-center justify-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            Clique para enviar
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
          </label>
        )}
      </div>
    </div>
  );
}
