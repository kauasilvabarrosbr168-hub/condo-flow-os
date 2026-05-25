import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck, Loader2 } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Badge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/invitations")({
  head: () => ({ meta: [{ title: "Convites · CondoFlow Admin" }] }),
  component: InvPage,
});

function InvPage() {
  const [rows, setRows] = useState<{ id: string; email: string; full_name: string; role: string; condo_name: string; accepted_at: string | null; expires_at: string; created_at: string }[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("invitations")
        .select("id, email, full_name, role, accepted_at, expires_at, created_at, condominiums(name)")
        .order("created_at", { ascending: false });
      setRows(
        (data ?? []).map((i: { id: string; email: string; full_name: string; role: string; accepted_at: string | null; expires_at: string; created_at: string; condominiums: { name: string } | null }) => ({
          ...i,
          condo_name: i.condominiums?.name ?? "—",
        })),
      );
    })();
  }, []);

  return (
    <div>
      <PageHeader title="Convites" description="Todos os convites pendentes e aceitos na plataforma." />
      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyBlock icon={<MailCheck className="h-5 w-5" />} title="Nenhum convite" description="Convites enviados pelos síndicos aparecerão aqui." />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Convidado</th>
                <th className="text-left px-5 py-3 font-medium">Workspace</th>
                <th className="text-left px-5 py-3 font-medium">Papel</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Expira</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const expired = new Date(r.expires_at) < new Date();
                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="px-5 py-3">{r.condo_name}</td>
                    <td className="px-5 py-3"><Badge tone="primary">{r.role}</Badge></td>
                    <td className="px-5 py-3">
                      {r.accepted_at ? <Badge tone="success">Aceito</Badge> : expired ? <Badge tone="destructive">Expirado</Badge> : <Badge tone="warning">Pendente</Badge>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(r.expires_at).toLocaleString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
