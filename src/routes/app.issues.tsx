import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/brand";
import { ChevronUp, MessageSquare, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/app/issues")({
  head: () => ({ meta: [{ title: "Problemas e sugestões — CondoFlow" }] }),
  component: Issues,
});

const cats = ["Todos", "Manutenção", "Limpeza", "Segurança", "Barulho", "Piscina", "Elevador", "Iluminação"];

const items = [
  { title: "Substituir lâmpadas da garagem G2", cat: "Iluminação", votes: 41, comments: 7, status: "Em execução", tone: "primary" as const, prio: "Alta", who: "João P." },
  { title: "Adicionar nova rede na quadra de tênis", cat: "Manutenção", votes: 38, comments: 12, status: "Em análise", tone: "default" as const, prio: "Média", who: "—" },
  { title: "Filtro da piscina com ruído alto", cat: "Piscina", votes: 27, comments: 4, status: "Aberto", tone: "warning" as const, prio: "Alta", who: "Atlas Tec." },
  { title: "Câmera do hall trocando de ângulo", cat: "Segurança", votes: 19, comments: 3, status: "Resolvido", tone: "success" as const, prio: "Média", who: "Vigia Segura" },
  { title: "Limpeza do depósito de bicicletas", cat: "Limpeza", votes: 14, comments: 2, status: "Aberto", tone: "warning" as const, prio: "Baixa", who: "Maria L." },
];

function Issues() {
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Problemas e sugestões</h1>
          <p className="mt-1 text-sm text-muted-foreground">Moradores reportam, votam e acompanham — com clareza profissional.</p>
        </div>
        <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-hero text-sm font-medium text-primary-foreground shadow-elegant"><Plus className="h-4 w-4" /> Nova solicitação</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 h-10 text-sm text-muted-foreground w-72">
          <Search className="h-4 w-4" /> Buscar…
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c, i) => (
            <button key={c} className={`px-3 h-9 rounded-lg text-sm font-medium ${i === 0 ? "bg-foreground text-background" : "bg-card border border-border hover:bg-muted"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-3">Solicitação</th>
              <th className="text-left font-medium px-3 py-3">Categoria</th>
              <th className="text-left font-medium px-3 py-3">Responsável</th>
              <th className="text-left font-medium px-3 py-3">Prioridade</th>
              <th className="text-left font-medium px-3 py-3">Status</th>
              <th className="text-left font-medium px-3 py-3">Votos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((it) => (
              <tr key={it.title} className="hover:bg-muted/30 transition">
                <td className="px-5 py-4">
                  <p className="font-medium">{it.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <MessageSquare className="h-3 w-3" /> {it.comments} comentários · prazo estimado 5d
                  </p>
                </td>
                <td className="px-3 py-4 text-muted-foreground">{it.cat}</td>
                <td className="px-3 py-4">{it.who}</td>
                <td className="px-3 py-4">
                  <Badge tone={it.prio === "Alta" ? "destructive" : it.prio === "Média" ? "warning" : "default"}>{it.prio}</Badge>
                </td>
                <td className="px-3 py-4">
                  <Badge tone={it.tone}>{it.status}</Badge>
                </td>
                <td className="px-3 py-4">
                  <button className="inline-flex flex-col items-center gap-0.5 rounded-lg border border-border px-2.5 py-1.5 hover:border-primary hover:text-primary transition">
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-xs font-semibold">{it.votes}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
