import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, X, ShieldCheck, UserCog, Building2 } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Badge } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { listPendingRequests, decideMembership } from "@/lib/membership.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({ meta: [{ title: "Solicitações · CondoFlow Admin" }] }),
  component: RequestsPage,
});

type Req = {
  id: string;
  status: "pending" | "sindico_approved" | "approved" | "rejected";
  requested_role: "sindico" | "funcionario" | "morador" | "administradora";
  condo_id: string | null;
  proposed_condo_name: string | null;
  proposed_condo_address: string | null;
  unit_label: string | null;
  note: string | null;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  condominiums: { name: string } | null;
};

function RequestsPage() {
  const list = useServerFn(listPendingRequests);
  const decide = useServerFn(decideMembership);
  const [rows, setRows] = useState<Req[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    list({}).then((r) => setRows(r as unknown as Req[])).catch(() => setRows([]));

  }, [list]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    try {
      await decide({ data: { requestId: id, decision } });
      toast.success(decision === "approve" ? "Aprovado" : "Rejeitado");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Solicitações de acesso"
        description="Aprovações de síndicos e colaboradores. Síndicos passam direto pelo Super Admin. Colaboradores precisam do síndico do condomínio e do Super Admin."
      />

      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyBlock
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Nada pendente"
          description="Novas solicitações de síndicos e colaboradores aparecem aqui."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-elegant transition">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {r.requested_role === "sindico" ? <ShieldCheck className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-semibold">{r.profiles?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.profiles?.email}</p>
                    </div>
                    <Badge tone={r.status === "sindico_approved" ? "warning" : "primary"}>
                      {r.status === "sindico_approved" ? "Aguardando Super Admin" : "Pendente"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                    <p><strong className="text-foreground">Papel solicitado:</strong> {r.requested_role}</p>
                    <p className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {r.condominiums?.name ?? r.proposed_condo_name ?? "—"}
                      {r.proposed_condo_address && ` · ${r.proposed_condo_address}`}
                    </p>
                    {r.unit_label && <p>Unidade: {r.unit_label}</p>}
                    {r.note && <p className="italic">"{r.note}"</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => act(r.id, "reject")} disabled={busyId === r.id}>
                    <X className="h-4 w-4" /> Rejeitar
                  </Button>
                  <Button size="sm" onClick={() => act(r.id, "approve")} disabled={busyId === r.id}>
                    {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Aprovar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
