// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import type { Role } from "@/hooks/use-auth";

function getAdminClient() {
  const url = (import.meta.env?.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL) as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(url, key);
}

export const changeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }: {
    data: { targetUserId: string; condoId: string; newRole: Role };
    context: any;
  }) => {
    const adminSb = getAdminClient();
    const callerId = context.user.id;
    const { targetUserId, condoId, newRole } = data;

    // Verifica se o caller é síndico do condo OU super admin da plataforma
    const [{ data: callerRole }, { data: platformAdmin }] = await Promise.all([
      adminSb.from("user_roles").select("role").eq("user_id", callerId).eq("condo_id", condoId).maybeSingle(),
      adminSb.from("platform_admins").select("id").eq("user_id", callerId).maybeSingle(),
    ]);

    const isSindico = callerRole?.role === "sindico" || callerRole?.role === "administradora";
    const isPlatformAdmin = !!platformAdmin;

    if (!isSindico && !isPlatformAdmin) {
      throw new Error("Sem permissão para alterar cargos.");
    }

    // Impede remover o último síndico se estiver sendo rebaixado
    if (newRole !== "sindico") {
      const { data: currentTarget } = await adminSb
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .eq("condo_id", condoId)
        .maybeSingle();

      if (currentTarget?.role === "sindico") {
        const { count } = await adminSb
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("condo_id", condoId)
          .eq("role", "sindico");

        if ((count ?? 0) <= 1) {
          throw new Error("O condomínio precisa ter pelo menos um síndico.");
        }
      }
    }

    // Upsert: atualiza ou cria a role do usuário neste condo
    const { error } = await adminSb
      .from("user_roles")
      .upsert({ user_id: targetUserId, condo_id: condoId, role: newRole }, { onConflict: "user_id,condo_id" });

    if (error) throw new Error(error.message);

    // Registra na timeline
    await adminSb.from("activity_events").insert({
      condo_id: condoId,
      title: `Cargo alterado para ${newRole}`,
      kind: "system",
    }).throwOnError();

    return { success: true };
  });
