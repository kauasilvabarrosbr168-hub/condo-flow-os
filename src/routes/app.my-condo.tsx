import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Copy, RefreshCw, Check, Sparkles, Plus, X, Phone, Trash2 } from "lucide-react";
import { CondoEditor } from "@/components/condo/condo-editor";
import { getMyCondoId, getCondoJoinCode, regenerateCondoJoinCode } from "@/lib/admin-condo.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CleaningService = { id: string; name: string; phone: string | null; price_cents: number; notes: string | null };

export const Route = createFileRoute("/app/my-condo")({
  head: () => ({ meta: [{ title: "Meu condomínio · CondoFlow" }] }),
  component: MyCondoPage,
});

function MyCondoPage() {
  const fetchId = useServerFn(getMyCondoId);
  const fetchCode = useServerFn(getCondoJoinCode);
  const regenCode = useServerFn(regenerateCondoJoinCode);
  const qc = useQueryClient();

  const [condoId, setCondoId] = useState<string | null | undefined>(undefined);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [regenBusy, setRegenBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openCleaning, setOpenCleaning] = useState(false);

  const { data: cleaningServices } = useQuery({
    enabled: !!condoId,
    queryKey: ["cleaning_services", condoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("cleaning_services")
        .select("id,name,phone,price_cents,notes")
        .eq("condo_id", condoId!)
        .eq("active", true)
        .order("name");
      return (data ?? []) as CleaningService[];
    },
  });

  useEffect(() => {
    fetchId().then((r) => setCondoId(r.condoId)).catch(() => setCondoId(null));
  }, [fetchId]);

  useEffect(() => {
    if (!condoId) return;
    fetchCode({ data: { condoId } }).then((r) => setJoinCode(r.joinCode)).catch(() => {});
  }, [condoId, fetchCode]);

  const handleCopy = () => {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegen = async () => {
    if (!condoId) return;
    setRegenBusy(true);
    try {
      const r = await regenCode({ data: { condoId } });
      setJoinCode(r.joinCode);
      toast.success("Código regenerado com sucesso.");
    } catch {
      toast.error("Erro ao regenerar o código.");
    } finally {
      setRegenBusy(false);
    }
  };

  if (condoId === undefined) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!condoId) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Nenhum condomínio vinculado</h1>
        <p className="text-sm text-muted-foreground">Você ainda não está associado a um condomínio como síndico.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Meu condomínio</h1>
        <p className="text-sm text-muted-foreground mt-1">Edite identidade visual, estrutura, áreas, regras e contatos do seu condomínio.</p>
      </div>

      {/* Código de entrada — visível só para síndico/admin */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Código de entrada do condomínio</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compartilhe com os moradores para que possam solicitar acesso ao app. Somente você e o super admin têm acesso a este código.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 font-mono text-2xl font-bold tracking-[0.25em] text-foreground bg-muted rounded-xl px-4 py-3 select-all">
            {joinCode ?? "········"}
          </div>
          <button
            onClick={handleCopy}
            disabled={!joinCode}
            title="Copiar código"
            className="h-12 w-12 inline-flex items-center justify-center rounded-xl border border-border hover:bg-muted transition disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={handleRegen}
            disabled={regenBusy}
            title="Gerar novo código"
            className="h-12 w-12 inline-flex items-center justify-center rounded-xl border border-border hover:bg-muted transition disabled:opacity-40"
          >
            {regenBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          ⚠ Ao gerar um novo código, o código anterior deixará de funcionar.
        </p>
      </div>

      {/* Prestadores de Limpeza */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Prestadores de limpeza</p>
            <p className="text-xs text-muted-foreground mt-0.5">Diaristas e empresas que os moradores podem solicitar ao fazer uma reserva.</p>
          </div>
          <button onClick={() => setOpenCleaning(true)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border text-xs font-medium hover:bg-muted transition">
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </button>
        </div>

        {(cleaningServices?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 rounded-xl border border-dashed border-border">Nenhum prestador cadastrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {cleaningServices!.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.name}</p>
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline">
                      <Phone className="h-3 w-3" />{s.phone}
                    </a>
                  )}
                  {s.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-primary">
                    {s.price_cents === 0 ? "A combinar" : `R$ ${(s.price_cents / 100).toFixed(2).replace(".", ",")}`}
                  </p>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remover "${s.name}"?`)) return;
                      const { error } = await supabase.from("cleaning_services").update({ active: false }).eq("id", s.id);
                      if (error) toast.error(error.message);
                      else { toast.success("Prestador removido"); qc.invalidateQueries({ queryKey: ["cleaning_services", condoId] }); }
                    }}
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

      <CondoEditor condoId={condoId} variant="sindico" />

      {openCleaning && (
        <NewCleaningServiceDialog
          condoId={condoId}
          onClose={() => setOpenCleaning(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["cleaning_services", condoId] })}
        />
      )}
    </div>
  );
}

const inputCls = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>;
}

function NewCleaningServiceDialog({ condoId, onClose, onCreated }: { condoId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("cleaning_services").insert({
      condo_id: condoId,
      name: name.trim(),
      phone: phone.trim() || null,
      price_cents: price === "" ? 0 : Math.round(Number(price) * 100),
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Prestador cadastrado!");
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-elegant animate-pop">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold">Novo prestador de limpeza</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Nome / Empresa"><input required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Ex: Limpeza Express, Dona Maria…" className={inputCls} /></Field>
          <Field label="Telefone / WhatsApp"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className={inputCls} /></Field>
          <Field label="Valor da diária (R$)">
            <input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Deixe vazio para 'A combinar'" className={inputCls} />
          </Field>
          <Field label="Observações"><textarea value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Horários disponíveis, especialidades…" className={inputCls + " py-2 resize-none h-auto"} /></Field>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted">Cancelar</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-hero text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Cadastrar
          </button>
        </div>
      </form>
    </div>
  );
}
