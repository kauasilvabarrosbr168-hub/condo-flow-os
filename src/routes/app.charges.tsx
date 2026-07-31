// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/app/charges")({
  head: () => ({ meta: [{ title: "Cobranças · CondoFlow" }] }),
  component: ChargesPage,
});

function ChargesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
        <CreditCard className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cobranças</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Gestão de cobranças e taxas condominiais em breve.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
        Em breve
      </span>
    </div>
  );
}
