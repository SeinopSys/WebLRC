import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["tests/browser/**", "node_modules/**"],
    setupFiles: ["./tests/setup/node.ts", "./tests/setup/jsdom.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/global.ts",
        "src/styles/**",
        "src/vite.d.ts",
      ],
    },
  },
});
