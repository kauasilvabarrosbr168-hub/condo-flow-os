// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";

export const createReservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      condoId:          z.string().uuid(),
      areaId:           z.string().uuid(),
      startsAt:         z.string().datetime(),
      endsAt:           z.string().datetime(),
      guests:           z.number().int().min(0).max(1000).default(0),
      notes:            z.string().max(500).optional().nullable(),
      cleaningServiceId: z.string().uuid().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verifica que o usuário pertence a este condomínio
    const [{ data: roleRow }, { data: prof }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("condo_id", data.condoId).maybeSingle(),
      supabase.from("profiles").select("condo_id").eq("id", userId).maybeSingle(),
    ]);
    if (!roleRow && prof?.condo_id !== data.condoId) {
      throw new Error("Você não pertence a este condomínio.");
    }

    // Verifica que a área pertence a este condomínio
    const { data: area } = await supabase
      .from("common_areas")
      .select("id, name, min_advance_hours")
      .eq("id", data.areaId)
      .eq("condo_id", data.condoId)
      .maybeSingle();
    if (!area) throw new Error("Área não encontrada ou não pertence a este condomínio.");

    // Antecedência mínima
    const minAdvanceMs = (area.min_advance_hours ?? 0) * 3600_000;
    if (new Date(data.startsAt).getTime() < Date.now() + minAdvanceMs) {
      throw new Error(`Esta área exige pelo menos ${area.min_advance_hours}h de antecedência.`);
    }

    // C-04: verifica conflito de horário no servidor
    const { data: conflicts } = await supabase
      .from("reservations")
      .select("id")
      .eq("area_id", data.areaId)
      .neq("status", "cancelada")
      .lt("starts_at", data.endsAt)
      .gt("ends_at", data.startsAt);
    if ((conflicts?.length ?? 0) > 0) {
      throw new Error("Já existe uma reserva neste horário para esta área.");
    }

    // Cria a reserva
    const { data: res, error } = await supabase
      .from("reservations")
      .insert({
        condo_id:            data.condoId,
        area_id:             data.areaId,
        resident_id:         userId,
        starts_at:           data.startsAt,
        ends_at:             data.endsAt,
        guests:              data.guests,
        notes:               data.notes || null,
        cleaning_service_id: data.cleaningServiceId || null,
        status:              "pendente",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Cria tarefa de limpeza se solicitado
    if (data.cleaningServiceId && res?.id) {
      const { data: svc } = await supabase
        .from("cleaning_services")
        .select("name, phone")
        .eq("id", data.cleaningServiceId)
        .maybeSingle();
      await supabase.from("tasks").insert({
        condo_id:       data.condoId,
        reservation_id: res.id,
        title:          `Limpeza pós-evento — ${area.name}`,
        description:    svc ? `Prestador: ${svc.name}${svc.phone ? ` · ${svc.phone}` : ""}` : null,
        kind:           "pos_checklist",
        status:         "pendente",
        due_at:         data.endsAt,
      });
    }

    return { id: res.id };
  });

export const updateReservationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      reservationId: z.string().uuid(),
      status:        z.enum(["confirmada", "cancelada"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: res } = await supabase
      .from("reservations")
      .select("resident_id, condo_id, status")
      .eq("id", data.reservationId)
      .maybeSingle();
    if (!res) throw new Error("Reserva não encontrada.");
    if (res.status === "cancelada") throw new Error("Reserva já está cancelada.");

    const isOwner = res.resident_id === userId;
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("condo_id", res.condo_id)
      .in("role", ["sindico", "administradora"])
      .maybeSingle();
    const isAdmin = !!adminRole;

    if (data.status === "confirmada" && !isAdmin) {
      throw new Error("Apenas síndico ou administradora pode confirmar reservas.");
    }
    if (data.status === "cancelada" && !isOwner && !isAdmin) {
      throw new Error("Sem permissão para cancelar esta reserva.");
    }

    const { error } = await supabase
      .from("reservations")
      .update({ status: data.status })
      .eq("id", data.reservationId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
