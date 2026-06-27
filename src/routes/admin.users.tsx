import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Users as UsersIcon, Loader2 } from "lucide-react";
import { PageHeader, EmptyBlock } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Usuários · CondoFlow Admin" }] }),
  component: UsersPage,
});

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  unit_label: string | null;
  condo_id: string | null;
  condo_name: string | null;
  roles: string[];
};

function UsersPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: profs }, { data: condos }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, unit_label, condo_id"),
        supabase.from("condominiums").select("id, name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const condoMap = new Map((condos ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
      const rolesMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: { user_id: string; role: string }) => {
        const arr = rolesMap.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesMap.set(r.user_id, arr);
      });
      setRows(
        (profs ?? []).map((p: { id: string; full_name: string | null; email: string | null; unit_label: string | null; condo_id: string | null }) => ({
          ...p,
          condo_name: p.condo_id ? condoMap.get(p.condo_id) ?? null : null,
          roles: rolesMap.get(p.id) ?? [],
        })),
      );
    })();
  }, []);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) => ((r.full_name ?? "") + (r.email ?? "")).toLowerCase().includes(q.toLowerCase())),
    [rows, q],
  );

  return (
    <div>
      <PageHeader
        title="Usuários da plataforma"
        description="Todos os papéis em todos os condomínios."
        actions={
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou email…" className="pl-9" />
          </div>
        }
      />

      {!rows ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <EmptyBlock icon={<UsersIcon className="h-5 w-5" />} title="Nenhum usuário" description="As contas criadas aparecerão aqui." />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Pessoa</th>
                <th className="text-left px-5 py-3 font-medium">Papéis</th>
                <th className="text-left px-5 py-3 font-medium">Condomínio</th>
                <th className="text-left px-5 py-3 font-medium">Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium">{r.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.roles.length ? r.roles.map((rl) => <Badge key={rl} tone="primary">{rl}</Badge>) : <span className="text-muted-foreground text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">{r.condo_name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.unit_label ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
