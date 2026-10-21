import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';

/**
 * A fake OpenID Connect provider (authorization code + PKCE) so the newsroom can be used and
 * tested without a real identity provider. It signs anyone in who clicks a name. It must never
 * run in production: it refuses to start there and only listens on the loopback interface.
 */

export interface DevUser {
  sub: string;
  name: string;
  roles: string[];
}

export interface DevIdpOptions {
  port?: number;
  clientId?: string;
  /** Redirect URIs the client may use; anything else is refused. */
  redirectUris: string[];
  /** Audience of the access token, which the API checks (OIDC_AUDIENCE). */
  apiAudience?: string;
  users?: DevUser[];
  accessTokenSeconds?: number;
}

export const defaultUsers: DevUser[] = [
  'reporter', 'desk_editor', 'copy_editor', 'fact_checker', 'managing_editor', 'media_editor', 'analyst', 'admin',
].map((role) => ({
  sub: `dev-${role}`,
  name: role.split('_').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' '),
  roles: [role],
}));

interface Pending {
  clientId: string;
  redirectUri: string;
  challenge: string;
  nonce: string | null;
  state: string | null;
  scope: string;
  expires: number;
  user?: DevUser;
  mfa?: boolean;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const b64url = (b: Buffer) => b.toString('base64url');

async function readForm(req: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 64 * 1024) throw new Error('body too large');
    chunks.push(chunk as Buffer);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString());
}

