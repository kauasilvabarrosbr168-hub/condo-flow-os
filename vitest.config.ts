import { defineConfig } from "vitest/config";
import path from "node:path";

// Config própria e isolada do vite.config.ts do app (que é gerenciado pelo
// Lovable e não deve ganhar plugins extras). Os testes aqui são unitários e
// não precisam de nenhum plugin do React/TanStack/Cloudflare — só resolver
// o alias "@/*" pros imports funcionarem igual no resto do projeto.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
