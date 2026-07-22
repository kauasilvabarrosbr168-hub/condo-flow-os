import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TokenSchema = z.object({ token: z.string().trim().min(24).max(128) });

export const getInvitationByToken = createServerFn({ method: "GET" })
  .inputValidator((input) => TokenSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: invitation, error } = await supabaseAdmin
      .from("invitations")
      // C-01: não retornar email/full_name — esses campos são PII e o token já é o segredo
      .select("id, condo_id, unit_label, role, expires_at, accepted_at")
      .eq("token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return invitation;
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => TokenSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: invitation, error } = await supabaseAdmin
      .from("invitations")
      .select("id, condo_id, email, role, unit_label, accepted_at, expires_at")
      .eq("token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!invitation) throw new Error("invalid_token");
    if (invitation.accepted_at) throw new Error("already_used");
    if (new Date(invitation.expires_at).getTime() < Date.now()) throw new Error("expired");

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user?.email) throw new Error("not_authenticated");
    if (userData.user.email.toLowerCase() !== invitation.email.toLowerCase()) throw new Error("email_mismatch");

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ condo_id: invitation.condo_id, unit_label: invitation.unit_label })
      .eq("id", userId);
    if (profileError) throw new Error(profileError.message);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, condo_id: invitation.condo_id, role: invitation.role }, { onConflict: "user_id,condo_id,role" });
    if (roleError) throw new Error(roleError.message);

    const { error: inviteError } = await supabaseAdmin
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);
    if (inviteError) throw new Error(inviteError.message);

    return { condoId: invitation.condo_id };
  });