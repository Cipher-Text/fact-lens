import { createHash } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';

/**
 * Cookies carry encrypted, authenticated JWTs (direct A256GCM), so the browser cannot read or change them. The session
 * cookie holds the API's access token and the refresh token; the flow cookie holds the short-lived values of a sign-in
 * step. Each has its own audience, so one cannot stand in for the other (ADR-046, step A7).
 */

export interface Session {
  /** The account id, read from the access token when the sign-in starts. */
  sub: string;
  accessToken: string;
  /** Epoch seconds: when the access token expires. The newsroom refreshes it before then. */
  expiresAt: number;
  /** Epoch seconds: when the sign-in itself ends (eight hours after it started). */
  sessionExpiresAt: number;
  /** Single use. Kept here, encrypted, so the browser never holds it; the newsroom's server sends it to the API. */
  refreshToken: string;
}

/** The values of one step of sign-in. Each step sets only the fields it needs. */
export interface SignInFlow {
  returnTo: string;
  /** The password step has passed: a code is needed. */
  challengeToken?: string;
  /** Invitation: the setup token, and the secret to enter into the authenticator app. */
  enrolmentToken?: string;
  secret?: string;
  otpauthUrl?: string;
  /** Recovery codes shown once, after the authenticator app is confirmed. */
  recoveryCodes?: string[];
}

const keyFor = (secret: string) => createHash('sha256').update(secret).digest();

async function seal(audience: string, claims: Record<string, unknown>, secret: string, ttlSeconds: number): Promise<string> {
  return new EncryptJWT(claims)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${Math.max(1, Math.floor(ttlSeconds))}s`)
    .encrypt(keyFor(secret));
}

async function open(audience: string, token: string | undefined, secret: string): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, keyFor(secret), { audience, contentEncryptionAlgorithms: ['A256GCM'], keyManagementAlgorithms: ['dir'] });
    return payload;
  } catch {
    return null;
  }
}

/** The session cookie lives exactly as long as the sign-in does. */
export const sealSession = (session: Session, secret: string, now = Date.now()) =>
  seal('session', { s: session }, secret, session.sessionExpiresAt - Math.floor(now / 1000));

/** Reads the session without checking its expiry: the middleware uses this to find out whether it can refresh it. */
export async function readSession(token: string | undefined, secret: string): Promise<Session | null> {
  const payload = await open('session', token, secret);
  const s = payload?.s as Session | undefined;
  if (!s || typeof s.sub !== 'string' || typeof s.accessToken !== 'string' || typeof s.refreshToken !== 'string'
    || typeof s.expiresAt !== 'number' || typeof s.sessionExpiresAt !== 'number') return null;
  return s;
}

/** The session, if the sign-in has not ended. The access token may need refreshing; see the middleware. */
export async function openSession(token: string | undefined, secret: string, now = Date.now()): Promise<Session | null> {
  const s = await readSession(token, secret);
  return s && s.sessionExpiresAt * 1000 > now ? s : null;
}

export const sealSignInFlow = (flow: SignInFlow, secret: string, ttlSeconds = 600) => seal('signin-flow', { f: flow }, secret, ttlSeconds);

export async function openSignInFlow(token: string | undefined, secret: string): Promise<SignInFlow | null> {
  const payload = await open('signin-flow', token, secret);
  const f = payload?.f as SignInFlow | undefined;
  return f && typeof f.returnTo === 'string' ? f : null;
}

/** Browsers drop cookies over about 4 KB; leave room for the name and attributes. */
export const MAX_COOKIE_VALUE = 3600;

/** Only a path inside this app is a safe place to send the user back to. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\r\n]/.test(value)) return '/';
  if (value.startsWith('/sign-in') || value.startsWith('/auth/') || value.startsWith('/api/')) return '/';
  return value;
}

export const cookieNames = (secure: boolean) =>
  secure ? { session: '__Host-nr_session', flow: '__Host-nr_signin' } : { session: 'nr_session', flow: 'nr_signin' };
