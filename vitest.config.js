import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.js",
    testTimeout: 10000,
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"]
  }
});
