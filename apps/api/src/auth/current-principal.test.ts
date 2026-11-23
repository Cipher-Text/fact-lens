import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Principal } from '@fact-lens/contracts';
import { startTestApp } from '../test-harness';
import { currentPrincipal } from './current-principal';
import { PgCapabilityStore } from './pg-capability-store';

const adminUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!adminUrl)('current principal (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let store: PgCapabilityStore;
  // A role of the test's own, so the test does not depend on the seeded roles.
  const role = 'current_principal_editor';
  const tokenFor = (subject: string): Principal => ({
    subject,
    roles: [role],
    capabilities: [] as Principal['capabilities'],
    mfa: true,
  });

  beforeAll(async () => {
    t = await startTestApp(adminUrl!);
    store = new PgCapabilityStore(t.db.pool);
    await t.db.pool.query(`INSERT INTO app_role (key, name) VALUES ($1, 'Test editor')`, [role]);
    await t.db.pool.query(`INSERT INTO app_role_capability (role_key, capability) VALUES ($1, 'news.edit')`, [role]);
  });
  afterAll(() => t?.close());

  it('gives the roles the database holds now, not the ones in the token', async () => {
    const userId = randomUUID();
    await t.db.pool.query(`INSERT INTO app_user (id, email, display_name, password_hash, status) VALUES ($1, 'current@example.org', 'Current', 'not-verified-in-this-test', 'active')`, [userId]);
    await t.db.pool.query('INSERT INTO user_role (user_id, role_key) VALUES ($1, $2)', [userId, role]);

    expect((await currentPrincipal(t.db.pool, store, tokenFor(userId)))?.capabilities).toEqual(['news.edit']);

    // The role is removed after sign-in: the token still names it, the database no longer does.
    await t.db.pool.query('DELETE FROM user_role WHERE user_id = $1', [userId]);
    expect(await currentPrincipal(t.db.pool, store, tokenFor(userId))).toMatchObject({ roles: [], capabilities: [] });
  });

  it('refuses an account that has been turned off, whatever its token says', async () => {
    const userId = randomUUID();
    await t.db.pool.query(`INSERT INTO app_user (id, email, display_name, status) VALUES ($1, 'disabled@example.org', 'Disabled', 'disabled')`, [userId]);
    await t.db.pool.query('INSERT INTO user_role (user_id, role_key) VALUES ($1, $2)', [userId, role]);
    expect(await currentPrincipal(t.db.pool, store, tokenFor(userId))).toBeNull();
  });

  it('keeps the token for an identity this backend has no account for', async () => {
    const token = tokenFor('external|8842');
    expect(await currentPrincipal(t.db.pool, store, token)).toEqual(token);
  });
});
