import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import { Bell, CalendarCheck, MessageSquareWarning, Wallet, Lightbulb, AlertCircle, ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/app/resident")({
  head: () => ({ meta: [{ title: "App do morador — CondoFlow" }] }),
  component: Resident,
});

function Resident() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">App do morador</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pré-visualização da experiência mobile entregue ao morador.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Phone mock */}
        <div className="mx-auto">
          <div className="relative w-[320px] h-[660px] rounded-[44px] bg-foreground p-3 shadow-elegant">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-6 w-32 rounded-b-2xl bg-foreground z-10" />
            <div className="h-full w-full rounded-[34px] bg-background overflow-hidden flex flex-col">
              {/* status bar */}
              <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[10px] font-medium">
                <span>9:41</span>
                <span>•••</span>
              </div>
              <div className="px-5 pt-2">
                <p className="text-xs text-muted-foreground">Bem-vinda</p>
                <h2 className="text-xl font-semibold">Júlia · Apto 1102</h2>
              </div>

              <div className="px-5 mt-4">
                <button className="w-full inline-flex items-center justify-between rounded-2xl bg-gradient-hero text-primary-foreground px-4 py-3 shadow-elegant">
                  <span className="flex items-center gap-2 text-sm font-medium"><AlertCircle className="h-4 w-4" /> Reportar problema</span>
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 mt-5 grid grid-cols-4 gap-3">
                {[
                  { i: CalendarCheck, l: "Reservas" },
                  { i: MessageSquareWarning, l: "Avisos" },
                  { i: Wallet, l: "Boletos" },
                  { i: Lightbulb, l: "Ideias" },
                ].map((m) => (
                  <button key={m.l} className="flex flex-col items-center gap-1.5">
                    <span className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center"><m.i className="h-5 w-5 text-primary" /></span>
                    <span className="text-[10px]">{m.l}</span>
                  </button>
                ))}
              </div>

              <div className="px-5 mt-5 flex-1 overflow-y-auto space-y-3 pb-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Próximas reservas</p>
                <div className="rounded-2xl border border-border p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Sauna · 18h–19h</p>
                    <Badge tone="warning">Hoje</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Aguardando ligação pelo funcionário</p>
                </div>
                <div className="rounded-2xl border border-border p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Salão · 20h–23h</p>
                    <Badge tone="success">Confirmada</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Sábado · limpeza incluída</p>
                </div>

                <p className="text-[11px] uppercase tracking-wider text-muted-foreground pt-2">Comunicados</p>
                <div className="rounded-2xl border border-border p-3.5">
                  <p className="text-sm font-medium">Manutenção do elevador social</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Hoje, das 14h às 17h. Use o elevador de serviço.</p>
                </div>
              </div>

              <div className="border-t border-border px-6 py-3 flex justify-around text-muted-foreground">
                {[Bell, CalendarCheck, MessageSquareWarning, Wallet].map((I, i) => (
                  <I key={i} className={`h-5 w-5 ${i === 1 ? "text-primary" : ""}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side panels */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold">Solicitações ativas do morador</h3>
            <ul className="mt-4 divide-y divide-border">
              {[
                { t: "Reserva sauna 18h", s: "Funcionário vai ligar 15 min antes", b: "warning" as const },
                { t: "Boleto de maio", s: "Vencimento dia 15 · R$ 712,40", b: "primary" as const },
                { t: "Sugestão: nova rede na quadra", s: "23 votos · em análise", b: "default" as const },
                { t: "Reclamação: barulho 4º andar", s: "Resolvido pelo síndico", b: "success" as const },
              ].map((r) => (
                <li key={r.t} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-medium">{r.t}</p>
                    <p className="text-xs text-muted-foreground">{r.s}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={r.b}>status</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold">Atalhos rápidos</h3>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              {[
                { i: AlertCircle, t: "Reportar problema", d: "Manutenção, barulho, segurança" },
                { i: CalendarCheck, t: "Reservar área", d: "Salão, sauna, churrasqueira" },
                { i: Lightbulb, t: "Sugerir melhoria", d: "Vote nas ideias do prédio" },
              ].map((a) => (
                <button key={a.t} className="rounded-xl border border-border p-4 text-left hover:bg-muted transition">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><a.i className="h-4 w-4" /></span>
                  <p className="mt-3 text-sm font-medium">{a.t}</p>
                  <p className="text-xs text-muted-foreground">{a.d}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
