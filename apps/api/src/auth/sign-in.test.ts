import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { createTokenVerifier } from './token-verifier';
import { hashPassword } from './credentials';
import { codeAt, newSecret as totpSecret, stepAt } from './totp';
import { encryptSecret } from './tokens';
import { startTestApp } from '../test-harness';
import type { SignInOptions } from './sign-in.options';

const adminUrl = process.env.TEST_DATABASE_URL;
const ISSUER = 'https://api.test/';
const AUDIENCE = 'fact-lens-api';
const PASSWORD = 'correct horse battery staple';

describe.skipIf(!adminUrl)('sign-in inside the backend (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;
  let options: SignInOptions;
  let verifier: ReturnType<typeof createTokenVerifier>;
  let encryptionKey: Buffer;

  beforeAll(async () => {
    const keys = await generateKeyPair('ES256');
    encryptionKey = randomBytes(32);
    options = {
      privateKey: keys.privateKey, publicKey: keys.publicKey, issuer: ISSUER, audience: AUDIENCE, encryptionKey, secureCookies: false,
      attemptsPerMinute: 100000, newsroomUrl: 'https://newsroom.test',
    };
    verifier = createTokenVerifier({
      issuer: ISSUER, audience: AUDIENCE, keys: createLocalJWKSet({ keys: [{ ...(await exportJWK(keys.publicKey)), alg: 'ES256' }] }),
    });
    t = await startTestApp(adminUrl!, { signIn: options });
  });
  afterAll(() => t?.close());

  /** An account that has finished setting up: active, with a confirmed authenticator app and a role. */
  async function account(email: string, o: { status?: string; confirmed?: boolean; roles?: string[] } = {}) {
    const secret = totpSecret();
    const id = (await t.db.pool.query(
      `INSERT INTO app_user (email, display_name, password_hash, status) VALUES ($1, 'Test', $2, $3) RETURNING id`,
      [email, await hashPassword(PASSWORD), o.status ?? 'active'])).rows[0].id as string;
    await t.db.pool.query(
      'INSERT INTO mfa_factor (user_id, secret_encrypted, confirmed_at) VALUES ($1, $2, $3)',
      [id, encryptSecret(Buffer.from(secret, 'utf8'), encryptionKey), o.confirmed === false ? null : new Date()]);
    for (const role of o.roles ?? ['reporter']) await t.db.pool.query('INSERT INTO user_role (user_id, role_key) VALUES ($1, $2)', [id, role]);
    return { id, secret };
  }

  const post = (url: string, payload: object, cookie?: string) =>
    t.app.inject({ method: 'POST', url, payload, headers: cookie ? { cookie } : undefined });
  const json = (res: { body: string }) => JSON.parse(res.body) as any;
  const refreshCookieOf = (res: { headers: Record<string, unknown> }): string | null => {
    const raw = res.headers['set-cookie'];
    const line = (Array.isArray(raw) ? raw : [raw]).find((c) => typeof c === 'string' && c.startsWith('fl_refresh=')) as string | undefined;
    return line ? line.split(';')[0]! : null;
  };
  const challenge = async (email: string) => json(await post('/auth/sign-in', { email, password: PASSWORD }));
  const codeFor = (secret: string, offset = 0) => codeAt(secret, stepAt(Math.floor(Date.now() / 1000)) + offset);

  /** A complete sign-in: the password step and then the code step. Returns the cookie and the access token. */
  async function signedIn(email: string, secret: string) {
    const c = await challenge(email);
    const res = await post('/auth/mfa', { challengeToken: c.challengeToken, code: codeFor(secret) });
    expect(res.statusCode, res.body).toBe(200);
    return { body: json(res), cookie: refreshCookieOf(res) };
  }

  it('refuses a wrong password and an unknown address with the same message', async () => {
    await account('wrongpw@example.org');
    const wrong = await post('/auth/sign-in', { email: 'wrongpw@example.org', password: 'not the password at all' });
    const unknown = await post('/auth/sign-in', { email: 'nobody@example.org', password: 'not the password at all' });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(json(wrong).message).toBe(json(unknown).message);
  });

  it('refuses invited and disabled accounts, and accounts with no confirmed authenticator app', async () => {
    await account('invited@example.org', { status: 'invited' });
    await account('disabled@example.org', { status: 'disabled' });
    await account('unset@example.org', { confirmed: false });
    for (const email of ['invited@example.org', 'disabled@example.org', 'unset@example.org']) {
      expect((await post('/auth/sign-in', { email, password: PASSWORD })).statusCode).toBe(401);
    }
  });

  it('gives a code challenge after the right password, with no sign-in and no cookie yet', async () => {
    await account('challenge@example.org');
    const res = await post('/auth/sign-in', { email: 'challenge@example.org', password: PASSWORD });
    expect(res.statusCode).toBe(200);
    expect(json(res).status).toBe('mfa_required');
    expect(json(res).challengeToken).toMatch(/\./);
    expect(refreshCookieOf(res)).toBeNull();
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('completes a sign-in with a code: an access token the verifier accepts, and an HTTP-only refresh cookie', async () => {
    const acc = await account('full@example.org', { roles: ['reporter', 'desk_editor'] });
    const res = await signedIn('full@example.org', acc.secret);
    expect(res.body.status).toBe('signed_in');
    expect(res.body).not.toHaveProperty('refreshToken');
    const payload = await verifier.verify(res.body.accessToken);
    expect(payload.sub).toBe(acc.id);
    expect(payload.roles).toEqual(['desk_editor', 'reporter']);
    expect(payload.amr).toEqual(['pwd', 'mfa']);
    expect(res.cookie).toMatch(/^fl_refresh=/);
    const sessions = await t.db.pool.query('SELECT count(*)::int AS n FROM auth_session WHERE user_id = $1', [acc.id]);
    expect(sessions.rows[0].n).toBe(1);
  });

  it('refuses a wrong code and a code that was already used', async () => {
    const acc = await account('codes@example.org');
    const c1 = await challenge('codes@example.org');
    expect((await post('/auth/mfa', { challengeToken: c1.challengeToken, code: '000000' })).statusCode).toBe(401);
    const c2 = await challenge('codes@example.org');
    const code = codeFor(acc.secret);
    expect((await post('/auth/mfa', { challengeToken: c2.challengeToken, code })).statusCode).toBe(200);
    const c3 = await challenge('codes@example.org');
    expect((await post('/auth/mfa', { challengeToken: c3.challengeToken, code })).statusCode).toBe(401);
  });

  it('refuses a tampered challenge token', async () => {
    await account('tamper@example.org');
    const c = await challenge('tamper@example.org');
    const tampered = `${c.challengeToken.slice(0, -2)}xx`;
    expect((await post('/auth/mfa', { challengeToken: tampered, code: '123456' })).statusCode).toBe(401);
  });

  it('locks the account after five failures, refuses even the right password while locked, and lets it in after the lock ends', async () => {
    const acc = await account('locked@example.org');
    for (let i = 0; i < 5; i += 1) {
      await post('/auth/sign-in', { email: 'locked@example.org', password: 'wrong wrong wrong' });
    }
    expect((await post('/auth/sign-in', { email: 'locked@example.org', password: PASSWORD })).statusCode).toBe(401);
    const audit = await t.db.pool.query(`SELECT count(*)::int AS n FROM audit_event WHERE action = 'auth.locked' AND object_id = $1`, [acc.id]);
    expect(audit.rows[0].n).toBe(1);
    await t.db.pool.query(`UPDATE app_user SET locked_until = now() - interval '1 second' WHERE id = $1`, [acc.id]);
    expect((await post('/auth/sign-in', { email: 'locked@example.org', password: PASSWORD })).statusCode).toBe(200);
  });

  it('accepts a recovery code once in place of an authenticator code', async () => {
    const acc = await account('recovery@example.org');
    const plain = 'ab12-cd34';
    await t.db.pool.query('INSERT INTO mfa_recovery_code (user_id, code_hash) VALUES ($1, $2)', [acc.id, await hashPassword(plain)]);
    const first = await challenge('recovery@example.org');
    const ok = await post('/auth/mfa/recovery', { challengeToken: first.challengeToken, recoveryCode: plain });
    expect(ok.statusCode).toBe(200);
    expect(json(ok).status).toBe('signed_in');
    const second = await challenge('recovery@example.org');
    expect((await post('/auth/mfa/recovery', { challengeToken: second.challengeToken, recoveryCode: plain })).statusCode).toBe(401);
  });

  it('rotates the refresh token on each refresh', async () => {
    const acc = await account('rotate@example.org');
    const first = await signedIn('rotate@example.org', acc.secret);
    const refreshed = await post('/auth/refresh', {}, first.cookie!);
    expect(refreshed.statusCode).toBe(200);
    expect(json(refreshed).status).toBe('signed_in');
    const next = refreshCookieOf(refreshed);
    expect(next).toMatch(/^fl_refresh=/);
    expect(next).not.toBe(first.cookie);
  });

  it('ends the sign-in when a refresh token is used twice, and audits it', async () => {
    const acc = await account('reuse@example.org');
    const first = await signedIn('reuse@example.org', acc.secret);
    const second = await post('/auth/refresh', {}, first.cookie!);
    const newer = refreshCookieOf(second)!;
    expect((await post('/auth/refresh', {}, first.cookie!)).statusCode).toBe(401);
    expect((await post('/auth/refresh', {}, newer)).statusCode).toBe(401);
    const audit = await t.db.pool.query(`SELECT count(*)::int AS n FROM audit_event WHERE action = 'auth.refresh_reuse' AND object_id = $1`, [acc.id]);
    expect(audit.rows[0].n).toBe(1);
  });

  it('gives the new roles on the next refresh, after a role change', async () => {
    const acc = await account('roles@example.org', { roles: ['reporter'] });
    const first = await signedIn('roles@example.org', acc.secret);
    await t.db.pool.query('DELETE FROM user_role WHERE user_id = $1', [acc.id]);
    await t.db.pool.query(`INSERT INTO user_role (user_id, role_key) VALUES ($1, 'copy_editor')`, [acc.id]);
    const refreshed = await post('/auth/refresh', {}, first.cookie!);
    const payload = await verifier.verify(json(refreshed).accessToken);
    expect(payload.roles).toEqual(['copy_editor']);
  });

  it('refuses a refresh after the sign-in has expired', async () => {
    const acc = await account('expired@example.org');
    const first = await signedIn('expired@example.org', acc.secret);
    await t.db.pool.query(`UPDATE auth_session SET created_at = now() - interval '2 hours', expires_at = now() - interval '1 second' WHERE user_id = $1`, [acc.id]);
    expect((await post('/auth/refresh', {}, first.cookie!)).statusCode).toBe(401);
  });

  it('ends the sign-in on sign-out, clears the cookie, and is safe to repeat', async () => {
    const acc = await account('signout@example.org');
    const first = await signedIn('signout@example.org', acc.secret);
    const out = await post('/auth/sign-out', {}, first.cookie!);
    expect(out.statusCode).toBe(204);
    expect(String(out.headers['set-cookie'])).toContain('Max-Age=0');
    expect((await post('/auth/refresh', {}, first.cookie!)).statusCode).toBe(401);
    expect((await post('/auth/sign-out', {}, first.cookie!)).statusCode).toBe(204);
  });

  it('refuses a refresh with no cookie', async () => {
    expect((await post('/auth/refresh', {})).statusCode).toBe(401);
  });
});

describe.skipIf(!adminUrl || !process.env.TEST_REDIS_URL)('sign-in attempts per address', () => {
  it('answers 429 once an address has used up its attempts for the minute', async () => {
    const keys = await generateKeyPair('ES256');
    const t = await startTestApp(adminUrl!, { signIn: { privateKey: keys.privateKey, publicKey: keys.publicKey, issuer: ISSUER, audience: AUDIENCE, encryptionKey: randomBytes(32), secureCookies: false, attemptsPerMinute: 3, newsroomUrl: 'https://newsroom.test' } });
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 4; i += 1) {
        statuses.push((await t.app.inject({ method: 'POST', url: '/auth/sign-in', payload: { email: 'x@example.org', password: PASSWORD } })).statusCode);
      }
      expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
      expect(statuses[3]).toBe(429);
    } finally {
      await t.close();
    }
  });
});

describe.skipIf(!adminUrl)('sign-in on a server with no keys configured', () => {
  it('answers 503 and never signs anyone in', async () => {
    const t = await startTestApp(adminUrl!);
    try {
      const res = await t.app.inject({ method: 'POST', url: '/auth/sign-in', payload: { email: 'a@b.co', password: PASSWORD } });
      expect(res.statusCode).toBe(503);
    } finally {
      await t.close();
    }
  });
});
