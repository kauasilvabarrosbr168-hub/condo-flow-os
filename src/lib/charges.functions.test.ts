import { describe, it, expect } from "vitest";
import { createChargeSchema, addressSchema } from "./charges.functions";

const validCharge = {
  condoId: "11111111-1111-1111-1111-111111111111",
  residentId: "22222222-2222-2222-2222-222222222222",
  amountCents: 25000,
  dueDate: "2026-10-05",
  method: "pix" as const,
};

describe("createChargeSchema", () => {
  it("aceita uma cobrança válida mínima", () => {
    expect(() => createChargeSchema.parse(validCharge)).not.toThrow();
  });

  it("usa 'Taxa condominial' como título padrão", () => {
    const parsed = createChargeSchema.parse(validCharge);
    expect(parsed.title).toBe("Taxa condominial");
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() => createChargeSchema.parse({ ...validCharge, amountCents: 0 })).toThrow();
    expect(() => createChargeSchema.parse({ ...validCharge, amountCents: -100 })).toThrow();
  });

  it("rejeita valor não inteiro (centavos fracionados)", () => {
    expect(() => createChargeSchema.parse({ ...validCharge, amountCents: 100.5 })).toThrow();
  });

  it("rejeita data fora do formato YYYY-MM-DD", () => {
    expect(() => createChargeSchema.parse({ ...validCharge, dueDate: "05/10/2026" })).toThrow();
  });

  it("rejeita método de pagamento inválido", () => {
    expect(() => createChargeSchema.parse({ ...validCharge, method: "cartao" })).toThrow();
  });

  it("rejeita condoId que não é UUID", () => {
    expect(() => createChargeSchema.parse({ ...validCharge, condoId: "não-é-uuid" })).toThrow();
  });

  it("rejeita CPF fora do padrão de 11 dígitos", () => {
    expect(() => createChargeSchema.parse({ ...validCharge, cpf: "123" })).toThrow();
  });

  it("aceita CPF de 11 dígitos", () => {
    expect(() => createChargeSchema.parse({ ...validCharge, cpf: "11144477735" })).not.toThrow();
  });
});

describe("addressSchema (obrigatório pra emitir boleto)", () => {
  const validAddress = {
    street: "Rua das Flores",
    number: "123",
    neighborhood: "Centro",
    zipcode: "01310100",
    city: "São Paulo",
    state: "SP",
  };

  it("aceita um endereço válido", () => {
    expect(() => addressSchema.parse(validAddress)).not.toThrow();
  });

  it("rejeita UF com mais de 2 letras", () => {
    expect(() => addressSchema.parse({ ...validAddress, state: "SAO" })).toThrow();
  });

  it("rejeita CEP muito curto", () => {
    expect(() => addressSchema.parse({ ...validAddress, zipcode: "123" })).toThrow();
  });

  it("rejeita rua vazia", () => {
    expect(() => addressSchema.parse({ ...validAddress, street: "" })).toThrow();
  });
});
