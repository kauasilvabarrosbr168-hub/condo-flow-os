// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyMembershipApproved, notifyMembershipRejected, notifyNewMembershipRequest } from "@/lib/notify.server";

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
    const { data: existing } = await context.supabase
      .from("membership_requests")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["pending", "sindico_approved"])
      .maybeSingle();
    if (existing) return existing;

    const { data: row, error } = await context.supabase
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

    // Notify síndico of new request (if condo already exists)
    if (data.condoId) {
      Promise.all([
        context.supabase.from("profiles").select("full_name, email, phone").eq("id", userId).maybeSingle(),
        context.supabase.from("condominiums").select("name").eq("id", data.condoId).maybeSingle(),
        context.supabase
          .from("user_roles")
          .select("user_id")
          .eq("condo_id", data.condoId)
          .in("role", ["sindico", "administradora"]),
      ]).then(async ([{ data: requester }, { data: condo }, { data: sindicos }]) => {
        if (!requester || !condo || !sindicos?.length) return;
        for (const s of sindicos) {
          const { data: sindicoProfile } = await context.supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("id", s.user_id)
            .maybeSingle();
          if (!sindicoProfile) continue;
          notifyNewMembershipRequest({
            toEmail: sindicoProfile.email ?? "",
            toPhone: sindicoProfile.phone ?? undefined,
            sindicoName: sindicoProfile.full_name ?? "",
            requesterName: requester.full_name ?? "",
            requesterRole: data.requestedRole,
            condoName: condo.name,
            requestId: row.id,
          }).catch(console.error);
        }
      }).catch(console.error);
    }

    return row;
  });

