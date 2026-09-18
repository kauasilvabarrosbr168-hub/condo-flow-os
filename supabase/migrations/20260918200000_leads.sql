-- Leads capturados pelo formulário público da página "Conhecer Sistema".
-- Gravados pelo server function com service role (o visitante nunca escreve
-- direto na tabela); só admins da plataforma podem ler.
--
-- NOTA: aplicado manualmente pelo usuário via SQL Editor do painel do
-- Supabase (não via "supabase db push"), porque o CLI reaplicaria ~25
-- migrações antigas não rastreadas, incluindo uma que apaga todas as
-- reservas — ver memória "project_migracao_destrutiva_supabase".

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf_cnpj TEXT NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  unidades TEXT NOT NULL,
  funcionarios TEXT NOT NULL,
  contato_preferido TEXT NOT NULL,
  perfil TEXT NOT NULL,
  perfil_outro TEXT,
  interesse TEXT NOT NULL,
  origem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at ASC);

DROP POLICY IF EXISTS "Platform admins manage leads" ON public.leads;
CREATE POLICY "Platform admins manage leads"
ON public.leads
FOR ALL
TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));
