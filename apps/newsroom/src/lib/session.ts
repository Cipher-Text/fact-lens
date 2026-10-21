import { createHash } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';

/**
 * Cookies carry encrypted, authenticated JWTs (direct A256GCM). The session cookie holds the
 * access token for the API; the flow cookie holds the one-time OIDC values while the browser is
 * at the identity provider. Each has its own audience, so one cannot stand in for the other.
 */

export interface Session {
  sub: string;
  name: string | null;
  accessToken: string;
  /** Kept for single logout when the cookie stays small enough. */
  idToken?: string;
  /** Epoch seconds; the access token's expiry. */
  expiresAt: number;
}

export interface LoginFlow {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
}

const keyFor = (secret: string) => createHash('sha256').update(secret).digest();

async function seal(audience: string, claims: Record<string, unknown>, secret: string, ttlSeconds: number): Promise<string> {
  return new EncryptJWT(claims)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
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

/** The cookie lives exactly as long as the access token. */
export const sealSession = (session: Session, secret: string, now = Date.now()) =>
  seal('session', { s: session }, secret, Math.max(1, session.expiresAt - Math.floor(now / 1000)));

export async function openSession(token: string | undefined, secret: string, now = Date.now()): Promise<Session | null> {
  const payload = await open('session', token, secret);
  const s = payload?.s as Session | undefined;
  if (!s || typeof s.sub !== 'string' || typeof s.accessToken !== 'string' || typeof s.expiresAt !== 'number') return null;
  return s.expiresAt * 1000 > now ? s : null;
}

export const sealFlow = (flow: LoginFlow, secret: string, ttlSeconds = 600) => seal('oidc-flow', { f: flow }, secret, ttlSeconds);

export async function openFlow(token: string | undefined, secret: string): Promise<LoginFlow | null> {
  const payload = await open('oidc-flow', token, secret);
  const f = payload?.f as LoginFlow | undefined;
  return f && typeof f.state === 'string' && typeof f.nonce === 'string' && typeof f.codeVerifier === 'string' && typeof f.returnTo === 'string' ? f : null;
}

/** Browsers drop cookies over about 4 KB; leave room for the name and attributes. */
export const MAX_COOKIE_VALUE = 3600;

/** Only a path inside this app is a safe place to send the user back to. */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\r\n]/.test(value)) return '/';
  if (value.startsWith('/auth/') || value.startsWith('/api/')) return '/';
  return value;
}

export const cookieNames = (secure: boolean) =>
  secure ? { session: '__Host-nr_session', flow: '__Host-nr_oidc' } : { session: 'nr_session', flow: 'nr_oidc' };
