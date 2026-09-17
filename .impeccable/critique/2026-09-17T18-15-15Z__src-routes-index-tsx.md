---
target: landing page (src/routes/index.tsx)
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\User\\Downloads\\CONDOMIC\\condo-flow-os\\src\\routes\\index.tsx"
target_fingerprint: "sha256:707b76447efa14387afddc04a50030ce50f583485353a51ed573a4623914f239"
target_path: "C:\\Users\\User\\Downloads\\CONDOMIC\\condo-flow-os\\src\\routes\\index.tsx"
timestamp: 2026-09-17T18-15-15Z
slug: src-routes-index-tsx
---
Method: dual-agent (A: a71ab2163098456ba · B: a58e0a885417e996f)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Nenhum elemento interativo (nav, "Começar grátis", "Começar agora", "Ver o vídeo", "Falar com a equipe") tem `focus-visible`; o nav sticky nunca marca qual seção está ativa. |
| 2 | Match System / Real World | 4 | Português fluente e idiomático, vocabulário de domínio correto (síndico/zelador/morador/porteiro). |
| 3 | User Control and Freedom | 3 | Nada aprisiona o usuário, mas nenhuma seção-alvo dos anchors tem `scroll-mt-*`, então o header sticky (`h-16`) pode cobrir o topo da seção ao pular via nav. |
| 4 | Consistency and Standards | 2 | `Badge` (brand.tsx) usa cores hardcoded (`bg-blue-600`/`bg-emerald-500`/etc.) em vez dos tokens do DESIGN.md — todo badge da página (7+ usos) está fora do sistema. O CTA principal também tem 3 tratamentos visuais/textuais diferentes. |
| 5 | Error Prevention | 2 | `<video>` sem `poster` e sem fallback visível se o arquivo falhar ao carregar. |
| 6 | Recognition Rather Than Recall | 3 | Ícone+texto consistente em toda a página; só falta estado ativo nos links do nav. |
| 7 | Flexibility and Efficiency | n/a | Página de conversão de primeira visita, sem fluxo de uso repetido a acelerar. |
| 8 | Aesthetic and Minimalist Design | 2 | 9 cards de feature + 6 depoimentos + 4 passos com sub-bullets — volume alto sem "pular adiante", indo contra a promessa de "calma" do próprio DESIGN.md. |
| 9 | Error Recovery | 2 | Mesmo problema do vídeo: `.catch(() => {})` silencioso sem nenhum aviso ao usuário se o autoplay for bloqueado. |
| 10 | Help and Documentation | n/a | Fora de escopo — landing page não precisa de documentação contextual. |
| **Total** | | **20/32 (62,5%)** | **Faixa "Aceitável"** — precisa de melhorias significativas antes de converter de forma confiável; não está quebrada, mas está longe de polida. |

## Design Specificity Verdict

**Avaliação (LLM):** A página **não** é um template genérico na camada de texto, mas **é** bastante genérica na camada estrutural/composicional.

A favor da especificidade: o texto está saturado de detalhe real de operação condominial — "Verificar bomba da piscina — Pedro · 15/nov", "Repor cloro e pH — João · semanal", "Sauna 18h ligada por João", "Elevador social travou" — vocabulário correto (síndico, subsíndico, zelador, porteiro, morador), e os nomes dos prédios nos depoimentos ("Ed. Aurora", "Vista Park") batem exatamente com os nomes na faixa de logos — um detalhe de continuidade que um template genérico não teria.

Contra: a ordem das seções — hero / stats / mockup / logos / vídeo / problema / grade de 9 features / IA com demo de "digitação" / como funciona em 4 passos / 6 depoimentos / CTA gradiente / rodapé fino — é exatamente o formato-padrão de centenas de landing pages de SaaS de IA em 2024-2026. O `TypingDemo` (efeito de terminal digitando) é um clichê visual de "SaaS de IA" que aparece em produtos completamente não relacionados — só o conteúdo da string é do CondoFlow. O fundo `grid-bg` com máscara radial no hero e o brilho por trás do mockup também são movimentos padrão de hero moderno.

**Veredito:** nota alta pra autoria no texto, nota baixa pra autoria na composição/interação. Se tirasse o português condominial, o esqueleto seria indistinguível de qualquer SaaS de gestão de projetos ou field-service.

**Varredura determinística (detector):** rodou com sucesso (exit 0), 1 achado — `text-[10px]` fixo na linha 809 (rótulos de dia da semana no widget do mockup), fora da escala de tipografia documentada no DESIGN.md. Esse item é **pré-existente** (já detectado em passes anteriores desta sessão, fora do escopo desta análise de conteúdo/UX) — não é uma questão de hierarquia/clareza nova, então não entra como Priority Issue, só como observação menor abaixo.

