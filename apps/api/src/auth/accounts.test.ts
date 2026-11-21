import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generateKeyPair } from 'jose';
import { startTestApp } from '../test-harness';
import { codeAt, stepAt } from './totp';
import type { SignInOptions } from './sign-in.options';

const adminUrl = process.env.TEST_DATABASE_URL;
const ISSUER = 'https://api.test/';
const AUDIENCE = 'fact-lens-api';
const PASSWORD = 'a long and uncommon phrase';

describe.skipIf(!adminUrl)('account administration (database)', () => {
  let t: Awaited<ReturnType<typeof startTestApp>>;

  beforeAll(async () => {
    const keys = await generateKeyPair('ES256');
    const options: SignInOptions = {
      privateKey: keys.privateKey, publicKey: keys.publicKey, issuer: ISSUER, audience: AUDIENCE,
      encryptionKey: randomBytes(32), secureCookies: false, attemptsPerMinute: 100000, newsroomUrl: 'https://newsroom.test/',
    };
    t = await startTestApp(adminUrl!, { signIn: options });
  });
  afterAll(() => t?.close());

  const invite = (email: string, roleKeys: string[] = ['reporter'], roles = ['admin']) =>
    t.call({ method: 'POST', url: '/accounts/invitations', roles, body: { email, displayName: 'New Person', roleKeys } });
  const tokenFrom = (link: string) => link.split('#token=')[1]!;
  const accept = (token: string, password = PASSWORD) => t.anonymous('POST', '/auth/invitations/accept', { token, password });
  const confirm = (enrolmentToken: string, code: string) => t.anonymous('POST', '/auth/invitations/confirm', { enrolmentToken, code });
  const json = (res: { json: () => unknown }) => res.json() as any;
  const signIn = (email: string) => t.anonymous('POST', '/auth/sign-in', { email, password: PASSWORD });
  const list = async () => (await t.call({ method: 'GET', url: '/accounts' })).body as any[];

  /** Invites, accepts and confirms an account. Returns its id, secret and recovery codes. */
  async function onboarded(email: string, roleKeys: string[] = ['reporter']) {
    const made = await invite(email, roleKeys);
    expect(made.status).toBe(201);
    const acc = await accept(tokenFrom(made.body.link));
    expect(acc.statusCode, acc.body).toBe(200);
    const body = json(acc);
    const done = await confirm(body.enrolmentToken, codeAt(body.secret, stepAt(Math.floor(Date.now() / 1000))));
    expect(done.statusCode, done.body).toBe(200);
    return { id: made.body.userId as string, secret: body.secret as string, recoveryCodes: json(done).recoveryCodes as string[] };
  }

  it('lets an administrator invite a person, with a one-time link and roles', async () => {
    const res = await invite('invitee@example.org', ['reporter']);
    expect(res.status).toBe(201);
    expect(res.body.link).toMatch(/^https:\/\/newsroom\.test\/sign-in\/invitation#token=[A-Za-z0-9_-]{20,}$/);
    const found = (await list()).find((a) => a.email === 'invitee@example.org');
    expect(found).toEqual(expect.objectContaining({ status: 'invited', roleKeys: ['reporter'], mfaConfirmed: false }));
    expect(JSON.stringify(found)).not.toMatch(/password|secret|hash/i);
  });

  it('refuses an invitation from someone without user.manage, and an unknown role', async () => {
    expect((await invite('denied@example.org', ['reporter'], ['reporter'])).status).toBe(403);
    expect((await invite('badrole@example.org', ['no_such_role'])).status).toBe(400);
    expect((await invite('invitee@example.org', ['reporter'])).status).toBe(409);
  });

  it('accepts an invitation with a password, refuses a common password, and never signs in before the setup is confirmed', async () => {
    const made = await invite('setup@example.org');
    const link = tokenFrom(made.body.link);
    expect((await accept(link, 'password12')).statusCode).toBe(400);
    const acc = await accept(link);
    expect(acc.statusCode).toBe(200);
    expect(json(acc).otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    expect((await signIn('setup@example.org')).statusCode).toBe(401);
  });

  it('confirms the authenticator app with a code, gives ten recovery codes once, and then allows sign-in', async () => {
    const made = await invite('confirm@example.org');
    const acc = json(await accept(tokenFrom(made.body.link)));
    expect((await confirm(acc.enrolmentToken, '000000')).statusCode).toBe(401);
    const done = await confirm(acc.enrolmentToken, codeAt(acc.secret, stepAt(Math.floor(Date.now() / 1000))));
    expect(done.statusCode).toBe(200);
    const codes = json(done).recoveryCodes as string[];
    expect(codes).toHaveLength(10);
    expect(codes.every((c) => /^[a-z2-9]{4}-[a-z2-9]{4}$/.test(c))).toBe(true);
    expect((await confirm(acc.enrolmentToken, codeAt(acc.secret, stepAt(Math.floor(Date.now() / 1000))))).statusCode).toBe(409);
    const challenge = json(await signIn('confirm@example.org'));
    expect(challenge.status).toBe('mfa_required');
    const code = await t.anonymous('POST', '/auth/mfa', { challengeToken: challenge.challengeToken, code: codeAt(acc.secret, stepAt(Math.floor(Date.now() / 1000)) + 1) });
    expect(code.statusCode).toBe(200);
  });

  it('refuses an invitation that was already used and one that has expired', async () => {
    const made = await invite('once@example.org');
    const link = tokenFrom(made.body.link);
    expect((await accept(link)).statusCode).toBe(200);
    expect((await accept(link)).statusCode).toBe(400);
    const late = await invite('late@example.org');
    await t.db.pool.query(`UPDATE auth_invitation SET expires_at = now() - interval '1 minute' WHERE user_id = $1`, [late.body.userId]);
    expect((await accept(tokenFrom(late.body.link))).statusCode).toBe(400);
  });

  it('ends an account\'s sign-ins when an administrator reissues its link, and the account must set up again', async () => {
    const acc = await onboarded('reissue@example.org');
    const first = await t.anonymous('POST', '/auth/sign-in', { email: 'reissue@example.org', password: PASSWORD });
    const challenge = json(first);
    const signedIn = await t.anonymous('POST', '/auth/mfa', { challengeToken: challenge.challengeToken, code: codeAt(acc.secret, stepAt(Math.floor(Date.now() / 1000)) + 1) });
    expect(signedIn.statusCode).toBe(200);
    const cookie = String((signedIn.headers['set-cookie'] as string).split(';')[0]);
    const reissued = await t.call({ method: 'POST', url: `/accounts/${acc.id}/invitation`, roles: ['admin'] });
    expect(reissued.status).toBe(201);
    expect((await t.app.inject({ method: 'POST', url: '/auth/refresh', headers: { cookie } })).statusCode).toBe(401);
    const again = json(await accept(tokenFrom(reissued.body.link), 'another uncommon phrase'));
    expect(again.secret).toBeDefined();
    expect((await t.anonymous('POST', '/auth/sign-in', { email: 'reissue@example.org', password: 'another uncommon phrase' })).statusCode).toBe(401);
  });

  it('replaces an account\'s roles, and refuses an unknown one', async () => {
    const acc = await onboarded('roles@example.org', ['reporter']);
    const changed = await t.call({ method: 'PUT', url: `/accounts/${acc.id}/roles`, roles: ['admin'], body: { roleKeys: ['copy_editor'] } });
    expect(changed.status).toBe(200);
    expect(changed.body.roleKeys).toEqual(['copy_editor']);
    expect((await t.call({ method: 'PUT', url: `/accounts/${acc.id}/roles`, roles: ['admin'], body: { roleKeys: ['bogus'] } })).status).toBe(400);
  });

  it('turns an account off, which ends its sign-ins and stops it signing in, and turns it on again', async () => {
    const acc = await onboarded('onoff@example.org');
    const off = await t.call({ method: 'PUT', url: `/accounts/${acc.id}/status`, roles: ['admin'], body: { status: 'disabled' } });
    expect(off.body.status).toBe('disabled');
    expect((await signIn('onoff@example.org')).statusCode).toBe(401);
    const on = await t.call({ method: 'PUT', url: `/accounts/${acc.id}/status`, roles: ['admin'], body: { status: 'active' } });
    expect(on.body.status).toBe('active');
    expect((await signIn('onoff@example.org')).statusCode).toBe(200);
  });

  it('refuses an access token that was issued before the account was turned off', async () => {
    const acc = await onboarded('live-off@example.org');
    const challenge = json(await t.anonymous('POST', '/auth/sign-in', { email: 'live-off@example.org', password: PASSWORD }) as any);
    const signedIn = await t.anonymous('POST', '/auth/mfa', { challengeToken: challenge.challengeToken, code: codeAt(acc.secret, stepAt(Math.floor(Date.now() / 1000)) + 1) });
    const token = json(signedIn).accessToken as string;
    const before = await t.app.inject({ method: 'GET', url: '/news', headers: { authorization: 'Bearer ' + token } });
    expect(before.statusCode).toBe(200);
    await t.call({ method: 'PUT', url: `/accounts/${acc.id}/status`, roles: ['admin'], body: { status: 'disabled' } });
    const after = await t.app.inject({ method: 'GET', url: '/news', headers: { authorization: 'Bearer ' + token } });
    expect(after.statusCode).toBe(401);
  });

  it('refuses to turn on an account that has not finished setting up', async () => {
    const made = await invite('unfinished@example.org');
    const res = await t.call({ method: 'PUT', url: `/accounts/${made.body.userId}/status`, roles: ['admin'], body: { status: 'active' } });
    expect(res.status).toBe(409);
  });

  it('writes an audit event for each change', async () => {
    const actions = await t.db.pool.query(
      `SELECT DISTINCT action FROM audit_event WHERE action LIKE 'account.%' OR action LIKE 'auth.%' ORDER BY action`);
    const names = actions.rows.map((r) => r.action);
    for (const expected of ['account.invite', 'account.invitation_accepted', 'account.mfa_confirmed', 'account.roles', 'account.disabled', 'account.enabled']) {
      expect(names).toContain(expected);
    }
  });
});
