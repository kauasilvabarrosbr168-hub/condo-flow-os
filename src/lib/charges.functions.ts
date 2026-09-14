// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { createBoletoCharge, cancelBoletoCharge } from "@/lib/efi/boleto";
import { createPixCharge } from "@/lib/efi/pix";
import { isEfiConfigured } from "@/lib/efi/config";

const addressSchema = z.object({
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  neighborhood: z.string().trim().min(1),
  zipcode: z.string().trim().min(8),
  city: z.string().trim().min(1),
  state: z.string().trim().length(2),
  complement: z.string().trim().optional(),
});

const createChargeSchema = z.object({
  condoId: z.string().uuid(),
  residentId: z.string().uuid(),
  title: z.string().trim().min(1).max(120).default("Taxa condominial"),
  description: z.string().trim().max(500).optional(),
  amountCents: z.number().int().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(["pix", "boleto"]),
  cpf: z.string().trim().regex(/^\d{11}$/).optional(),
  address: addressSchema.optional(),
});

async function requireCondoAdmin(context: any, condoId: string) {
  const { data: roleRow } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("condo_id", condoId)
    .in("role", ["sindico", "administradora"])
    .maybeSingle();
  if (!roleRow) throw new Error("Sem permissão para gerenciar cobranças deste condomínio.");
}

export const createCondoCharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof createChargeSchema>) => createChargeSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!isEfiConfigured()) {
      throw new Error("Efí não configurado. Defina EFI_CLIENT_ID e EFI_CLIENT_SECRET.");
    }
    await requireCondoAdmin(context, data.condoId);

    const { data: resident, error: residentErr } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, phone, unit_label, cpf")
      .eq("id", data.residentId)
      .eq("condo_id", data.condoId)
      .maybeSingle();
    if (residentErr || !resident) throw new Error("Morador não encontrado neste condomínio.");

    const cpf = data.cpf ?? resident.cpf;
    if (!cpf) throw new Error("CPF do morador é obrigatório para emitir a cobrança.");

    if (data.cpf && data.cpf !== resident.cpf) {
      await context.supabase.from("profiles").update({ cpf: data.cpf }).eq("id", data.residentId);
    }

    const insertBase = {
      condo_id: data.condoId,
      resident_id: data.residentId,
      unit_label: resident.unit_label,
      title: data.title,
      description: data.description ?? null,
      amount_cents: data.amountCents,
      due_date: data.dueDate,
      method: data.method,
      created_by: context.userId,
    };

    if (data.method === "boleto") {
      if (!data.address) throw new Error("Endereço do morador é obrigatório para emitir boleto.");
      const result = await createBoletoCharge({
        itemName: data.title,
        valueCents: data.amountCents,
        expireAt: data.dueDate,
        customer: {
          name: resident.full_name,
          cpf,
          email: resident.email || undefined,
          phoneNumber: resident.phone || undefined,
          address: data.address,
        },
      });
      const { data: row, error } = await context.supabase
        .from("condo_charges")
        .insert({
          ...insertBase,
          status: "pendente",
          efi_charge_id: String(result.chargeId),
          boleto_url: result.link,
          boleto_barcode: result.barcode,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }

    // pix
    const txid = crypto.randomUUID().replace(/-/g, "");
    const expiracaoSeconds = Math.max(
      3600,
      Math.floor((new Date(`${data.dueDate}T23:59:59`).getTime() - Date.now()) / 1000),
    );
    const result = await createPixCharge({
      txid,
      amount: (data.amountCents / 100).toFixed(2),
      expiracaoSeconds,
      devedorNome: resident.full_name,
      devedorCpf: cpf,
      solicitacaoPagador: data.title,
    });
    const { data: row, error } = await context.supabase
      .from("condo_charges")
      .insert({
        ...insertBase,
        status: "pendente",
        efi_txid: result.txid,
        pix_copia_e_cola: result.pixCopiaECola,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const cancelCondoCharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chargeId: string }) => z.object({ chargeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: charge, error } = await context.supabase
      .from("condo_charges")
      .select("id, condo_id, method, efi_charge_id, status")
      .eq("id", data.chargeId)
      .maybeSingle();
    if (error || !charge) throw new Error("Cobrança não encontrada.");
    await requireCondoAdmin(context, charge.condo_id);
    if (charge.status !== "pendente") throw new Error("Só é possível cancelar cobranças pendentes.");

    if (charge.method === "boleto" && charge.efi_charge_id) {
      await cancelBoletoCharge(Number(charge.efi_charge_id));
    }
    // Pix: a cobrança expira sozinha pelo `calendario.expiracao`; cancelamos só localmente.

    const { error: updErr } = await context.supabase
      .from("condo_charges")
      .update({ status: "cancelado" })
      .eq("id", data.chargeId);
    if (updErr) throw new Error(updErr.message);
    return { success: true };
  });
