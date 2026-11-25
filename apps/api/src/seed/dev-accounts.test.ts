import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp } from '../test-harness';
import { roles } from './data';
import { devEmailFor, seedDevAccounts } from './dev-accounts';

const adminUrl = process.env.TEST_DATABASE_URL;

describe('devEmailFor', () => {
  it('puts every role on the reserved dev address, with underscores as hyphens', () => {
    expect(devEmailFor('reporter')).toBe('reporter@dev.factlens.test');
    expect(devEmailFor('desk_editor')).toBe('desk-editor@dev.factlens.test');
  });
});

describe.skipIf(!adminUrl)('dev accounts seed (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
  });
  afterAll(() => t?.close());

  it('creates one active account per role, keeps them on a second run, and gives each only its own role', async () => {
    expect(await seedDevAccounts(t.db.pool)).toEqual({ created: roles.length, existing: 0 });
    expect(await seedDevAccounts(t.db.pool)).toEqual({ created: 0, existing: roles.length });
    for (const role of roles) {
      const { rows } = await t.db.pool.query(
        `SELECT u.status, array_agg(ur.role_key) AS roles
           FROM app_user u JOIN user_role ur ON ur.user_id = u.id
          WHERE lower(u.email) = $1 GROUP BY u.status`, [devEmailFor(role.key)]);
      expect(rows[0], role.key).toEqual({ status: 'active', roles: [role.key] });
    }
  });
});
