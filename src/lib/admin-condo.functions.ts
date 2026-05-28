import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertCanManageCondo(userId: string, condoId: string) {
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
    await assertCanManageCondo(context.userId, data.condoId);
    const [{ data: condo }, { data: areas }, { data: members }, { data: sub }] = await Promise.all([
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

        .maybeSingle(),
    ]);
    return { condo, areas: areas ?? [], members: members ?? [], subscription: sub ?? null };
  });

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
});

export const upsertArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string; area: z.input<typeof areaSchema> }) =>
    z.object({ condoId: z.string().uuid(), area: areaSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertCanManageCondo(context.userId, data.condoId);
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
