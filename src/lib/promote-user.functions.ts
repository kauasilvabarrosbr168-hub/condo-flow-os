// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/lib/supabase-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Role } from "@/hooks/use-auth";

export const changeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }: {
    data: { targetUserId: string; condoId: string; newRole: Role };
    context: any;
  }) => {
    const callerId = context.userId;
    const { targetUserId, condoId, newRole } = data;

    // Verifica se o caller é síndico do condo OU super admin da plataforma
    const [{ data: callerRole, error: roleErr }, { data: platformAdmin, error: paErr }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", callerId).eq("condo_id", condoId).maybeSingle(),
      supabaseAdmin.from("platform_admins").select("id").eq("user_id", callerId).maybeSingle(),
    ]);

    if (roleErr) console.error("Erro ao buscar role do caller:", roleErr.message);
    if (paErr) console.error("Erro ao buscar platform_admins:", paErr.message);

    const isSindico = callerRole?.role === "sindico" || callerRole?.role === "administradora";
    const isPlatformAdmin = !!platformAdmin;

    if (!isSindico && !isPlatformAdmin) {
      throw new Error(`Sem permissão para alterar cargos. (isSindico=${isSindico}, isPlatformAdmin=${isPlatformAdmin}, callerId=${callerId})`);
    }

    // Impede remover o último síndico se estiver sendo rebaixado
    if (newRole !== "sindico") {
      const { data: currentTarget } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId)
        .eq("condo_id", condoId)
        .maybeSingle();

      if (currentTarget?.role === "sindico") {
        const { count } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: targetUserId, condo_id: condoId, role: newRole }, { onConflict: "user_id,condo_id" });

    if (error) throw new Error(error.message);

    // Registra na timeline
    await supabaseAdmin.from("activity_events").insert({
      condo_id: condoId,
      title: `Cargo alterado para ${newRole}`,
      kind: "system",
    });

    return { success: true };
  });
