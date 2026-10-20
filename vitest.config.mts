import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Dwa "projekty" testów w jednej konfiguracji:
//  - unit: czysta logika (walidacja, hasła, sesje, server actions) — środowisko Node
//  - components: komponenty Reacta renderowane w jsdom (udawana przeglądarka)
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true, // rozumie aliasy "@/..." z tsconfig.json
  },
  test: {
    // Każdy test zaczyna z czystymi mockami (vi.fn) — testy nie wpływają na siebie
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}", "proxy.ts"],
      // Strony (async Server Components) Vitest nie wyrenderuje — patrz README testów
      exclude: ["app/**/page.tsx", "app/layout.tsx", "app/lib/db.ts"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["tests/components/**/*.test.tsx"],
          setupFiles: ["tests/setup-dom.ts"],
        },
      },
    ],
  },
});
