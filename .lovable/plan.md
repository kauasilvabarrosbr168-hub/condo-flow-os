## Objetivo

Expandir o ecossistema CondoFlow com:
1. Página de edição de condomínio (Super Admin + Síndico) com gestão completa de áreas reserváveis (imagens, descrição, regras).
2. Área de Serviços onde colaboradores marcam tarefas como executadas (visível para Síndico e Super Admin).
3. Novo fluxo de cadastro: usuário escolhe perfil (Morador, Síndico, Colaborador) — Síndico e Colaborador precisam de aprovação.

Sem mexer nas funcionalidades já existentes do app.

---

## 1. Banco de dados (migração única)

**Novos campos em `common_areas`:**
- `rules` (text) — regras de uso
- `cover_url` (text) — capa principal
- `gallery` (text[]) — imagens adicionais

**Novo bucket de Storage:** `condo-areas` (público para leitura). Política: Síndico/Admin do condo pode escrever no caminho `{condo_id}/...`; Super Admin total.

**Nova tabela `service_logs`:** registros de check de colaborador
- `condo_id`, `task_id` (nullable), `worker_id`, `title`, `notes`, `photo_url`, `done_at`
- RLS: colaborador insere o seu, Síndico/Super Admin do condo vê tudo.

**Nova tabela `membership_requests`** (fluxo de aprovação):
- `id`, `user_id`, `condo_id` (nullable se síndico ainda sem condo), `requested_role` (sindico|funcionario|morador), `status` (pending|sindico_approved|approved|rejected), `note`, `decided_by_sindico`, `decided_by_admin`, timestamps.
- RLS: o próprio user vê/cria a sua; síndico do condo vê/aprova as de funcionário do seu condo; Super Admin vê/aprova todas.
- Morador é aprovado direto (status `approved` automático via trigger) — mantém o fluxo atual sem fricção.

**Função `approve_membership_request(id, as_role)`** SECURITY DEFINER que, quando atinge o estado final aprovado, insere em `user_roles` e atualiza `profiles.condo_id`.

---

## 2. Server functions (TanStack)

`src/lib/admin-condo.functions.ts`
- `getCondoDetails({ condoId })` — Super Admin: condo + áreas + membros + tickets count
- `upsertArea({ condoId, area })` — Super Admin OR síndico do condo
- `deleteArea({ areaId })`

`src/lib/membership.functions.ts`
- `requestMembership({ requestedRole, condoId?, note? })` — cria pedido (morador auto-aprova)
- `listPendingRequests()` — síndico vê do seu condo; super admin vê todos
- `decideMembership({ requestId, decision })` — aplica regra de 2 níveis

---

## 3. Rotas novas

- `src/routes/admin.condos.$condoId.tsx` — página de edição (Super Admin) com tabs: **Visão geral / Áreas / Membros / Solicitações / Serviços**
- `src/routes/admin.requests.tsx` — fila global de aprovações do Super Admin
- `src/routes/app.areas-manage.tsx` — Síndico gerencia áreas do seu condo (reaproveita o componente de áreas; já existe `app.areas.tsx`, vou estendê-lo com upload de capa/galeria/regras)
- `src/routes/app.services.tsx` — Colaborador vê tarefas pendentes e dá check com foto/observação; Síndico vê histórico

## 4. Mudanças no Login/Signup

`src/routes/login.tsx`:
- Tela de signup ganha um seletor de perfil: **Morador / Síndico / Colaborador**.
- Morador continua precisando de inviteToken OU é cadastrado direto pelo Síndico (fluxo atual).
- Síndico: além do nome do condomínio, cria um `membership_request` pendente de aprovação do Super Admin (cria o condo mas marca `pending_approval`).
- Colaborador: escolhe o condomínio numa lista pública (nome + cidade), cria `membership_request` que precisa de Síndico **E** Super Admin.
- Após signup, se status ≠ approved, mostra tela "Aguardando aprovação".

`src/routes/app.tsx`: bloqueia acesso ao app principal enquanto o request não estiver `approved` (mantém Morador entrando direto).

## 5. UI/UX

- Página de edição do condomínio (`admin.condos.$condoId`) com header gradient, tabs, cards de área com preview da capa, dialog de upload (drag & drop), upload via `supabase.storage.from('condo-areas').upload(...)`.
- Componente `<AreaForm>` reutilizado em `admin.condos.$condoId` e `app.areas.tsx`.
- Área de serviços com lista de tarefas do dia, botão "Concluir" abrindo dialog com foto opcional e observação → cria `service_logs`.

## 6. Não muda

- Login do Super Admin (`admin@condoflow.com`) continua igual.
- Fluxo Morador via convite continua funcionando.
- Funcionalidades existentes (reservas, comunicação, tasks) intactas.

---

## Detalhes técnicos

**Storage upload:** browser usa `supabase.storage.from('condo-areas').upload('{condoId}/{uuid}.jpg', file)` + `getPublicUrl`. Tamanho máx. 5MB, tipos `image/*`.

**RLS bucket:**
```sql
CREATE POLICY "area images public read" ON storage.objects FOR SELECT USING (bucket_id = 'condo-areas');
CREATE POLICY "admin/sindico upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'condo-areas' AND (
    app_private.is_platform_admin(auth.uid())
    OR app_private.is_condo_admin(auth.uid(), (storage.foldername(name))[1]::uuid)
  )
);
```

**Aprovação em 2 níveis:** `decideMembership` valida quem pode aprovar. Para `funcionario`: precisa síndico → super admin (passa por `sindico_approved` antes de virar `approved`). Para `sindico`: só super admin. Quando vira `approved`, função insere `user_roles` e atualiza `profiles.condo_id`.

**Ordem de execução:** (1) migração DB + storage, (2) server fns, (3) rotas e componentes, (4) ajustes em login.tsx e app.tsx.

Confirma? Posso começar pela migração.