export const joinCondoByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; unitLabel?: string; requestedRole?: string }) =>
    z.object({
      code: z.string().min(1).max(20),
      unitLabel: z.string().trim().max(40).optional(),
      requestedRole: z.enum(["morador", "funcionario"]).optional().default("morador"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check for existing pending request (RLS: user sees own rows)
    const { data: existing } = await supabase
      .from("membership_requests")
      .select("id, status, condo_id")
      .eq("user_id", userId)
      .in("status", ["pending", "sindico_approved"])
      .maybeSingle();
    if (existing) return { condoId: existing.condo_id, alreadyPending: true };

    // Find condo by join code via SECURITY DEFINER RPC (no service role needed)
    const { data: condos, error: condoErr } = await supabase
      .rpc("find_condo_by_join_code", { p_code: data.code });

    const condo = condos?.[0] ?? null;
    if (condoErr || !condo) throw new Error("Código inválido ou condomínio não encontrado.");

    // Insert membership request (RLS: user_id = auth.uid())
    const { data: row, error } = await supabase
      .from("membership_requests")
      .insert({
        user_id: userId,
        condo_id: condo.id,
        requested_role: data.requestedRole ?? "morador",
        unit_label: data.unitLabel?.trim() || null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { condoId: condo.id, condoName: condo.name, requestId: row.id, alreadyPending: false };
  });

export const getMyMembershipStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS: user sees only their own rows, no service role needed
    const { data } = await context.supabase
      .from("membership_requests")
      .select("id, status, requested_role, condo_id, proposed_condo_name, rejection_reason, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

// Remove um membro do condomínio (sem excluir a conta).
// Pode ser chamado pelo síndico do condo ou por platform admin.
export const removeMemberFromCondo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; condoId: string }) =>
    z.object({ targetUserId: z.string().uuid(), condoId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { targetUserId, condoId } = data;

    // Verifica se caller é síndico/administradora deste condo
    const { data: callerRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("condo_id", condoId)
      .maybeSingle();

    const isSindico = callerRole?.role === "sindico" || callerRole?.role === "administradora";

    // Ou platform admin
    const { data: pa } = await supabase.from("platform_admins").select("id").eq("user_id", userId).maybeSingle();

    if (!isSindico && !pa) throw new Error("Sem permissão para remover membros.");
    if (targetUserId === userId) throw new Error("Você não pode se remover do condomínio.");

    // Remove role do condo
    await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("condo_id", condoId);
    // Desvincula perfil do condo
    await supabase.from("profiles").update({ condo_id: null }).eq("id", targetUserId).eq("condo_id", condoId);
    // Cancela solicitação pendente, se houver
    await supabase.from("membership_requests").delete().eq("user_id", targetUserId).eq("condo_id", condoId);

    return { ok: true };
  });

export const listPendingRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    const { data: isAdmin } = await context.supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let query = context.supabase
      .from("membership_requests")
      .select("*")
      .in("status", ["pending", "sindico_approved"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (!isAdmin) {
      const { data: condos } = await context.supabase
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
    const rows = data ?? [];
    if (rows.length === 0) return [];

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const condoIds = Array.from(new Set(rows.map((r) => r.condo_id).filter(Boolean) as string[]));
    const [{ data: profs }, { data: condos }] = await Promise.all([
      context.supabase.from("profiles").select("id, full_name, email").in("id", userIds),
      condoIds.length
        ? context.supabase.from("condominiums").select("id, name").in("id", condoIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
    const cmap = new Map((condos ?? []).map((c) => [c.id, c]));
    return rows.map((r) => ({
      ...r,
      profiles: pmap.get(r.user_id) ?? null,
      condominiums: r.condo_id ? cmap.get(r.condo_id) ?? null : null,
    }));
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
    const userId = context.userId;

    const { data: isAdmin } = await context.supabase
      .from("platform_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    let sindicoCondo: string | null = null;
    if (!isAdmin) {
      const { data: sindicoRole } = await context.supabase
        .from("user_roles")
        .select("condo_id")
        .eq("user_id", userId)
        .in("role", ["sindico", "administradora"])
        .maybeSingle();
      if (!sindicoRole) throw new Error("Sem permissão para aprovar solicitações.");
      sindicoCondo = sindicoRole.condo_id;
    }

    // Fetch request details before deciding (needed for C-05 check + notifications)
    const { data: req } = await context.supabase
      .from("membership_requests")
      .select("user_id, condo_id, proposed_condo_name, requested_role")
      .eq("id", data.requestId)
      .maybeSingle();

    // C-05: síndico só pode aprovar requests do seu próprio condomínio
    if (!isAdmin && req?.condo_id !== sindicoCondo) {
      throw new Error("Sem permissão para aprovar este pedido.");
    }

    // Super admin aprovando funcionário pendente: resolve direto via service role
    // para evitar o erro sindico_required do RPC (que exige síndico na 1ª etapa).
    if (isAdmin && data.decision === "approve" && req?.requested_role === "funcionario") {
      await supabaseAdmin
        .from("profiles")
        .update({ condo_id: req.condo_id })
        .eq("id", req.user_id);

      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", req.user_id)
        .eq("condo_id", req.condo_id)
        .maybeSingle();

      if (!existingRole) {
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: req.user_id, condo_id: req.condo_id, role: "funcionario" });
      } else {
        await supabaseAdmin
          .from("user_roles")
          .update({ role: "funcionario" })
          .eq("user_id", req.user_id)
          .eq("condo_id", req.condo_id);
      }

      const { data: row } = await supabaseAdmin
        .from("membership_requests")
        .update({
          status: "approved",
          decided_by_admin: userId,
          decided_admin_at: new Date().toISOString(),
        })
        .eq("id", data.requestId)
        .select()
        .single();

      return row;
    }

    const { data: row, error } = await context.supabase.rpc("decide_membership_request", {
      p_request_id: data.requestId,
      p_decision: data.decision,
      p_reason: data.reason ?? undefined,
    });

    if (error) throw new Error(error.message);

    // Fire notifications asynchronously (never block the response)
    if (req) {
      const [{ data: profile }, { data: condo }] = await Promise.all([
        context.supabase.from("profiles").select("full_name, email, phone").eq("id", req.user_id).maybeSingle(),
        req.condo_id
          ? context.supabase.from("condominiums").select("name").eq("id", req.condo_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const condoName = condo?.name ?? req.proposed_condo_name ?? "seu condomínio";
      if (profile) {
        if (data.decision === "approve") {
          notifyMembershipApproved({
            toEmail: profile.email ?? "",
            toPhone: profile.phone ?? undefined,
            fullName: profile.full_name ?? "",
            condoName,
          }).catch(console.error);
        } else {
          notifyMembershipRejected({
            toEmail: profile.email ?? "",
            toPhone: profile.phone ?? undefined,
            fullName: profile.full_name ?? "",
            condoName,
            reason: data.reason,
          }).catch(console.error);
        }
      }
    }

    return row;
  });
