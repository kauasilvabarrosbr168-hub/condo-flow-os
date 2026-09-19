import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowRight, ArrowLeft, Brain, Building2, CalendarCheck, Bell, ListChecks,
  ShieldCheck, Lock, KeyRound, DatabaseBackup, CheckCircle2, X, Sparkles, Loader2,
} from "lucide-react";
import { Logo, Badge } from "@/components/brand";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { submitLead } from "@/lib/leads.functions";
import { lookupCnpj } from "@/lib/cnpj.functions";
import { isValidCPF, isValidCNPJ } from "@/lib/validators";
import { toast } from "sonner";

export const Route = createFileRoute("/conhecer-sistema")({
  head: () => ({
    meta: [
      { title: "Conheça o CondoFlow — como o sistema funciona" },
      { name: "description", content: "Veja quais controles o CondoFlow tem, o antes e depois na gestão do seu condomínio, segurança dos dados e tire suas dúvidas." },
    ],
  }),
  component: ConhecerSistema,
});

function ConhecerSistema() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <Logo />
          <Link
            to="/login"
            className="ml-auto h-9 inline-flex items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Login
          </Link>
        </div>
      </header>

      {/* ── Pitch + formulário ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-top opacity-[0.14]"
          style={{
            backgroundImage: "url(/conhecer-hero-bg.png)",
            maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <Badge tone="primary" className="uppercase tracking-wide"><Sparkles className="h-3 w-3" /> Conheça o sistema</Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
              O <span className="bg-gradient-hero bg-clip-text text-transparent">sistema de gestão</span> condominial completo
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Automatize tarefas, reduza o trabalho manual e tenha mais controle sobre a operação do seu condomínio.
              Preencha o formulário e a nossa equipe entra em contato pra te mostrar o CondoFlow funcionando na prática.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: CalendarCheck, text: "Reservas de áreas comuns sem grupo de WhatsApp" },
                { icon: Brain, text: "IA nativa gerando e distribuindo tarefas" },
                { icon: Bell, text: "Notificações no canal que cada pessoa prefere" },
                { icon: ListChecks, text: "Painel único com tudo que precisa de atenção" },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary buzzer-chip">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm leading-relaxed">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <LeadForm />
        </div>
        </div>
      </section>

      {/* ── Quais controles o sistema tem ── */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge tone="primary" className="uppercase tracking-wide">O que o CondoFlow controla</Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">Quais controles o sistema tem</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: CalendarCheck, title: "Reservas de áreas comuns", desc: "Calendário em tempo real, confirmação automática e regras por área." },
              { icon: ListChecks, title: "Chamados de manutenção", desc: "Abertura, acompanhamento e histórico completo por unidade." },
              { icon: Brain, title: "Tarefas geradas por IA", desc: "Descreva o que precisa ser feito e a IA cria, atribui e agenda." },
              { icon: Bell, title: "Notificações multicanal", desc: "WhatsApp, e-mail e push — cada pessoa no canal que prefere." },
              { icon: Building2, title: "Cadastro completo", desc: "Moradores, funcionários e unidades organizados num só lugar." },
              { icon: ShieldCheck, title: "Relatórios automáticos", desc: "Relatório mensal pronto pra apresentar em assembleia." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-card panel-plate p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary buzzer-chip">
                  <f.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-sm">{f.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Antes e depois ── */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge tone="primary" className="uppercase tracking-wide">O antes e depois</Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">Como o CondoFlow simplifica a gestão</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-destructive">Sem CondoFlow</p>
            <ul className="mt-5 space-y-4">
              {[
                "Grupos de WhatsApp com centenas de mensagens por dia",
                "Planilhas desatualizadas, sem dono definido",
                "Tarefas esquecidas até virarem problema",
                "Síndico precisa lembrar de tudo de cabeça",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl pricing-card-frame p-[2px]">
            <div className="rounded-2xl bg-white p-7 h-full">
              <p className="text-xs font-semibold uppercase tracking-widest bg-gradient-hero bg-clip-text text-transparent">Com CondoFlow</p>
              <ul className="mt-5 space-y-4">
                {[
                  "Um canal só, com a IA filtrando o que realmente importa",
                  "Painel sempre atualizado, em tempo real",
                  "IA gera e distribui as tarefas automaticamente",
                  "Síndico só supervisiona o que precisa de atenção",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Segurança ── */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge tone="primary" className="uppercase tracking-wide">Segurança</Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">Que tipo de segurança o sistema tem</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Lock, title: "Criptografia em trânsito", desc: "Toda comunicação entre o app e os servidores passa por HTTPS/TLS." },
              { icon: KeyRound, title: "Acesso por perfil", desc: "Cada pessoa só vê e faz o que o perfil dela permite — síndico, morador ou funcionário." },
              { icon: DatabaseBackup, title: "Backups automáticos", desc: "Os dados do seu condomínio são salvos automaticamente pela infraestrutura." },
              { icon: ShieldCheck, title: "Autenticação segura", desc: "Login com verificação de identidade, sem senha compartilhada entre pessoas." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-card panel-plate p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary buzzer-chip">
                  <f.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-sm">{f.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center mb-10">
          <Badge tone="primary" className="uppercase tracking-wide">Dúvidas frequentes</Badge>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">Perguntas frequentes</h2>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl bg-card panel-plate px-6">
          {[
            { q: "Quanto custa o CondoFlow?", a: "O valor varia pelo tamanho do condomínio e pela quantidade de unidades administradas. Preencha o formulário acima e a equipe monta o plano certo pra você." },
            { q: "Quanto tempo leva pra implantar?", a: "Em média 7 dias. Nosso time cuida da configuração, importa os dados existentes e treina a equipe do condomínio." },
            { q: "Preciso trocar de administradora pra usar o CondoFlow?", a: "Não. O CondoFlow cuida da operação do dia a dia — reservas, manutenção e comunicação — e funciona independente de quem administra o condomínio." },
            { q: "Serve pra administradora que cuida de vários condomínios?", a: "Sim. O CondoFlow atende tanto o síndico de um condomínio único quanto a administradora profissional, com um painel consolidado pra cada portfólio." },
            { q: "Meus moradores vão precisar aprender algo complicado?", a: "Não. O app foi feito pra ser simples, e boa parte da comunicação pode acontecer pelo WhatsApp, que os moradores já usam no dia a dia." },
            { q: "Meus dados ficam seguros?", a: "Sim — a comunicação é criptografada, o acesso é controlado por perfil e os dados são salvos com backup automático. Veja a seção de segurança acima." },
            { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade." },
          ].map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-sm font-semibold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo />
          <p>© 2026 CondoFlow · Operação inteligente para condomínios</p>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════ LEAD FORM (3 etapas) ════════════════════════ */
type LeadData = {
  cpfCnpj: string;
  nome: string;
  email: string;
  telefone: string;
  unidades: string;
  funcionarios: string;
  contatoPreferido: string;
  perfil: string;
  perfilOutro: string;
  interesse: string;
  origem: string;
};

const emptyLead: LeadData = {
  cpfCnpj: "", nome: "", email: "", telefone: "",
  unidades: "", funcionarios: "", contatoPreferido: "",
  perfil: "", perfilOutro: "", interesse: "", origem: "",
};

type DocCheck =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "valid-cpf" }
  | { status: "valid-cnpj"; nome: string }
  | { status: "valid-cnpj-unconfirmed" }
  | { status: "invalid" };

function LeadForm() {
  const submitLeadFn = useServerFn(submitLead);
  const lookupCnpjFn = useServerFn(lookupCnpj);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<LeadData>(emptyLead);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [docCheck, setDocCheck] = useState<DocCheck>({ status: "idle" });

  const set = <K extends keyof LeadData>(key: K, value: LeadData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    const digits = data.cpfCnpj.replace(/\D/g, "");

    if (digits.length === 11) {
      setDocCheck(isValidCPF(digits) ? { status: "valid-cpf" } : { status: "invalid" });
      return;
    }

    if (digits.length === 14) {
      if (!isValidCNPJ(digits)) {
        setDocCheck({ status: "invalid" });
        return;
      }
      setDocCheck({ status: "checking" });
      let cancelled = false;
      const t = setTimeout(async () => {
        try {
          const r = await lookupCnpjFn({ data: { cnpj: digits } });
          if (!cancelled) setDocCheck({ status: "valid-cnpj", nome: r.razaoSocial });
        } catch {
          if (!cancelled) setDocCheck({ status: "valid-cnpj-unconfirmed" });
        }
      }, 500);
      return () => { cancelled = true; clearTimeout(t); };
    }

    setDocCheck({ status: "idle" });
  }, [data.cpfCnpj, lookupCnpjFn]);

  const step1Valid =
    docCheck.status === "valid-cpf" ||
    docCheck.status === "valid-cnpj" ||
    docCheck.status === "valid-cnpj-unconfirmed";
  const step2Valid =
    data.nome.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(data.email) &&
    data.telefone.trim().length >= 3 &&
    data.unidades !== "" &&
    data.funcionarios !== "" &&
    data.contatoPreferido !== "";
  const step3Valid =
    data.perfil !== "" &&
    (data.perfil !== "Outro" || data.perfilOutro.trim().length > 0) &&
    data.interesse.trim().length > 0 &&
    data.origem !== "";

  const handleSubmit = async () => {
    setSending(true);
    try {
      await submitLeadFn({ data });
      setDone(true);
    } catch {
      toast.error("Não conseguimos enviar agora. Tente novamente em um instante.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl pricing-card-frame p-[2px]">
        <div className="rounded-2xl bg-white p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">Recebemos seus dados!</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Nossa equipe vai entrar em contato pelo canal que você preferiu, pra te mostrar o CondoFlow funcionando.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl pricing-card-frame p-[2px]">
      <div className="rounded-2xl bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Agende uma demonstração</p>
          <span className="text-xs text-muted-foreground">Etapa {step} de 3</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-gradient-hero" : "bg-muted"}`} />
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {step === 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
              <Input id="cpfCnpj" value={data.cpfCnpj} onChange={(e) => set("cpfCnpj", e.target.value)} placeholder="000.000.000-00" />
              {docCheck.status === "checking" && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Consultando CNPJ...</p>
              )}
              {docCheck.status === "valid-cpf" && (
                <p className="flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="h-3 w-3" /> CPF válido</p>
              )}
              {docCheck.status === "valid-cnpj" && (
                <p className="flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="h-3 w-3" /> {docCheck.nome}</p>
              )}
              {docCheck.status === "valid-cnpj-unconfirmed" && (
                <p className="flex items-center gap-1.5 text-xs text-warning"><CheckCircle2 className="h-3 w-3" /> CNPJ válido (não foi possível confirmar o nome agora)</p>
              )}
              {docCheck.status === "invalid" && (
                <p className="flex items-center gap-1.5 text-xs text-destructive"><X className="h-3 w-3" /> CPF/CNPJ inválido</p>
              )}
            </div>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={data.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="voce@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone ou WhatsApp</Label>
                <Input id="telefone" value={data.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Quantas unidades?</Label>
                  <Select value={data.unidades} onValueChange={(v) => set("unidades", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Até 20">Até 20</SelectItem>
                      <SelectItem value="21 a 60">21 a 60</SelectItem>
                      <SelectItem value="61 a 100">61 a 100</SelectItem>
                      <SelectItem value="Mais de 100">Mais de 100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Funcionários?</Label>
                  <Select value={data.funcionarios} onValueChange={(v) => set("funcionarios", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 a 2">0 a 2</SelectItem>
                      <SelectItem value="3 a 5">3 a 5</SelectItem>
                      <SelectItem value="6 a 10">6 a 10</SelectItem>
                      <SelectItem value="Mais de 10">Mais de 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Como você prefere contato?</Label>
                <Select value={data.contatoPreferido} onValueChange={(v) => set("contatoPreferido", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label>Qual é o seu perfil no condomínio?</Label>
                <Select value={data.perfil} onValueChange={(v) => set("perfil", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Síndico contratado">Síndico contratado</SelectItem>
                    <SelectItem value="Síndico que é morador">Síndico que é morador</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.perfil === "Outro" && (
                <div className="space-y-1.5">
                  <Label htmlFor="perfilOutro">Qual?</Label>
                  <Input id="perfilOutro" value={data.perfilOutro} onChange={(e) => set("perfilOutro", e.target.value)} placeholder="Descreva seu perfil" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="interesse">O que te interessou no CondoFlow?</Label>
                <textarea
                  id="interesse"
                  value={data.interesse}
                  onChange={(e) => set("interesse", e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Conte rapidamente"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Por onde você conheceu o CondoFlow?</Label>
                <Select value={data.origem} onValueChange={(v) => set("origem", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Anúncio">Anúncio</SelectItem>
                    <SelectItem value="Indicações">Indicações</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          ) : <span />}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 ? !step1Valid : !step2Valid}
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              className="group inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-hero px-5 text-sm font-medium text-primary-foreground btn-plate hover:opacity-95 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              Próximo <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!step3Valid || sending}
              onClick={handleSubmit}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-hero px-5 text-sm font-medium text-primary-foreground btn-plate hover:opacity-95 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {sending ? "Enviando..." : "Enviar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
