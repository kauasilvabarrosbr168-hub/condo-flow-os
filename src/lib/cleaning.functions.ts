import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─── Configuração de limpeza interna ─────────────────────────────────────────

export const getCleaningData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string }) => z.object({ condoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [configRes, workersRes, requestsRes] = await Promise.all([
      supabaseAdmin
        .from("condo_cleaning_config")
        .select("condo_id, internal_enabled, price_cents, worker_id")
        .eq("condo_id", data.condoId)
        .maybeSingle(),

      supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("condo_id", data.condoId)
        .eq("role", "funcionario"),

      supabaseAdmin
        .from("cleaning_requests")
        .select("id, requested_by, worker_id, unit_label, notes, status, price_cents, scheduled_at, done_at, created_at")
        .eq("condo_id", data.condoId)
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

    const workerIds = (workersRes.data ?? []).map((r) => r.user_id);
    const profileIds = [...new Set([
      ...workerIds,
      ...(requestsRes.data ?? []).flatMap((r) => [r.requested_by, r.worker_id].filter(Boolean)),
    ])];

    const { data: profiles } = profileIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, unit_label, email").in("id", profileIds)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    return {
      config: configRes.data ?? { internal_enabled: false, price_cents: 0, worker_id: null },
      workers: workerIds.map((id) => profileMap[id]).filter(Boolean),
      requests: (requestsRes.data ?? []).map((r) => ({
        ...r,
        requester: profileMap[r.requested_by] ?? null,
        worker: r.worker_id ? (profileMap[r.worker_id] ?? null) : null,
        is_mine: r.requested_by === context.userId,
      })),
    };
  });

export const saveCleaningConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string; enabled: boolean; priceCents: number; workerId: string | null }) =>
    z.object({
      condoId: z.string().uuid(),
      enabled: z.boolean(),
      priceCents: z.number().int().min(0),
      workerId: z.string().uuid().nullable(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("condo_id", data.condoId).maybeSingle();
    if (!role || !["sindico", "administradora"].includes(role.role)) throw new Error("forbidden");

    const { data: existing } = await supabaseAdmin
      .from("condo_cleaning_config").select("condo_id").eq("condo_id", data.condoId).maybeSingle();

    const payload = {
      condo_id: data.condoId,
      internal_enabled: data.enabled,
      price_cents: data.priceCents,
      worker_id: data.workerId,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabaseAdmin.from("condo_cleaning_config").update(payload).eq("condo_id", data.condoId)
      : await supabaseAdmin.from("condo_cleaning_config").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Pedidos de limpeza interna ───────────────────────────────────────────────

export const createCleaningRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { condoId: string; notes: string | null; scheduledAt: string | null }) =>
    z.object({
      condoId: z.string().uuid(),
      notes: z.string().max(500).nullable(),
      scheduledAt: z.string().nullable(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const [configRes, profileRes] = await Promise.all([
      supabaseAdmin.from("condo_cleaning_config").select("*").eq("condo_id", data.condoId).maybeSingle(),
      supabaseAdmin.from("profiles").select("unit_label").eq("id", context.userId).maybeSingle(),
    ]);

    if (!configRes.data?.internal_enabled) throw new Error("Serviço de limpeza interna não está disponível.");

    const { error } = await supabaseAdmin.from("cleaning_requests").insert({
      condo_id: data.condoId,
      requested_by: context.userId,
      worker_id: configRes.data.worker_id,
      unit_label: profileRes.data?.unit_label ?? null,
      notes: data.notes,
      price_cents: configRes.data.price_cents,
      scheduled_at: data.scheduledAt,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCleaningRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { requestId: string; status: "accepted" | "done" | "cancelled" }) =>
    z.object({
      requestId: z.string().uuid(),
      status: z.enum(["accepted", "done", "cancelled"]),
    }).parse(d))
  .handler(async ({ data }) => {
    const updates: Record<string, unknown> = { status: data.status };
    if (data.status === "done") updates.done_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from("cleaning_requests").update(updates).eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
