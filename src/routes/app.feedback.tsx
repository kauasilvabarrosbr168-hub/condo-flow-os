import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Megaphone, Lightbulb, Heart, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

export const Route = createFileRoute("/app/feedback")({
  head: () => ({ meta: [{ title: "Mural de avisos · CondoFlow" }] }),
  component: FeedbackPage,
});

type Kind = "feedback" | "aviso" | "sugestao" | "elogio";

const KIND_META: Record<Kind, { label: string; icon: typeof MessageSquare; tone: string }> = {
  aviso:    { label: "Aviso",    icon: Megaphone,      tone: "bg-amber-500 text-white border-amber-500" },
  feedback: { label: "Feedback", icon: MessageSquare,  tone: "bg-blue-600 text-white border-blue-600" },
  sugestao: { label: "Sugestão", icon: Lightbulb,      tone: "bg-violet-500 text-white border-violet-500" },
  elogio:   { label: "Elogio",   icon: Heart,          tone: "bg-emerald-500 text-white border-emerald-500" },
};

function FeedbackPage() {
  const { profile, condo, user, isAdmin } = useAuth();
  const condoId = condo?.id ?? profile?.condo_id ?? null;
  const qc = useQueryClient();

  const [content, setContent] = useState("");
  const [kind, setKind] = useState<Kind>("feedback");

  const { data, isLoading } = useQuery({
    enabled: !!condoId,
    queryKey: ["feedback-posts", condoId],
    queryFn: async () => {
      const [posts, profiles] = await Promise.all([
        supabase
          .from("feedback_posts")
          .select("id,kind,content,author_id,created_at")
          .eq("condo_id", condoId!)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("profiles").select("id,full_name,unit_label").eq("condo_id", condoId!),
      ]);
      const map = new Map<string, { full_name: string; unit_label: string | null }>();
      (profiles.data ?? []).forEach((p: any) => map.set(p.id, { full_name: p.full_name, unit_label: p.unit_label }));
      return { posts: posts.data ?? [], authors: map };
    },
    refetchInterval: 20000,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!condoId || !user) throw new Error("Sem condomínio");
      const text = content.trim();
      if (!text) throw new Error("Escreva algo antes de postar.");
      const { error } = await supabase.from("feedback_posts").insert({
        condo_id: condoId,
        author_id: user.id,
        kind,
        content: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      toast.success("Publicado no mural");
      qc.invalidateQueries({ queryKey: ["feedback-posts", condoId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao publicar"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["feedback-posts", condoId] });
    },
  });

  if (!condoId) return null;

  return (
    <div className="px-4 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mural do condomínio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Avisos, feedbacks, sugestões e elogios. Tudo visível para os moradores.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(KIND_META) as Kind[]).map((k) => {
            const M = KIND_META[k];
            const active = kind === k;
            const Icon = M.icon;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active ? M.tone + " ring-2 ring-primary/30" : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {M.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Compartilhe algo com os vizinhos…"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{content.length}/2000</span>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !content.trim()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publicar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (data?.posts ?? []).length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Nada publicado ainda"
          description="Seja o primeiro a deixar um aviso, sugestão ou elogio para a comunidade."
          tone="primary"
        />
      ) : (
        <ul className="space-y-3">
          {(data?.posts ?? []).map((p: any) => {
            const M = KIND_META[p.kind as Kind] ?? KIND_META.feedback;
            const Icon = M.icon;
            const author = data!.authors.get(p.author_id);
            const canDelete = p.author_id === user?.id || isAdmin;
            const initials = (author?.full_name ?? "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <li key={p.id} className="rounded-2xl border border-border bg-card shadow-card p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground text-xs font-semibold shadow-elegant">
                    {initials}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{author?.full_name ?? "Morador"}</p>
                      {author?.unit_label && <span className="text-[11px] text-muted-foreground">· {author.unit_label}</span>}
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${M.tone}`}>
                        <Icon className="h-3 w-3" /> {M.label}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground">{relTime(p.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{p.content}</p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => del.mutate(p.id)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}
