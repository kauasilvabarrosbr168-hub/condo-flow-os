import { describe, it, expect } from "vitest";
import { LeadSchema } from "./leads.functions";

const validLead = {
  cpfCnpj: "111.444.777-35",
  nome: "Fulano de Tal",
  email: "fulano@example.com",
  telefone: "(11) 90000-0000",
  unidades: "21 a 60",
  funcionarios: "3 a 5",
  contatoPreferido: "WhatsApp",
  perfil: "Síndico contratado",
  interesse: "Reduzir o trabalho manual",
  origem: "Google",
};

describe("LeadSchema", () => {
  it("aceita um lead completo e válido", () => {
    expect(() => LeadSchema.parse(validLead)).not.toThrow();
  });

  it("aceita com perfilOutro preenchido (campo opcional)", () => {
    expect(() => LeadSchema.parse({ ...validLead, perfil: "Outro", perfilOutro: "Zelador" })).not.toThrow();
  });

  it("rejeita e-mail inválido", () => {
    expect(() => LeadSchema.parse({ ...validLead, email: "não-é-email" })).toThrow();
  });

  it("rejeita nome vazio", () => {
    expect(() => LeadSchema.parse({ ...validLead, nome: "" })).toThrow();
  });

  it("rejeita interesse vazio", () => {
    expect(() => LeadSchema.parse({ ...validLead, interesse: "" })).toThrow();
  });

  it("rejeita campos obrigatórios ausentes", () => {
    const { origem, ...semOrigem } = validLead;
    expect(() => LeadSchema.parse(semOrigem)).toThrow();
  });

  it("rejeita interesse acima do limite de 500 caracteres", () => {
    expect(() => LeadSchema.parse({ ...validLead, interesse: "a".repeat(501) })).toThrow();
  });

  it("aceita interesse no limite exato de 500 caracteres", () => {
    expect(() => LeadSchema.parse({ ...validLead, interesse: "a".repeat(500) })).not.toThrow();
  });

  it("tira espaços em branco das pontas (trim)", () => {
    const parsed = LeadSchema.parse({ ...validLead, nome: "  Fulano de Tal  " });
    expect(parsed.nome).toBe("Fulano de Tal");
  });
});
