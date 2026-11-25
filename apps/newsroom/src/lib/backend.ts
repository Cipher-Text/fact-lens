import 'server-only';
import { createHash } from 'node:crypto';
import { devAccountSchema, type DevAccount } from '@fact-lens/contracts';
import { decodeJwt } from 'jose';
import { getEnv } from './env';
import { API_REFRESH_COOKIE, refreshTokenFromSetCookie } from './refresh-cookie';
import type { Session } from './session';

/**
 * The newsroom's server talks to the API's sign-in endpoints on the private network (ADR-046, step A7). The browser never
 * calls them. The API's refresh cookie is read from its response and kept inside the newsroom's own encrypted session.
 */

export class BackendError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function post(path: string, body: unknown, opts: { ip: string | null; cookie?: string }): Promise<{ data: Record<string, unknown>; response: Response }> {
  let response: Response;
  try {
    response = await fetch(`${getEnv().API_BASE_URL.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        // The API counts attempts per address. Behind the newsroom it sees the newsroom's address, so the editor's is forwarded.
        ...(opts.ip ? { 'x-forwarded-for': opts.ip } : {}),
        ...(opts.cookie ? { cookie: opts.cookie } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new BackendError(502, 'The sign-in service did not answer. Try again in a moment.');
  }
  const data = ((await response.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (!response.ok) {
    const message = (data as { error?: { message?: unknown } }).error?.message;
    throw new BackendError(response.status, typeof message === 'string' ? message : 'Sign-in failed.');
  }
  return { data, response };
}

/** A session from a signed-in answer: its tokens, and the refresh token from the cookie header. */
function sessionFrom(data: Record<string, unknown>, response: Response): Session {
  const refreshToken = refreshTokenFromSetCookie(response.headers.getSetCookie());
  const accessToken = data.accessToken;
  if (typeof accessToken !== 'string' || !refreshToken) throw new BackendError(502, 'The sign-in service sent an incomplete answer.');
  return tokensFrom(accessToken, data, refreshToken);
}

function tokensFrom(accessToken: string, data: Record<string, unknown>, refreshToken: string): Session {
  const sub = decodeJwt(accessToken).sub;
  if (typeof sub !== 'string') throw new BackendError(502, 'The sign-in service sent an unexpected token.');
  return {
    sub,
    accessToken,
    refreshToken,
    expiresAt: Math.floor(Date.parse(String(data.accessExpiresAt)) / 1000),
    sessionExpiresAt: Math.floor(Date.parse(String(data.sessionExpiresAt)) / 1000),
  };
}

/** The password step. Returns the challenge for the code step; a password alone never signs anyone in. */
export async function passwordStep(email: string, password: string, ip: string | null): Promise<{ challengeToken: string }> {
  const { data } = await post('/auth/sign-in', { email, password }, { ip });
  if (data.status !== 'mfa_required' || typeof data.challengeToken !== 'string') {
    throw new BackendError(502, 'The sign-in service sent an unexpected answer.');
  }
  return { challengeToken: data.challengeToken };
}

/** The code step with an authenticator code. */
export async function codeStep(challengeToken: string, code: string, ip: string | null): Promise<Session> {
  const { data, response } = await post('/auth/mfa', { challengeToken, code }, { ip });
  return sessionFrom(data, response);
}

/** Development only (ADR-064): the dev accounts the sign-in page lists. Empty when the API does not offer them. */
export async function devAccounts(): Promise<DevAccount[]> {
  try {
    const response = await fetch(`${getEnv().API_BASE_URL.replace(/\/$/, '')}/auth/dev/users`, {
      headers: { accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return [];
    return devAccountSchema.array().parse(await response.json());
  } catch {
    return [];
  }
}

/** Development only (ADR-064): signs in as a dev account, with no password and no code. */
export async function devSignInStep(email: string, ip: string | null): Promise<Session> {
  const { data, response } = await post('/auth/dev/sign-in', { email }, { ip });
  return sessionFrom(data, response);
}

/** The code step with a recovery code, which works once. */
export async function recoveryStep(challengeToken: string, recoveryCode: string, ip: string | null): Promise<Session> {
  const { data, response } = await post('/auth/mfa/recovery', { challengeToken, recoveryCode }, { ip });
  return sessionFrom(data, response);
}

const RECENT_REFRESHES = new Map<string, { at: number; result: Promise<Session> }>();
const REUSE_WINDOW_MS = 60_000;

/**
 * Refreshes a session. Refresh tokens are single use, so two requests that refresh with the same token at the same moment
 * would look like a copied token and end the sign-in. Requests that share a token therefore share one refresh, within one
 * process. A multi-instance deployment needs a shared store for this (see ADR-047).
 */
export function refreshShared(refreshToken: string, ip: string | null): Promise<Session> {
  const key = createHash('sha256').update(refreshToken).digest('hex');
  const now = Date.now();
  for (const [k, entry] of RECENT_REFRESHES) if (now - entry.at > REUSE_WINDOW_MS) RECENT_REFRESHES.delete(k);
  const recent = RECENT_REFRESHES.get(key);
  if (recent) return recent.result;
  const result = refreshStep(refreshToken, ip);
  RECENT_REFRESHES.set(key, { at: now, result });
  result.catch(() => RECENT_REFRESHES.delete(key));
  return result;
}

async function refreshStep(refreshToken: string, ip: string | null): Promise<Session> {
  const { data, response } = await post('/auth/refresh', {}, { ip, cookie: `${API_REFRESH_COOKIE}=${refreshToken}` });
  return sessionFrom(data, response);
}

/** Ends the sign-in at the API. Safe to call again. */
export async function endSignIn(refreshToken: string | null, ip: string | null): Promise<void> {
  if (!refreshToken) return;
  try {
    await post('/auth/sign-out', {}, { ip, cookie: `${API_REFRESH_COOKIE}=${refreshToken}` });
  } catch {
    // Signing out must still clear the browser's cookie even if the API cannot be reached.
  }
}

export interface AccountSetup {
  secret: string;
  otpauthUrl: string;
  enrolmentToken: string;
}

/** Accepts an invitation: sets the password and returns what the authenticator app needs. */
export async function acceptInvitation(token: string, password: string, ip: string | null): Promise<AccountSetup> {
  const { data } = await post('/auth/invitations/accept', { token, password }, { ip });
  if (typeof data.secret !== 'string' || typeof data.otpauthUrl !== 'string' || typeof data.enrolmentToken !== 'string') {
    throw new BackendError(502, 'The sign-in service sent an incomplete answer.');
  }
  return { secret: data.secret, otpauthUrl: data.otpauthUrl, enrolmentToken: data.enrolmentToken };
}

/** Confirms the authenticator app. Returns the recovery codes, which are shown once. */
export async function confirmSetup(enrolmentToken: string, code: string, ip: string | null): Promise<string[]> {
  const { data } = await post('/auth/invitations/confirm', { enrolmentToken, code }, { ip });
  if (!Array.isArray(data.recoveryCodes) || !data.recoveryCodes.every((c) => typeof c === 'string')) {
    throw new BackendError(502, 'The sign-in service sent an incomplete answer.');
  }
  return data.recoveryCodes as string[];
}
