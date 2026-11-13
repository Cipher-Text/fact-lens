import { defineConfig } from 'vitest/config';

// Database tests create a fresh database and run every API migration in a beforeAll hook.
// Under a parallel run that can take longer than vitest's default 10 s hook timeout.
export default defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'], testTimeout: 20000, hookTimeout: 60000 } });
