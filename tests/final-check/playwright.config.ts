import { defineConfig, devices } from "@playwright/test";

// FL-13: measurement run for the final check. Not part of `pnpm test:e2e`.
// Temporary: remove from the repository in the next milestone (IMP-30).
// Run: pnpm exec playwright test --config tests/final-check/playwright.config.ts

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
