import { describe, expect, it } from 'vitest';
import { errorEnvelopeSchema, readinessResponseSchema } from './index';

describe('contracts', () => {
  it('accepts a valid error envelope', () => {
    expect(errorEnvelopeSchema.safeParse({ error: { code: 'x', message: 'm', requestId: 'r' } }).success).toBe(true);
  });
  it('rejects a bad readiness status', () => {
    expect(readinessResponseSchema.safeParse({ status: 'nope', checks: {} }).success).toBe(false);
  });
});
