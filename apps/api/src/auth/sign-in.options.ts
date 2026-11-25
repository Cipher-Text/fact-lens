import type { jwtVerify, SignJWT } from 'jose';

/** The private key that signs the tokens the backend issues, as jose takes it. */
export type SigningKey = Parameters<SignJWT['sign']>[0];
/** The public key that checks them. */
export type VerifyKey = Parameters<typeof jwtVerify>[1];

/**
 * Settings for sign-in inside the backend (ADR-046, step A4). They come from the environment (step A6). With no keys
 * configured the sign-in endpoints answer 503, so an unconfigured server never signs anyone in.
 */
export interface SignInOptions {
  privateKey: SigningKey;
  publicKey: VerifyKey;
  /** The issuer and audience written into every token. The same values the token verifier expects. */
  issuer: string;
  audience: string;
  /** The 32-byte key that encrypts TOTP secrets at rest. */
  encryptionKey: Buffer;
  /** Marks the refresh cookie Secure. On in production, where the site runs over HTTPS. */
  secureCookies: boolean;
  /** The newsroom address invitation links point to, for example https://newsroom.example.org (no trailing slash). */
  newsroomUrl: string;
  /** Sign-in attempts from one address per minute. Defaults to ATTEMPTS_PER_MINUTE. */
  attemptsPerMinute?: number;
  /** Development only (ADR-064): the dev sign-in endpoints work. Off, they answer 404. Refused in production by the environment check. */
  devQuickLogin?: boolean;
}

export const SIGNIN_OPTIONS = Symbol('SIGNIN_OPTIONS');

/** The lifetime of a sign-in and of the code step (docs/plans/auth-in-app.md, the defaults). */
export const SESSION_SECONDS = 8 * 3600;
export const CHALLENGE_SECONDS = 5 * 60;
export const LOCK_AFTER_FAILURES = 5;
export const LOCK_SECONDS = 15 * 60;
/** Sign-in attempts from one address in one minute, across the sign-in endpoints. */
export const ATTEMPTS_PER_MINUTE = 20;

export const REFRESH_COOKIE = 'fl_refresh';

/** Only accounts on this reserved address can be signed in without a password (ADR-064). `.test` never resolves on the internet. */
export const DEV_ACCOUNT_DOMAIN = 'dev.factlens.test';
