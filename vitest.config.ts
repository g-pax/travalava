import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // Integration tests target Supabase edge functions that don't exist yet
    // (vote-cast / block-commit) and need a live local Supabase. Excluded
    // from the default unit run until the tests are rewritten against the
    // actual client-side hooks.
    exclude: ["**/node_modules/**", "src/test/integration/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
