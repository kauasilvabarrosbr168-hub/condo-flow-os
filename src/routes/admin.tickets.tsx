import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LifeBuoy, Loader2 } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Badge } from "@/components/brand";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

export const Route = createFileRoute("/admin/tickets")({
  head: () => ({ meta: [{ title: "Suporte · CondoFlow Admin" }] }),
  component: TicketsPage,
});

type Row = {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  condo_name: string;
};

function TicketsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    const [{ data }, { data: condos }] = await Promise.all([
      supabase.from("support_tickets").select("id, subject, status, priority, created_at, condo_id").order("created_at", { ascending: false }),
      supabase.from("condominiums").select("id, name"),
    ]);
    const cm = new Map((condos ?? []).map((c) => [c.id, c.name]));
    setRows(
      (data ?? []).map((t) => ({
        id: t.id, subject: t.subject, status: t.status, priority: t.priority, created_at: t.created_at,
        condo_name: cm.get(t.condo_id) ?? "—",
      })),
    );
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: TicketStatus) => {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const tone = (p: TicketPriority) => p === "urgent" ? "destructive" : p === "high" ? "warning" : p === "low" ? "default" : "primary";

  return (
    <div>
      <PageHeader title="Tickets de suporte" description="Solicitações abertas pelos clientes da plataforma." />
      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyBlock icon={<LifeBuoy className="h-5 w-5" />} title="Nenhum ticket aberto" description="Quando um cliente abrir suporte, aparecerá aqui." />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Assunto</th>
                <th className="text-left px-5 py-3 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 font-medium">Prioridade</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Aberto</th>
                <th className="text-right px-5 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{r.subject}</td>
                  <td className="px-5 py-3">{r.condo_name}</td>
                  <td className="px-5 py-3"><Badge tone={tone(r.priority)}>{r.priority}</Badge></td>
                  <td className="px-5 py-3">
                    <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value as TicketStatus)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                      <option value="open">Aberto</option>
                      <option value="pending">Pendente</option>
                      <option value="resolved">Resolvido</option>
                      <option value="closed">Fechado</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">Ver detalhes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
