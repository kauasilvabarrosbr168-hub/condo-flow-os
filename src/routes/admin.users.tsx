// @ts-nocheck
// NÃO REGENERAR — implementação real em src/components/admin/users-page.tsx
import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/components/admin/users-page";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Usuários · CondoFlow Admin" }] }),
  component: AdminUsersPage,
});
