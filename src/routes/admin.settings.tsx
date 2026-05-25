import { createFileRoute } from "@tanstack/react-router";
import { Settings2, Palette, Bell, Webhook } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Configurações SaaS · CondoFlow Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div>
      <PageHeader title="Configurações SaaS" description="Preferências globais da plataforma CondoFlow." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Identidade da plataforma" description="Nome, logo e branding visíveis aos clientes">
          <div className="space-y-3 text-sm">
            <Row icon={<Palette className="h-4 w-4" />} label="Nome comercial" value="CondoFlow" />
            <Row icon={<Settings2 className="h-4 w-4" />} label="Domínio" value="condoflow.app" />
          </div>
        </SectionCard>
        <SectionCard title="Notificações operacionais" description="Avisos enviados para o operador">
          <div className="space-y-3 text-sm">
            <Row icon={<Bell className="h-4 w-4" />} label="Novo condomínio" value="Email" />
            <Row icon={<Bell className="h-4 w-4" />} label="Falha de pagamento" value="Email + SMS" />
          </div>
        </SectionCard>
        <SectionCard title="Webhooks e integrações" description="Endpoints externos da plataforma">
          <div className="space-y-3 text-sm">
            <Row icon={<Webhook className="h-4 w-4" />} label="Stripe webhook" value="Não configurado" />
            <Row icon={<Webhook className="h-4 w-4" />} label="WhatsApp BSP" value="Não configurado" />
          </div>
        </SectionCard>
        <SectionCard title="Lifecycle de trial" description="Como novos workspaces começam">
          <div className="space-y-3 text-sm">
            <Row icon={<Settings2 className="h-4 w-4" />} label="Duração padrão" value="14 dias" />
            <Row icon={<Settings2 className="h-4 w-4" />} label="Plano inicial" value="Starter" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <span className="inline-flex items-center gap-2 text-muted-foreground">{icon}{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
