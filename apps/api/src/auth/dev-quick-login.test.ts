import { randomBytes } from 'node:crypto';
import { generateKeyPair, jwtVerify } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { roles } from '../seed/data';
import { seedDevAccounts } from '../seed/dev-accounts';
import { startTestApp } from '../test-harness';
import type { SignInOptions } from './sign-in.options';

const adminUrl = process.env.TEST_DATABASE_URL;
const ISSUER = 'https://api.test';
const AUDIENCE = 'fact-lens-api';

describe.skipIf(!adminUrl)('dev quick sign-in (database)', () => {
  let publicKey: Awaited<ReturnType<typeof generateKeyPair>>['publicKey'];
  let on: Awaited<ReturnType<typeof startTestApp>>;
  let off: Awaited<ReturnType<typeof startTestApp>>;

  beforeAll(async () => {
    const keys = await generateKeyPair('ES256');
    publicKey = keys.publicKey;
    const base: SignInOptions = {
      privateKey: keys.privateKey, publicKey: keys.publicKey, issuer: ISSUER, audience: AUDIENCE, encryptionKey: randomBytes(32),
      secureCookies: false, newsroomUrl: 'https://newsroom.test', attemptsPerMinute: 100000,
    };
    on = await startTestApp(adminUrl!, { signIn: { ...base, devQuickLogin: true } });
    off = await startTestApp(adminUrl!, { signIn: base });
    await seedDevAccounts(on.db.pool);
    await seedDevAccounts(off.db.pool);
    // An ordinary active account that is not on the dev address: it must never be reachable this way.
    await on.db.pool.query(`INSERT INTO app_user (email, display_name, password_hash, status) VALUES ('real-editor@example.org', 'Real Editor', 'x', 'active')`);
  });
  afterAll(async () => {
    await on?.close();
    await off?.close();
  });

  const signInAs = (t: typeof on, email: string) => t.app.inject({ method: 'POST', url: '/auth/dev/sign-in', payload: { email } });

  it('lists the dev accounts, one per role, and no ordinary account', async () => {
    const res = await on.app.inject({ method: 'GET', url: '/auth/dev/users' });
    expect(res.statusCode).toBe(200);
    const users = res.json() as Array<{ email: string; displayName: string; roles: string[] }>;
    expect(users).toHaveLength(roles.length);
    expect(users.every((u) => u.email.endsWith('@dev.factlens.test'))).toBe(true);
    expect(users.find((u) => u.email === 'admin@dev.factlens.test')).toMatchObject({ displayName: 'Dev Admin', roles: ['admin'] });
  });

  it('signs in as a dev account without a password or a code, with that role and a second factor', async () => {
    const res = await signInAs(on, 'managing-editor@dev.factlens.test');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('signed_in');
    expect(String(res.headers['set-cookie'])).toContain('fl_refresh=');
    const { payload } = await jwtVerify(body.accessToken, publicKey, { issuer: ISSUER, audience: AUDIENCE });
    expect(payload.roles).toEqual(['managing_editor']);
    expect(payload.amr).toContain('mfa');
  });

  it('writes every dev sign-in to the audit log', async () => {
    const before = (await on.db.pool.query(`SELECT count(*)::int AS n FROM audit_event WHERE action = 'auth.dev_sign_in'`)).rows[0].n as number;
    await signInAs(on, 'reporter@dev.factlens.test');
    const after = (await on.db.pool.query(`SELECT count(*)::int AS n FROM audit_event WHERE action = 'auth.dev_sign_in'`)).rows[0].n as number;
    expect(after).toBe(before + 1);
  });

  it('refuses an ordinary account, even an active one, and does not say whether it exists', async () => {
    expect((await signInAs(on, 'real-editor@example.org')).statusCode).toBe(404);
    expect((await signInAs(on, 'nobody@example.org')).statusCode).toBe(404);
  });

  it('refuses a disabled dev account and an unknown one', async () => {
    await on.db.pool.query(`INSERT INTO app_user (email, display_name, password_hash, status) VALUES ('retired@dev.factlens.test', 'Retired', 'x', 'disabled')`);
    expect((await signInAs(on, 'retired@dev.factlens.test')).statusCode).toBe(404);
    expect((await signInAs(on, 'nobody@dev.factlens.test')).statusCode).toBe(404);
  });

  it('answers 404 for both routes when the setting is off, even though the dev accounts exist', async () => {
    expect((await off.app.inject({ method: 'GET', url: '/auth/dev/users' })).statusCode).toBe(404);
    expect((await signInAs(off, 'admin@dev.factlens.test')).statusCode).toBe(404);
  });
});
