import { describe, it, expect } from "vitest";
import { createCleaningRequestSchema, updateCleaningRequestStatusSchema } from "./cleaning.functions";

describe("createCleaningRequestSchema", () => {
  const valid = {
    condoId: "11111111-1111-1111-1111-111111111111",
    notes: null,
    scheduledAt: null,
  };

  it("aceita um pedido válido sem observação nem data", () => {
    expect(() => createCleaningRequestSchema.parse(valid)).not.toThrow();
  });

  it("aceita observação e data preenchidas", () => {
    expect(() =>
      createCleaningRequestSchema.parse({ ...valid, notes: "Focar na cozinha", scheduledAt: "2026-10-05T14:00:00.000Z" }),
    ).not.toThrow();
  });

  it("rejeita condoId que não é UUID", () => {
    expect(() => createCleaningRequestSchema.parse({ ...valid, condoId: "abc" })).toThrow();
  });

  it("rejeita observação acima de 500 caracteres", () => {
    expect(() => createCleaningRequestSchema.parse({ ...valid, notes: "a".repeat(501) })).toThrow();
  });
});

describe("updateCleaningRequestStatusSchema", () => {
  const requestId = "11111111-1111-1111-1111-111111111111";

  it.each(["accepted", "done", "cancelled"] as const)("aceita o status '%s'", (status) => {
    expect(() => updateCleaningRequestStatusSchema.parse({ requestId, status })).not.toThrow();
  });

  it("rejeita 'pending' como alvo (não é uma transição válida)", () => {
    expect(() => updateCleaningRequestStatusSchema.parse({ requestId, status: "pending" })).toThrow();
  });

  it("rejeita status desconhecido", () => {
    expect(() => updateCleaningRequestStatusSchema.parse({ requestId, status: "concluido" })).toThrow();
  });

  it("rejeita requestId que não é UUID", () => {
    expect(() => updateCleaningRequestStatusSchema.parse({ requestId: "abc", status: "done" })).toThrow();
  });
});
