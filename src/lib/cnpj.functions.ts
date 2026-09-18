import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CnpjLookupSchema = z.object({
  cnpj: z.string().trim().min(11).max(18),
});

// Público — consulta o nome da empresa na base pública da Receita Federal
// (via BrasilAPI), usado no formulário de lead pra confirmar o CNPJ digitado.
export const lookupCnpj = createServerFn({ method: "POST" })
  .inputValidator((input) => CnpjLookupSchema.parse(input))
  .handler(async ({ data }) => {
    const digits = data.cnpj.replace(/\D/g, "");
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (!res.ok) throw new Error("CNPJ não encontrado na base da Receita Federal");
    const json = (await res.json()) as { razao_social?: string; nome_fantasia?: string | null };
    if (!json.razao_social) throw new Error("CNPJ não encontrado na base da Receita Federal");
    return { razaoSocial: json.razao_social, nomeFantasia: json.nome_fantasia ?? null };
  });
