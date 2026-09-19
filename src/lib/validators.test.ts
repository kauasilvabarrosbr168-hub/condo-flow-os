import { describe, it, expect } from "vitest";
import { isValidCPF, isValidCNPJ } from "./validators";

describe("isValidCPF", () => {
  it("aceita um CPF válido (com formatação)", () => {
    expect(isValidCPF("111.444.777-35")).toBe(true);
  });

  it("aceita um CPF válido (só dígitos)", () => {
    expect(isValidCPF("11144477735")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(isValidCPF("111.444.777-36")).toBe(false);
  });

  it("rejeita todos os dígitos repetidos", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("00000000000")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(isValidCPF("123456789")).toBe(false);
    expect(isValidCPF("123456789012")).toBe(false);
  });

  it("rejeita string vazia ou não numérica", () => {
    expect(isValidCPF("")).toBe(false);
    expect(isValidCPF("abc.def.ghi-jk")).toBe(false);
  });
});

describe("isValidCNPJ", () => {
  it("aceita um CNPJ válido conhecido (com formatação)", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("aceita um CNPJ real (Banco do Brasil, só dígitos)", () => {
    expect(isValidCNPJ("00000000000191")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false);
  });

  it("rejeita todos os dígitos repetidos", () => {
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
    expect(isValidCNPJ("00.000.000/0000-00")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(isValidCNPJ("1122233300018")).toBe(false);
    expect(isValidCNPJ("112223330001811")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(isValidCNPJ("")).toBe(false);
  });
});
