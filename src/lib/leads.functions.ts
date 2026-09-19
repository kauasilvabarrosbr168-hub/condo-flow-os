// @ts-nocheck
// A tabela "leads" existe no banco mas ainda não foi tipada no schema gerado do
// Supabase — o @ts-nocheck evita erros de tipo até o schema ser regenerado.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyNewLead } from "@/lib/notify.server";
import { notifyLeadSheet } from "@/lib/sheets.server";

async function assertPlatformAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("platform_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

const LeadSchema = z.object({
  cpfCnpj: z.string().trim().min(3).max(32),
  nome: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  telefone: z.string().trim().min(3).max(32),
  unidades: z.string().trim().min(1).max(40),
  funcionarios: z.string().trim().min(1).max(40),
  contatoPreferido: z.string().trim().min(1).max(40),
  perfil: z.string().trim().min(1).max(60),
  perfilOutro: z.string().trim().max(120).optional(),
  interesse: z.string().trim().min(1).max(500),
  origem: z.string().trim().min(1).max(40),
});

// Público — formulário de lead da página "Conhecer Sistema", sem autenticação.
// Três canais independentes; um falhar não trava os outros nem a resposta
// pro visitante.
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input) => LeadSchema.parse(input))
  .handler(async ({ data }) => {
    await Promise.allSettled([
      notifyLeadSheet(data),
      notifyNewLead(data),
      supabaseAdmin
        .from("leads")
        .insert({
          cpf_cnpj: data.cpfCnpj,
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          unidades: data.unidades,
          funcionarios: data.funcionarios,
          contato_preferido: data.contatoPreferido,
          perfil: data.perfil,
          perfil_outro: data.perfilOutro ?? null,
          interesse: data.interesse,
          origem: data.origem,
        })
        .then(({ error }) => {
          if (error) console.error("[leads] Falha ao gravar no banco:", error.message);
        }),
    ]);
    return { ok: true };
  });

// Admin — lista os cadastros do primeiro ao último, pra quem tem acesso à plataforma.
export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("id, cpf_cnpj, nome, email, telefone, unidades, funcionarios, contato_preferido, perfil, perfil_outro, interesse, origem, status, created_at")
      .order("created_at", { ascending: true })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pendente", "atendendo", "concluido"]),
});

// Admin — move um cadastro entre Pendentes / Atendendo / Concluídos.
export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.userId);
    const { error } = await supabaseAdmin.from("leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
