import { describe, expect, it } from 'vitest';

/** See the API's copy: on CI the services the worker's tests need must exist, or the tests would skip silently. */
describe.runIf(process.env.CI)('integration services on CI', () => {
  it('has PostgreSQL and Redis', () => {
    expect(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL').toBeTruthy();
    expect(process.env.TEST_REDIS_URL, 'TEST_REDIS_URL').toBeTruthy();
  });
});
