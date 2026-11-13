import { describe, expect, it } from 'vitest';
import { buildAttachBody, buildValidation } from './sources';

describe('source helpers', () => {
  it('builds an attach body and omits blank notes', () => {
    expect(buildAttachBody('secondary', 'quoted', '  ')).toEqual({ relation: 'secondary', useType: 'quoted' });
    expect(buildAttachBody('primary', 'background', ' Internal ')).toEqual({ relation: 'primary', useType: 'background', notes: 'Internal' });
  });

  it('requires a validation reason between 3 and 500 characters', () => {
    expect(buildValidation('valid', ' ok ')).toBeNull();
    expect(buildValidation('valid', ' verified ')).toEqual({ status: 'valid', reason: 'verified' });
    expect(buildValidation('rejected', 'x'.repeat(501))).toBeNull();
  });
});
