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

async function assertPlatformAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("platform_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("forbidden");
}

export const assignMemberToCondo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AssignSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.userId);

    const profileUpdate: { condo_id: string; unit_label?: string | null } = {
      condo_id: data.condoId,
    };
    if (data.unitLabel !== undefined) profileUpdate.unit_label = data.unitLabel;

    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", data.userId);
    if (pErr) throw new Error(pErr.message);

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: data.userId, condo_id: data.condoId, role: data.role },
        { onConflict: "user_id,condo_id,role" },
      );
    if (rErr) throw new Error(rErr.message);

    return { ok: true };
  });
