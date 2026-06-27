import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPER_ADMIN_EMAILS = ['admin@condoflow.com'];

async function assertCanManageCondo(userId: string, condoId: string, email?: string) {
  if (email && SUPER_ADMIN_EMAILS.includes(email)) return;
  const { data: isAdmin } = await supabaseAdmin
    .from("platform_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (isAdmin) return;
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("condo_id", condoId)
    .in("role", ["sindico", "administradora"])
    .maybeSingle();
  if (!role) throw new Error("forbidden");
}

export const getCondoDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageCondo(context.userId, data.condoId, context.claims?.email as string | undefined);
    const [{ data: condo }, { data: areas }, { data: roleRows }, { data: sub }] = await Promise.all([
      supabaseAdmin.from("condominiums").select("*").eq("id", data.condoId).single(),
      supabaseAdmin
        .from("common_areas")
        .select("*")
        .eq("condo_id", data.condoId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .eq("condo_id", data.condoId),
      supabaseAdmin
        .from("subscriptions")
        .select("status, plans(name, code)")
        .eq("condo_id", data.condoId)
        .maybeSingle(),
    ]);
    const memberIds = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
    const { data: profs } = memberIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, email, unit_label").in("id", memberIds)
      : { data: [] as { id: string; full_name: string; email: string; unit_label: string | null }[] };
    const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
    const members = (roleRows ?? []).map((r) => ({
      user_id: r.user_id,
      role: r.role,
      profiles: pmap.get(r.user_id) ?? null,
    }));
    return { condo, areas: areas ?? [], members, subscription: sub ?? null };
  });


const daySlotSchema = z.object({ from: z.string(), to: z.string() }).nullable();
const weekScheduleSchema = z.object({
  seg: daySlotSchema, ter: daySlotSchema, qua: daySlotSchema,
  qui: daySlotSchema, sex: daySlotSchema, sab: daySlotSchema, dom: daySlotSchema,
}).nullable().optional();

const areaSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().nullable(),
  rules: z.string().trim().max(2000).optional().nullable(),
  capacity: z.number().int().min(0).max(10000).optional().nullable(),
  min_advance_hours: z.number().int().min(0).max(720),
  requires_checklist: z.boolean(),
  cover_url: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).max(20).optional(),
  active: z.boolean().optional(),
  available_slots: weekScheduleSchema,
});

export const upsertArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string; area: z.input<typeof areaSchema> }) =>
    z.object({ condoId: z.string().uuid(), area: areaSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageCondo(context.userId, data.condoId, context.claims?.email as string | undefined);
    const payload = {
      condo_id: data.condoId,
      name: data.area.name,
      description: data.area.description ?? null,
      rules: data.area.rules ?? null,
      capacity: data.area.capacity ?? null,
      min_advance_hours: data.area.min_advance_hours,
      requires_checklist: data.area.requires_checklist,
      cover_url: data.area.cover_url ?? null,
      gallery: data.area.gallery ?? [],
      active: data.area.active ?? true,
      available_slots: data.area.available_slots ?? null,
    };
    if (data.area.id) {
      const { data: row, error } = await supabaseAdmin
        .from("common_areas")
        .update(payload)
        .eq("id", data.area.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabaseAdmin
      .from("common_areas")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { areaId: string }) => z.object({ areaId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: area } = await supabaseAdmin
      .from("common_areas")
      .select("condo_id")
      .eq("id", data.areaId)
      .single();
    if (!area) throw new Error("not_found");
    await assertCanManageCondo(context.userId, area.condo_id);
    const { error } = await supabaseAdmin.from("common_areas").delete().eq("id", data.areaId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const contactSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(200),
  kind: z.enum(["phone", "email", "whatsapp", "other"]).optional(),
});

const condoUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
  towers_count: z.number().int().min(0).max(500).optional().nullable(),
  blocks_count: z.number().int().min(0).max(500).optional().nullable(),
  rules: z.string().trim().max(10000).optional().nullable(),
  contacts: z.array(contactSchema).max(30).optional(),
  general_info: z.string().trim().max(10000).optional().nullable(),
});

export const updateCondo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string; patch: z.input<typeof condoUpdateSchema> }) =>
    z.object({ condoId: z.string().uuid(), patch: condoUpdateSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageCondo(context.userId, data.condoId, context.claims?.email as string | undefined);
    const { data: row, error } = await supabaseAdmin
      .from("condominiums")
      .update({
        name: data.patch.name,
        address: data.patch.address ?? null,
        description: data.patch.description ?? null,
        logo_url: data.patch.logo_url ?? null,
        cover_url: data.patch.cover_url ?? null,
        towers_count: data.patch.towers_count ?? null,
        blocks_count: data.patch.blocks_count ?? null,
        rules: data.patch.rules ?? null,
        contacts: data.patch.contacts ?? [],
        general_info: data.patch.general_info ?? null,
      })
      .eq("id", data.condoId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyCondoId = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: prof } = await context.supabase
      .from("profiles")
      .select("condo_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (prof?.condo_id) return { condoId: prof.condo_id as string };
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("condo_id")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    return { condoId: (role?.condo_id as string | undefined) ?? null };
  });

export const getCondoJoinCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageCondo(context.userId, data.condoId, context.claims?.email as string | undefined);
    const { data: condo, error } = await supabaseAdmin
      .from("condominiums")
      .select("join_code")
      .eq("id", data.condoId)
      .single();
    if (error) throw new Error(error.message);
    return { joinCode: condo.join_code as string };
  });

export const regenerateCondoJoinCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManageCondo(context.userId, data.condoId, context.claims?.email as string | undefined);
    const { data: newCode, error } = await supabaseAdmin.rpc("regenerate_condo_join_code", {
      p_condo_id: data.condoId,
    });
    if (error) throw new Error(error.message);
    return { joinCode: newCode as string };
  });
