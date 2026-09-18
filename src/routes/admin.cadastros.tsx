import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Users2, Hash } from "lucide-react";
import { PageHeader, KpiCard, EmptyBlock } from "@/components/admin/admin-shell";
import { listLeads } from "@/lib/leads.functions";

export const Route = createFileRoute("/admin/cadastros")({
  head: () => ({ meta: [{ title: "Área de Cadastros · CondoFlow Admin" }] }),
  component: CadastrosPage,
});

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
  created_at: string;
};

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
  const [rows, setRows] = useState<Lead[] | null>(null);

  const load = useCallback(() => {
    list({}).then((r) => setRows(r as unknown as Lead[])).catch(() => setRows([]));
  }, [list]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="Área de Cadastros"
        description="Todo mundo que preencheu o formulário 'Conhecer Sistema' no site, do primeiro ao último — a ordem de chegada é a prioridade de contato."
      />

      <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 mb-6 max-w-xs">
        <KpiCard label="Total de cadastros" value={rows?.length ?? 0} icon={<Users2 className="h-4 w-4" />} tone="primary" />
      </div>

      {rows === null ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyBlock
          icon={<Users2 className="h-5 w-5" />}
          title="Nenhum cadastro ainda"
          description="Quando alguém preencher o formulário na página 'Conhecer Sistema', vai aparecer aqui, em ordem de chegada."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((r, i) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Hash className="h-3 w-3" />{i + 1}
                  </span>
                  <p className="text-sm font-semibold">{r.nome}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  {" às "}
                  {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
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
