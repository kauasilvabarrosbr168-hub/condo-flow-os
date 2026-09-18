import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Users2, Hash, Clock, CheckCircle2, Undo2 } from "lucide-react";
import { PageHeader, KpiCard, EmptyBlock } from "@/components/admin/admin-shell";
import { listLeads, updateLeadStatus } from "@/lib/leads.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cadastros")({
  head: () => ({ meta: [{ title: "Área de Cadastros · CondoFlow Admin" }] }),
  component: CadastrosPage,
});

type Status = "pendente" | "atendendo" | "concluido";

type Lead = {
  id: string;
  cpf_cnpj: string;
  nome: string;
  email: string;
  telefone: string;
  unidades: string;
  funcionarios: string;
  contato_preferido: string;
  perfil: string;
  perfil_outro: string | null;
  interesse: string;
  origem: string;
  status: Status;
  created_at: string;
};

const TABS: { key: Status; label: string }[] = [
  { key: "pendente", label: "Pendentes" },
  { key: "atendendo", label: "Atendendo" },
  { key: "concluido", label: "Concluídos" },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function CadastrosPage() {
  const list = useServerFn(listLeads);
  const setStatusFn = useServerFn(updateLeadStatus);
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [tab, setTab] = useState<Status>("pendente");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    list({}).then((r) => setRows(r as unknown as Lead[])).catch(() => setRows([]));
  }, [list]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const all = rows ?? [];
    return {
      pendente: all.filter((r) => r.status === "pendente").length,
      atendendo: all.filter((r) => r.status === "atendendo").length,
      concluido: all.filter((r) => r.status === "concluido").length,
    };
  }, [rows]);

  const visible = useMemo(() => (rows ?? []).filter((r) => r.status === tab), [rows, tab]);

  const move = async (id: string, status: Status) => {
    setBusyId(id);
    try {
      await setStatusFn({ data: { id, status } });
      setRows((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Área de Cadastros"
        description="Todo mundo que preencheu o formulário 'Conhecer Sistema' no site, do primeiro ao último — a ordem de chegada é a prioridade de contato."
      />

      <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
        <KpiCard label="Pendentes" value={counts.pendente} icon={<Users2 className="h-4 w-4" />} tone="warning" />
        <KpiCard label="Atendendo" value={counts.atendendo} icon={<Clock className="h-4 w-4" />} tone="primary" />
        <KpiCard label="Concluídos" value={counts.concluido} icon={<CheckCircle2 className="h-4 w-4" />} tone="success" />
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyBlock
          icon={<Users2 className="h-5 w-5" />}
          title={`Nenhum cadastro em "${TABS.find((t) => t.key === tab)?.label}"`}
          description="Quando alguém preencher o formulário na página 'Conhecer Sistema', ele entra em Pendentes."
        />
      ) : (
        <div className="space-y-4">
          {visible.map((r, i) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Hash className="h-3 w-3" />{i + 1}
                  </span>
                  <p className="text-sm font-semibold">{r.nome}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {" às "}
                    {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="flex items-center gap-2">
                    {r.status === "pendente" && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => move(r.id, "atendendo")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-xs font-medium text-primary hover:bg-primary/15 transition disabled:opacity-50"
                        >
                          <Clock className="h-3.5 w-3.5" /> Atendendo
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => move(r.id, "concluido")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-success/10 px-3 text-xs font-medium text-success hover:bg-success/15 transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                        </button>
                      </>
                    )}
                    {r.status === "atendendo" && (
                      <>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => move(r.id, "concluido")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-success/10 px-3 text-xs font-medium text-success hover:bg-success/15 transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => move(r.id, "pendente")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Voltar
                        </button>
                      </>
                    )}
                    {r.status === "concluido" && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => move(r.id, "atendendo")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-50"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
                <Field label="CPF/CNPJ" value={r.cpf_cnpj} />
                <Field label="E-mail" value={r.email} />
                <Field label="Telefone" value={r.telefone} />
                <Field label="Contato preferido" value={r.contato_preferido} />
                <Field label="Unidades" value={r.unidades} />
                <Field label="Funcionários" value={r.funcionarios} />
                <Field label="Perfil" value={r.perfil === "Outro" && r.perfil_outro ? r.perfil_outro : r.perfil} />
                <Field label="Como conheceu" value={r.origem} />
                <div className="col-span-2 sm:col-span-4">
                  <Field label="O que interessou" value={r.interesse} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
