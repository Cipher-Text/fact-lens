import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { decodeJwt } from 'jose';
import { createDevIdp } from '@fact-lens/dev-idp';
import type { NewsroomEnv } from '@fact-lens/config';
import { endSessionUrl, finishLogin, startLogin } from './oidc';

describe('OIDC sign-in against the dev identity provider', () => {
  let idp: Awaited<ReturnType<typeof createDevIdp>>;
  let env: NewsroomEnv;

  beforeAll(async () => {
    idp = await createDevIdp({ redirectUris: ['http://localhost:3100/auth/callback'], apiAudience: 'fact-lens-api' });
    env = {
      NODE_ENV: 'test', NEWSROOM_BASE_URL: 'http://localhost:3100', API_BASE_URL: 'http://localhost:4000', OIDC_ISSUER: idp.issuer,
      OIDC_CLIENT_ID: 'newsroom', OIDC_SCOPE: 'openid profile', SESSION_SECRET: 's'.repeat(32),
    };
  });
  afterAll(() => idp?.close());

  /** Plays the browser: opens the authorization URL, picks a user, follows the redirect. */
  async function signInAs(authorizationUrl: URL, userIndex: number, mfa = true) {
    const page = await fetch(authorizationUrl, { redirect: 'manual' });
    expect(page.status).toBe(200);
    const html = await page.text();
    const requestId = /name="request" value="([^"]+)"/.exec(html)![1]!;
    const submit = await fetch(`${idp.issuer}/authorize`, {
      method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ request: requestId, user: String(userIndex), ...(mfa ? { mfa: '1' } : {}) }),
    });
    expect(submit.status).toBe(302);
    return new URL(submit.headers.get('location')!);
  }

  it('signs a user in and returns their access token and identity', async () => {
    const { url, flow } = await startLogin(env, '/news/abc');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3100/auth/callback');
    expect(flow.returnTo).toBe('/news/abc');

    const callback = await signInAs(url, 4); // managing_editor
    const session = await finishLogin(env, flow, callback.search);
    expect(session).toMatchObject({ sub: 'dev-managing_editor', name: 'Managing Editor' });
    expect(session.expiresAt).toBeGreaterThan(Date.now() / 1000);

    const access = decodeJwt(session.accessToken);
    expect(access).toMatchObject({ iss: idp.issuer, aud: 'fact-lens-api', sub: 'dev-managing_editor', roles: ['managing_editor'], amr: ['pwd', 'mfa'] });
    expect(decodeJwt(session.idToken!)).toMatchObject({ aud: 'newsroom', nonce: flow.nonce });
  });

  it('carries the missing second factor through to the token', async () => {
    const { url, flow } = await startLogin(env, '/');
    const session = await finishLogin(env, flow, (await signInAs(url, 0, false)).search);
    expect(decodeJwt(session.accessToken).amr).toEqual(['pwd']);
  });

  it('rejects a callback with the wrong state, the wrong nonce or a replayed code', async () => {
    const a = await startLogin(env, '/');
    const cb = await signInAs(a.url, 0);
    await expect(finishLogin(env, { ...a.flow, state: 'forged' }, cb.search)).rejects.toThrow();

    const b = await startLogin(env, '/');
    const cbB = await signInAs(b.url, 0);
    await expect(finishLogin(env, { ...b.flow, nonce: 'other-nonce' }, cbB.search)).rejects.toThrow();

    const c = await startLogin(env, '/');
    const cbC = await signInAs(c.url, 0);
    await finishLogin(env, c.flow, cbC.search);
    await expect(finishLogin(env, c.flow, cbC.search)).rejects.toThrow();
  });

  it('rejects an authorization code exchanged with a different PKCE verifier', async () => {
    const a = await startLogin(env, '/');
    const stolen = await signInAs(a.url, 0);
    const b = await startLogin(env, '/');
    await expect(finishLogin(env, { ...b.flow, state: a.flow.state, nonce: a.flow.nonce }, stolen.search)).rejects.toThrow();
  });

  it('rejects an error response from the provider', async () => {
    const { flow } = await startLogin(env, '/');
    await expect(finishLogin(env, flow, `?error=access_denied&state=${flow.state}`)).rejects.toThrow();
  });

  it('refuses authorization requests for an unregistered redirect URI', async () => {
    const { url } = await startLogin(env, '/');
    url.searchParams.set('redirect_uri', 'http://evil.example.com/auth/callback');
    expect((await fetch(url, { redirect: 'manual' })).status).toBe(400);
  });

  it('builds the provider logout URL with the id token hint', async () => {
    const url = await endSessionUrl(env, { sub: 'u', name: null, accessToken: 't', idToken: 'id-token-value', expiresAt: 1 });
    expect(url!.origin).toBe(idp.issuer);
    expect(url!.searchParams.get('id_token_hint')).toBe('id-token-value');
    expect(url!.searchParams.get('post_logout_redirect_uri')).toBe('http://localhost:3100/signed-out');
  });

  it('refuses a plain-http issuer that is not on the loopback interface', async () => {
    await expect(startLogin({ ...env, OIDC_ISSUER: 'http://idp.example.com' }, '/')).rejects.toThrow(/https/);
  });
});
