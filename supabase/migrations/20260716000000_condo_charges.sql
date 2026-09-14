-- Cobranças de taxa condominial via PIX/Boleto (Efí Bank)

-- CPF é obrigatório pela Efí para emitir boleto/Pix; a maioria dos moradores
-- ainda não tem esse dado — coletado no primeiro lançamento de cobrança.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;

CREATE TYPE public.charge_method AS ENUM ('pix', 'boleto');
CREATE TYPE public.charge_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');

CREATE TABLE IF NOT EXISTS condo_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  resident_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_label text,
  title text NOT NULL DEFAULT 'Taxa condominial',
  description text,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  due_date date NOT NULL,
  method charge_method NOT NULL,
  status charge_status NOT NULL DEFAULT 'pendente',
  efi_charge_id text,
  efi_txid text,
  pix_qrcode text,
  pix_copia_e_cola text,
  boleto_url text,
  boleto_barcode text,
  paid_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_condo_charges_condo_status ON condo_charges (condo_id, status);
CREATE INDEX IF NOT EXISTS idx_condo_charges_resident ON condo_charges (resident_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_condo_charges_efi_txid ON condo_charges (efi_txid) WHERE efi_txid IS NOT NULL;

DO $$ BEGIN
  CREATE TRIGGER trg_condo_charges_updated BEFORE UPDATE ON condo_charges
    FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE condo_charges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "morador ve as proprias cobrancas" ON condo_charges
    FOR SELECT USING (resident_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "sindico ve cobrancas do condominio" ON condo_charges
    FOR SELECT USING (
      condo_id IN (
        SELECT ur.condo_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('sindico', 'administradora')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "sindico gerencia cobrancas do condominio" ON condo_charges
    FOR ALL USING (
      condo_id IN (
        SELECT ur.condo_id FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('sindico', 'administradora')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE condo_charges;
