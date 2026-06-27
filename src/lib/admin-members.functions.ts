import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RoleSchema = z.enum(["sindico", "administradora", "morador", "funcionario"]);

const AssignSchema = z.object({
  condoId: z.string().uuid(),
  userId: z.string().uuid(),
  role: RoleSchema,
  unitLabel: z.string().trim().max(40).optional().nullable(),
});

const SUPER_ADMIN_EMAILS = ['admin@condoflow.com'];

async function assertPlatformAdmin(userId: string, email?: string) {
  if (email && SUPER_ADMIN_EMAILS.includes(email)) return;
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
    const { count } = await supabaseAdmin
      .from("platform_admins")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { ok: false, reason: "already_has_admin" };
    const { error } = await supabaseAdmin
      .from("platform_admins")
      .insert({ user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignMemberToCondo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AssignSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.userId, context.claims?.email as string | undefined);

    const profileUpdate: { condo_id: string; unit_label?: string | null } = {
      condo_id: data.condoId,
    };
    if (data.unitLabel !== undefined) profileUpdate.unit_label = data.unitLabel;

    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", data.userId);
    if (pErr) throw new Error(pErr.message);

    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", data.userId)
      .eq("condo_id", data.condoId)
      .eq("role", data.role)
      .maybeSingle();

    if (!existing) {
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, condo_id: data.condoId, role: data.role });
      if (rErr) throw new Error(rErr.message);
    }

  });
