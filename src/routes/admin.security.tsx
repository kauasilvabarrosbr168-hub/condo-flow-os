import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck, KeyRound, Eye, History } from "lucide-react";
import { PageHeader, SectionCard, KpiCard, EmptyBlock } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/security")({
  head: () => ({ meta: [{ title: "Segurança · CondoFlow Admin" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <div>
      <PageHeader title="Segurança da plataforma" description="Postura de segurança do SaaS e controles do operador." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="2FA Super Admin" value="Disponível" icon={<KeyRound className="h-4 w-4" />} tone="primary" hint="Ative no Lovable Cloud" />
        <KpiCard label="RLS multi-tenant" value="Ativo" icon={<ShieldCheck className="h-4 w-4" />} tone="success" hint="Isolamento por condomínio" />
        <KpiCard label="Acessos suspeitos" value={0} icon={<ShieldAlert className="h-4 w-4" />} hint="Últimas 24h" />
        <KpiCard label="Sessões de suporte" value={0} icon={<Eye className="h-4 w-4" />} hint="Impersonações ativas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Histórico de acesso" description="IPs e dispositivos usados nos últimos logins do operador">
          <EmptyBlock icon={<History className="h-5 w-5" />} title="Histórico em construção" description="Os próximos logins do Super Admin serão registrados aqui." />
        </SectionCard>
        <SectionCard title="Políticas ativas" description="Camadas de proteção no backoffice">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-success mt-0.5" /> Isolamento multi-tenant via Row-Level Security em todas as tabelas.</li>
            <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-success mt-0.5" /> Acesso ao backoffice limitado à allow-list em <code className="text-xs">platform_admins</code>.</li>
            <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-success mt-0.5" /> Ações administrativas auditadas em <code className="text-xs">platform_audit_logs</code>.</li>
            <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-success mt-0.5" /> Sessões de impersonação registradas em <code className="text-xs">support_sessions</code> com motivo obrigatório.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
