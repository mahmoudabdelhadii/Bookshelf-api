import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**/node_modules/**", "**/index.ts", "vite.config.mts"],
    },
    maxConcurrency: 1,
    testTimeout: 10000,
    globals: true,
    restoreMocks: true,
    logHeapUsage: true,
    isolate: true,
    environment: "node",
    env: {
      ENV: "test",
    },
  },
  plugins: [tsconfigPaths()],
});
