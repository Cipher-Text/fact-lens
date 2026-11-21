import { createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes } from 'node:crypto';
import type { ApiEnv } from '@fact-lens/config';
import type { SignInOptions } from './sign-in.options';

/**
 * The settings for sign-in inside the backend (ADR-046, step A6): a new ES256 signing key and a new encryption key. The
 * signing key is stored as base64 of its PKCS#8 PEM, so it fits on one line of the environment file.
 */
export function generateAuthSettings(): { AUTH_SIGNING_KEY: string; AUTH_ENCRYPTION_KEY: string } {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
  return { AUTH_SIGNING_KEY: Buffer.from(pem, 'utf8').toString('base64'), AUTH_ENCRYPTION_KEY: randomBytes(32).toString('base64') };
}

/**
 * The sign-in options from the environment, or null when sign-in is not configured. A signing key that is not a valid
 * private key fails here, at startup, rather than on the first sign-in.
 */
export function signInOptionsFromEnv(env: ApiEnv): SignInOptions | null {
  if (!env.AUTH_SIGNING_KEY || !env.AUTH_ENCRYPTION_KEY || !env.AUTH_ISSUER || !env.NEWSROOM_BASE_URL) return null;
  const privateKey = createPrivateKey(Buffer.from(env.AUTH_SIGNING_KEY, 'base64').toString('utf8'));
  return {
    privateKey,
    publicKey: createPublicKey(privateKey),
    issuer: env.AUTH_ISSUER,
    audience: env.AUTH_AUDIENCE,
    encryptionKey: Buffer.from(env.AUTH_ENCRYPTION_KEY, 'base64'),
    secureCookies: env.NODE_ENV === 'production',
    newsroomUrl: env.NEWSROOM_BASE_URL,
  };
}
