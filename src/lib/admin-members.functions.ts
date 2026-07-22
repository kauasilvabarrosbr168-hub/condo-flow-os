import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RoleSchema = z.enum(["sindico", "administradora", "morador", "funcionario"]);

const AssignSchema = z.object({
  condoId: z.string().uuid(),
  userId: z.string().uuid(),
  role: RoleSchema,
  unitLabel: z.string().trim().max(40).optional().nullable(),
});

async function assertPlatformAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("platform_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

// One-time bootstrap: adds the caller as platform admin only when the table is empty.
// After the first admin is set, this function becomes a no-op (returns false).
export const bootstrapPlatformAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // C-02: usa supabaseAdmin para bypass da RLS — garante contagem real
    const { count } = await supabaseAdmin
      .from("platform_admins")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { ok: false, reason: "already_has_admin" };
    const email = (context.claims?.email as string | undefined) ?? "";
    const { error } = await supabaseAdmin
      .from("platform_admins")
      .insert({ user_id: context.userId, email });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// B-02: listagem de usuários via service role — nunca via anon client no browser
export const listAllUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context.userId);
    const [{ data: profs }, { data: condos }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email, unit_label, condo_id").order("full_name", { ascending: true }).limit(500),
      supabaseAdmin.from("condominiums").select("id, name"),
      supabaseAdmin.from("user_roles").select("user_id, role, condo_id"),
    ]);
    const condoMap = new Map((condos ?? []).map((c) => [c.id, c.name]));
    return (profs ?? []).map((p) => {
      const userRole = (roles ?? []).find((r) => r.user_id === p.id);
      const condoId = p.condo_id ?? userRole?.condo_id ?? null;
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        unit_label: p.unit_label,
        condo_id: condoId,
        condo_name: condoId ? (condoMap.get(condoId) ?? null) : null,
        role: userRole?.role ?? null,
      };
    });
  });

export const assignMemberToCondo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AssignSchema.parse(input))
  .handler(async ({ data, context }) => {
    // B-01: verifica que caller é platform_admin antes de atribuir membro
    await assertPlatformAdmin(context.userId);
    // Uses SECURITY DEFINER RPC so the operation runs in the same Supabase
    // project as the client — no service role key required.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (context.supabase as any).rpc("assign_member_to_condo", {
      p_user_id: data.userId,
      p_condo_id: data.condoId,
      p_role: data.role,
      p_unit_label: data.unitLabel ?? null,
    });
    if (error) throw new Error(error.message);
  });