**Evidência visual (overlay no navegador):** não disponível nesta sessão — não há ferramenta de automação de navegador nem servidor local acessível. Nenhuma captura, screenshot ou overlay de console foi gerada; essa é a instância documentada de fallback da própria skill (não uma lacuna silenciosa). Toda a análise acima é uma leitura do código/JSX, não da página renderizada.

## Overall Impression

A página é bem escrita e usa a linguagem do produto com precisão — mas o maior problema não é estético, é estrutural: o link "Preços" no menu não leva a nenhum preço, e a seção que dramatiza a dor do usuário (`ProblemSection`) vem *depois* das provas de que o problema já foi resolvido (stats + vídeo), o que esvazia a tensão que ela deveria criar. A maior oportunidade aqui não é redesenhar nada visualmente — é reordenar/corrigir a lógica persuasiva e destravar acessibilidade básica de foco.

## What's Working

1. **A inversão tonal do `ProblemSection`** (`bg-foreground text-background`) é a única seção que rompe a paleta calma clara — e faz isso reaproveitando o mesmo vocabulário visual (mesmo formato de ícone, mesma disciplina de bordas sem sombra), só invertido. Mudança de humor sem quebrar o sistema.
2. **A especificidade do texto é real, não decorativa** — descrições de feature e depoimentos citam fatos de operação condominial verificáveis (bomba da piscina, cloro e pH, elevador social travado), não enchimento genérico de SaaS.
3. **Uma única linguagem de movimento em 7 seções animadas** — `useInView` + `translateY`/`opacity` com atraso escalonado (`i * Nms`) é reusado literalmente em todas as seções que animam. Disciplina real de "uma gramática de animação", não um efeito de scroll diferente por seção.

## Priority Issues

**[P0] O link "Preços" do menu não leva a nenhum preço.**
- **Por quê importa:** quem clica em "Preços" especificamente pra avaliar custo — no momento de maior intenção de compra — encontra zero número, plano ou faixa de valor. É o tipo de gap que gera abandono imediato, não só uma dúvida de suporte.
- **Correção:** ou adicione uma faixa de preço real na `CTASection` (mesmo que "a partir de R$X/apto/mês"), ou troque o rótulo do menu pra algo honesto ("Comece agora") e retire a promessa de preço.
- **Comando sugerido:** `$impeccable clarify`

**[P1] Nenhum elemento interativo tem estado de foco visível.**
- **Por quê importa:** nav, "Começar grátis", "Começar agora" (2x), "Ver o vídeo" e "Falar com a equipe" — nenhum tem `focus-visible:ring-*`. Quem navega por teclado não vê onde está o foco, inclusive nos dois CTAs principais de conversão.
- **Correção:** adicionar `focus-visible:ring-2 focus-visible:ring-ring/40` (o mesmo token que o DESIGN.md já documenta pra inputs) em todo elemento interativo do arquivo.
- **Comando sugerido:** `$impeccable harden`

**[P1] O componente `Badge` está fora do sistema de design.**
- **Por quê importa:** `src/components/brand.tsx` usa cores fixas (`bg-blue-600`, `bg-emerald-500`, `bg-amber-500`, `bg-red-600`, `bg-slate-500`) em vez dos tokens OKLCH do DESIGN.md (`signal-indigo`, `confirmed-green`, etc.) usados no resto da página via `text-primary`/`bg-success`. Todo badge da landing page (7+ usos) está mostrando uma cor levemente diferente do resto do produto — um desvio invisível que só cresce conforme mais telas reusam `Badge`.
- **Correção:** apontar o mapa de tons do `Badge` pras mesmas variáveis/classes Tailwind (`bg-primary text-primary-foreground`, `bg-success`, etc.) já usadas no resto de `index.tsx`.
- **Comando sugerido:** `$impeccable harden`

**[P2] O CTA principal tem 3 tratamentos visuais e de texto diferentes.**
- **Por quê importa:** nav = pílula escura sólida "Começar grátis"; hero = pílula em gradiente "Começar agora" com `shadow-elegant`; CTA final = botão branco "Começar agora" com `shadow-card`. A própria "Regra do Sinal Único" do DESIGN.md descreve um tratamento único pro acento principal; três variantes visuais/textuais da mesma ação enfraquecem o reconhecimento ("isso é o mesmo botão de antes?") e diluem o significado da cor de acento.
- **Correção:** escolher um rótulo e manter o tratamento gradiente + `shadow-elegant` consistente em toda repetição do CTA principal; reservar a variante branca/card estritamente pra ações secundárias.
- **Comando sugerido:** `$impeccable polish`

