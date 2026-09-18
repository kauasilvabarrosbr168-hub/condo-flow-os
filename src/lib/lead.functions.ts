import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { notifyNewLead } from "@/lib/notify.server";

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
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input) => LeadSchema.parse(input))
  .handler(async ({ data }) => {
    await notifyNewLead(data);
    return { ok: true };
  });
