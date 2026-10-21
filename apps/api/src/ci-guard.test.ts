import { describe, expect, it } from 'vitest';

/**
 * The database and storage tests skip themselves when their service is not configured, which is
 * right on a laptop but would let CI pass while testing nothing. On CI the services must be there.
 */
describe.runIf(process.env.CI)('integration services on CI', () => {
  it('has a PostgreSQL server for the database tests', () => {
    expect(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL').toBeTruthy();
  });
  it('has an S3-compatible server for the storage tests', () => {
    expect(process.env.TEST_S3_ENDPOINT, 'TEST_S3_ENDPOINT').toBeTruthy();
    expect(process.env.TEST_S3_VERIFIES_SIGNATURES, 'a real server must verify signatures').toBe('true');
  });
});
