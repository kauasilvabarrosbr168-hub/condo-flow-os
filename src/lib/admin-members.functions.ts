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
    const { count } = await context.supabase
      .from("platform_admins")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { ok: false, reason: "already_has_admin" };
    const email = (context.claims?.email as string | undefined) ?? "";
    const { error } = await context.supabase
      .from("platform_admins")
      .insert({ user_id: context.userId, email });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }: { data: { userId: string }; context: any }) => {
    await assertPlatformAdmin(context.userId, context.claims?.email as string | undefined);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignMemberToCondo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AssignSchema.parse(input))
  .handler(async ({ data, context }) => {
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
