import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { SignJWT } from 'jose';

/** The private key that signs access tokens, as jose takes it. */
type SigningKey = Parameters<SignJWT['sign']>[0];

/**
 * Tokens and secret encryption for sign-in (ADR-046, docs/plans/auth-in-app.md, step A3).
 *
 * - An access token is a short-lived ES256 JWT the API itself signs. The existing verifier checks it (issuer, audience,
 *   expiry and the roles and amr claims), so the authorization code does not change.
 * - A refresh token is random and single use. Only its SHA-256 hash is stored.
 * - The TOTP secret is encrypted with AES-256-GCM before it is stored.
 */

export const ACCESS_TOKEN_SECONDS = 15 * 60;

export interface AccessTokenInput {
  key: SigningKey;
  issuer: string;
  audience: string;
  subject: string;
  roles: string[];
  /** True once the second factor has been checked in this sign-in. */
  mfa: boolean;
  /** The moment the sign-in itself ends; the token never outlives it. */
  sessionEndsAt: number;
  now?: number;
}

export async function issueAccessToken(input: AccessTokenInput): Promise<{ token: string; expiresAt: number }> {
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const expiresAt = Math.min(now + ACCESS_TOKEN_SECONDS, Math.floor(input.sessionEndsAt / 1000));
  const token = await new SignJWT({ roles: input.roles, amr: input.mfa ? ['pwd', 'mfa'] : ['pwd'] })
    .setProtectedHeader({ alg: 'ES256' })
    .setIssuer(input.issuer)
    .setAudience(input.audience)
    .setSubject(input.subject)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(input.key);
  return { token, expiresAt: expiresAt * 1000 };
}

/** A new refresh token and the hash that is stored in its place. */
export function newRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Encrypts a secret for storage: AES-256-GCM, with a fresh nonce. The output is nonce, tag and ciphertext. */
export function encryptSecret(plain: Buffer, key: Buffer): Buffer {
  if (key.length !== 32) throw new Error('the encryption key must be 32 bytes');
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), body]);
}

/** Decrypts what `encryptSecret` produced. Any change to the stored bytes makes this throw. */
export function decryptSecret(stored: Buffer, key: Buffer): Buffer {
  if (key.length !== 32) throw new Error('the encryption key must be 32 bytes');
  if (stored.length < 12 + 16) throw new Error('the stored secret is too short');
  const decipher = createDecipheriv('aes-256-gcm', key, stored.subarray(0, 12));
  decipher.setAuthTag(stored.subarray(12, 28));
  return Buffer.concat([decipher.update(stored.subarray(28)), decipher.final()]);
}