export async function createDevIdp(opts: DevIdpOptions): Promise<{ server: Server; issuer: string; close: () => Promise<void> }> {
  if (process.env.NODE_ENV === 'production') throw new Error('The dev identity provider must not run in production');

  const clientId = opts.clientId ?? 'newsroom';
  const audience = opts.apiAudience ?? 'fact-lens-api';
  const users = opts.users ?? defaultUsers;
  const ttl = opts.accessTokenSeconds ?? 3600;
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk: JWK = { ...(await exportJWK(publicKey)), alg: 'ES256', use: 'sig', kid: 'dev-1' };
  const requests = new Map<string, Pending>(); // keyed by request id shown in the login form
  const codes = new Map<string, Pending>();
  let issuer = '';

  const sign = (claims: Record<string, unknown>, aud: string, sub: string, key: CryptoKey) =>
    new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'dev-1' }).setIssuer(issuer).setAudience(aud).setSubject(sub)
      .setIssuedAt().setExpirationTime(`${ttl}s`).sign(key);

  const send = (res: ServerResponse, status: number, body: string, type = 'text/html; charset=utf-8', extra: Record<string, string> = {}) => {
    res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', ...extra }).end(body);
  };
  const json = (res: ServerResponse, status: number, body: unknown) => send(res, status, JSON.stringify(body), 'application/json');
  const redirect = (res: ServerResponse, to: string) => res.writeHead(302, { location: to, 'cache-control': 'no-store' }).end();
  const oauthError = (redirectUri: string, state: string | null, error: string) => {
    const u = new URL(redirectUri);
    u.searchParams.set('error', error);
    if (state) u.searchParams.set('state', state);
    return u.toString();
  };

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', issuer || 'http://localhost');

      if (req.method === 'GET' && url.pathname === '/.well-known/openid-configuration') {
        return json(res, 200, {
          issuer,
          authorization_endpoint: `${issuer}/authorize`,
          token_endpoint: `${issuer}/token`,
          jwks_uri: `${issuer}/jwks.json`,
          end_session_endpoint: `${issuer}/logout`,
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['ES256'],
          code_challenge_methods_supported: ['S256'],
          token_endpoint_auth_methods_supported: ['none'],
          scopes_supported: ['openid', 'profile'],
          claims_supported: ['sub', 'name', 'roles', 'amr'],
        });
      }
      if (req.method === 'GET' && url.pathname === '/jwks.json') return json(res, 200, { keys: [jwk] });

      if (req.method === 'GET' && url.pathname === '/authorize') {
        const q = url.searchParams;
        const redirectUri = q.get('redirect_uri') ?? '';
        // Without a trusted redirect target an error must not be redirected anywhere.
        if (q.get('client_id') !== clientId || !opts.redirectUris.includes(redirectUri)) return send(res, 400, 'Unknown client or redirect_uri');
        const state = q.get('state');
        if (q.get('response_type') !== 'code') return redirect(res, oauthError(redirectUri, state, 'unsupported_response_type'));
        const challenge = q.get('code_challenge');
        if (!challenge || q.get('code_challenge_method') !== 'S256') return redirect(res, oauthError(redirectUri, state, 'invalid_request'));
        const id = b64url(randomBytes(16));
        requests.set(id, {
          clientId, redirectUri, challenge, nonce: q.get('nonce'), state, scope: q.get('scope') ?? 'openid', expires: Date.now() + 10 * 60_000,
        });
        const buttons = users.map((u, i) =>
          `<button name="user" value="${i}" type="submit">${esc(u.name)} <small>${esc(u.roles.join(', '))}</small></button>`).join('');
        return send(res, 200, `<!doctype html><meta charset="utf-8"><title>Dev sign-in</title>
<style>body{font:16px system-ui;max-width:28rem;margin:3rem auto;padding:0 1rem}button{display:block;width:100%;margin:.4rem 0;padding:.7rem;font:inherit;text-align:left;cursor:pointer}small{color:#666}.warn{background:#fff3cd;padding:.6rem;border-radius:.3rem}</style>
<h1>Dev sign-in</h1><p class="warn">Fake identity provider for local development. Choose who to sign in as.</p>
<form method="post" action="/authorize"><input type="hidden" name="request" value="${esc(id)}">
<label><input type="checkbox" name="mfa" value="1" checked> Signed in with a second factor (MFA)</label>${buttons}</form>`);
      }

      if (req.method === 'POST' && url.pathname === '/authorize') {
        const form = await readForm(req);
        const pending = requests.get(form.get('request') ?? '');
        const user = users[Number(form.get('user'))];
        if (!pending || pending.expires < Date.now() || !user) return send(res, 400, 'Sign-in request expired. Start again.');
        requests.delete(form.get('request')!);
        const code = b64url(randomBytes(24));
        codes.set(code, { ...pending, user, mfa: form.get('mfa') === '1', expires: Date.now() + 60_000 });
        const to = new URL(pending.redirectUri);
        to.searchParams.set('code', code);
        if (pending.state) to.searchParams.set('state', pending.state);
        to.searchParams.set('iss', issuer);
        return redirect(res, to.toString());
      }

      if (req.method === 'POST' && url.pathname === '/token') {
        const form = await readForm(req);
        const fail = (error: string, status = 400) => json(res, status, { error });
        if (form.get('grant_type') !== 'authorization_code') return fail('unsupported_grant_type');
        const entry = codes.get(form.get('code') ?? '');
        codes.delete(form.get('code') ?? ''); // a code works once, even when the exchange then fails
        if (!entry || entry.expires < Date.now()) return fail('invalid_grant');
        if (form.get('client_id') !== entry.clientId || form.get('redirect_uri') !== entry.redirectUri) return fail('invalid_grant');
        const verifier = form.get('code_verifier') ?? '';
        const expected = Buffer.from(entry.challenge);
        const actual = Buffer.from(b64url(createHash('sha256').update(verifier).digest()));
        if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return fail('invalid_grant');

        const user = entry.user!;
        const amr = entry.mfa ? ['pwd', 'mfa'] : ['pwd'];
        const [idToken, accessToken] = await Promise.all([
          sign({ name: user.name, ...(entry.nonce ? { nonce: entry.nonce } : {}), amr }, entry.clientId, user.sub, privateKey),
          sign({ name: user.name, roles: user.roles, amr }, audience, user.sub, privateKey),
        ]);
        return json(res, 200, { token_type: 'Bearer', access_token: accessToken, id_token: idToken, expires_in: ttl, scope: entry.scope });
      }

      if (req.method === 'GET' && url.pathname === '/logout') {
        const to = url.searchParams.get('post_logout_redirect_uri');
        if (to && opts.redirectUris.some((r) => new URL(r).origin === new URL(to).origin)) return redirect(res, to);
        return send(res, 200, '<!doctype html><meta charset="utf-8"><p>Signed out of the dev identity provider.</p>');
      }

      send(res, 404, 'Not found');
    } catch (err) {
      send(res, 500, err instanceof Error ? err.message : 'error');
    }
  });

  await new Promise<void>((resolve) => server.listen(opts.port ?? 0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { server, issuer, close: () => new Promise((resolve) => server.close(() => resolve())) };
}
