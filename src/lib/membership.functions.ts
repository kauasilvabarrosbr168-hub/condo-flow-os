import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const requestSchema = z.object({
  requestedRole: z.enum(["sindico", "funcionario", "morador"]),
  condoId: z.string().uuid().optional(),
  proposedCondoName: z.string().trim().min(1).max(120).optional(),
  proposedCondoAddress: z.string().trim().max(200).optional(),
  unitLabel: z.string().trim().max(40).optional(),
  note: z.string().trim().max(500).optional(),
});

export const requestMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof requestSchema>) => requestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    if (data.requestedRole === "sindico" && !data.proposedCondoName && !data.condoId) {
      throw new Error("Informe o nome do condomínio.");
    }
    if ((data.requestedRole === "funcionario" || data.requestedRole === "morador") && !data.condoId) {
      throw new Error("Selecione um condomínio.");
    }
    // Avoid duplicate pending request
    const { data: existing } = await supabaseAdmin
      .from("membership_requests")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["pending", "sindico_approved"])
      .maybeSingle();
    if (existing) return existing;

    const { data: row, error } = await supabaseAdmin
      .from("membership_requests")
      .insert({
        user_id: userId,
        condo_id: data.condoId ?? null,
        proposed_condo_name: data.proposedCondoName ?? null,
        proposed_condo_address: data.proposedCondoAddress ?? null,
        requested_role: data.requestedRole,
        unit_label: data.unitLabel ?? null,
        note: data.note ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMyMembershipStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("membership_requests")
      .select("id, status, requested_role, condo_id, proposed_condo_name, rejection_reason, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

export const listPendingRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: isAdmin } = await supabaseAdmin
      .from("platform_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let query = supabaseAdmin
      .from("membership_requests")
      .select("*, profiles:user_id(full_name, email), condominiums:condo_id(name)")
      .in("status", ["pending", "sindico_approved"])
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      const { data: condos } = await supabaseAdmin
        .from("user_roles")
        .select("condo_id")
        .eq("user_id", userId)
        .in("role", ["sindico", "administradora"]);
      const ids = (condos ?? []).map((c) => c.condo_id);
      if (!ids.length) return [];
      query = query.in("condo_id", ids);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const decideMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { requestId: string; decision: "approve" | "reject"; reason?: string }) =>
    z
      .object({
        requestId: z.string().uuid(),
        decision: z.enum(["approve", "reject"]),
        reason: z.string().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.rpc("decide_membership_request", {
      p_request_id: data.requestId,
      p_decision: data.decision,
      p_reason: data.reason ?? null,
    });
    if (error) throw new Error(error.message);
    return row;
  });
