import { describe, it, expect } from "vitest";
import { createReservationSchema } from "./reservations.functions";

const validReservation = {
  condoId: "11111111-1111-1111-1111-111111111111",
  areaId: "22222222-2222-2222-2222-222222222222",
  startsAt: "2026-10-05T19:00:00.000Z",
  endsAt: "2026-10-05T23:00:00.000Z",
};

describe("createReservationSchema", () => {
  it("aceita uma reserva mínima válida", () => {
    expect(() => createReservationSchema.parse(validReservation)).not.toThrow();
  });

  it("usa 'none' como cleaningType padrão (regressão do bug corrigido em 2026-09-19)", () => {
    const parsed = createReservationSchema.parse(validReservation);
    expect(parsed.cleaningType).toBe("none");
    expect(parsed.guests).toBe(0);
  });

  it("aceita e mantém cleaningServiceId/cleaningType quando informados", () => {
    const parsed = createReservationSchema.parse({
      ...validReservation,
      cleaningServiceId: "33333333-3333-3333-3333-333333333333",
      cleaningType: "external",
    });
    expect(parsed.cleaningServiceId).toBe("33333333-3333-3333-3333-333333333333");
    expect(parsed.cleaningType).toBe("external");
  });

  it("rejeita cleaningType fora do enum permitido", () => {
    expect(() => createReservationSchema.parse({ ...validReservation, cleaningType: "profissional" })).toThrow();
  });

  it("rejeita datas que não são datetime ISO", () => {
    expect(() => createReservationSchema.parse({ ...validReservation, startsAt: "05/10/2026" })).toThrow();
  });

  it("rejeita convidados negativos", () => {
    expect(() => createReservationSchema.parse({ ...validReservation, guests: -1 })).toThrow();
  });

  it("rejeita convidados acima do limite de 1000", () => {
    expect(() => createReservationSchema.parse({ ...validReservation, guests: 1001 })).toThrow();
  });

  it("rejeita areaId que não é UUID", () => {
    expect(() => createReservationSchema.parse({ ...validReservation, areaId: "sala-de-festas" })).toThrow();
  });
});
