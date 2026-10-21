import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // `server-only` throws outside a Next server build; tests are plain Node, so stand it in.
  resolve: { alias: { '@': path('./src'), 'server-only': path('./src/test/server-only.ts') } },
  test: { environment: 'node', include: ['src/**/*.test.ts'], testTimeout: 20000 },
});