**[P2] O header sticky cobre o topo das seções ao navegar pelos anchors.**
- **Por quê importa:** nenhuma seção-alvo (`#video`, `#features`, `#ia`, `#how-it-works`, `#pricing`) tem `scroll-mt-*`, então pular via nav pode deixar o título da seção parcialmente escondido atrás do header sticky translúcido (`h-16`) — o tipo de atrito pequeno que corrói a confiança numa página aparentemente polida.
- **Correção:** adicionar `scroll-mt-20` (ou equivalente à altura do header) em cada seção-alvo.
- **Comando sugerido:** `$impeccable harden`

## Persona Red Flags

**Jordan (Primeira vez, não-técnico — perfil que o próprio DESIGN.md descreve como o síndico típico)**
- As primeiras palavras do badge do hero são "IA Nativa · Automação ponta a ponta" — pra um público que o próprio DESIGN.md chama de "geralmente não-técnico", abrir com jargão de "IA" antes de qualquer acolhimento é arriscado nos primeiros 5 segundos.
- "Preços" no menu levando a zero preço (P0) é ainda peor pra esse perfil — quem está na primeira visita é o mais ansioso com custo escondido, e a página nunca mostra um número em lugar nenhum.
- A barra de "navegador" falsa do mockup mostra a URL `condo-flow-os.lovable.app/dashboard` — um domínio de ferramenta de prototipagem visível pra quem está examinando cada detalhe é um pequeno dano de credibilidade ("isso é um produto real ou um protótipo?").

**Riley (Testador metódico, procura o que quebra)**
- O `<video>` não tem `poster` nem estado de erro/fallback — o primeiro movimento do Riley (testar o que acontece se o recurso falhar) encontra uma caixa preta em branco sem explicação nenhuma.
- `videoRef.current.play().catch(() => {})` engole silenciosamente qualquer bloqueio de autoplay do navegador — sem nenhuma mensagem visível de que algo deveria ter acontecido.
- O menu prometer "Preços" e entregar zero preço (P0) é exatamente o tipo de "a interface promete X e entrega Y" que esse perfil é feito pra caçar, checando metodicamente cada destino do nav contra seu conteúdo real.

**Casey (Usuária no celular, distraída, uma mão só)**
- `hidden lg:flex` no nav faz os 5 links de seção desaparecerem completamente abaixo de 1024px, sem nenhum menu hambúrguer substituto — no celular, não há como pular direto pra uma seção (nem pra "preços", que de qualquer forma não existe).
- O único CTA sempre visível está no header sticky — topo da tela, fora da zona do polegar — e não existe um CTA fixo na parte de baixo pra uma página desse tamanho.
- O vídeo autoplay (mudo) ao entrar na viewport, somado a vários brilhos `blur-3xl` e observers de animação por seção, é bastante peso simultâneo de asset/animação pra uma sessão em 3G ou interrompida, justo quando essa usuária está tentando avaliar o produto rápido.

## Minor Observations

- Rodapé é só Logo + uma linha de copyright — sem links de privacidade/termos/contato/LGPD, uma lacuna notável pra um produto que lida com dados pessoais de moradores.
- O contador de "manutenções atrasadas" anima de 0 até a meta de... 0 ("zero manutenções atrasadas") — animar até zero é uma animação que não faz nada visualmente, ainda que o rótulo comunique bem o ponto por si só.
- O `TypingDemo` mostra sempre a mesma lista fixa de 5 tarefas — ok na primeira visita, mas mina a promessa de "gerado por IA, personalizado" se um usuário atento recarregar a página e ver a saída idêntica.
- O botão secundário "Ver o vídeo" também herda o mesmo problema de sobreposição do header sticky (P2 acima).
- Os alvos de toque dos CTAs (h-11/h-12, ou seja, 44-48px) atingem o mínimo de 44×44pt — vale registrar como acerto, não só apontar falhas.
- (Detector) `text-[10px]` na linha 809 — item pré-existente, fora do escopo desta análise de conteúdo/UX, já mapeado em passes técnicos anteriores.

## Questions to Consider

1. "Preços" no menu hoje leva a zero informação de preço — a intenção é qualificar leads via conversa de vendas, ou deixar o usuário self-service ver um número antes de clicar? Hoje a página não se compromete com nenhuma das duas, e isso acontece no pior ponto possível do arco emocional pra ser ambíguo.
2. Já que o próprio DESIGN.md descreve o público como síndicos "geralmente não-técnicos", abrir com uma demo estilo terminal/digitação de IA passa como prova de competência, ou como iconografia de "hacker" desconhecida justo pro público mais propenso a se sentir intimidado por "IA"?
3. Se a forma emocional pretendida é Promessa → Dor → Alívio, o que acontece com o ritmo persuasivo da página se o `ProblemSection` for movido pra logo depois do hero — antes do `StatsRow` e do `VideoSection` já mostrarem a dor resolvida? Dramatizar uma dor que o leitor já sabe que foi resolvida ainda funciona como dramatização?
