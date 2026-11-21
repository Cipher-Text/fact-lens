import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { hashPassword, verifyAgainstDummy, verifyPassword } from './credentials';
import { base32Decode, base32Encode, codeAt, newSecret, otpauthUrl, stepAt, verifyCode } from './totp';
import { createTokenVerifier } from './token-verifier';
import { decryptSecret, encryptSecret, hashRefreshToken, issueAccessToken, newRefreshToken } from './tokens';

describe('password hashing (Argon2id)', () => {
  it('accepts the right password and refuses a wrong one', async () => {
    const stored = await hashPassword('correct horse battery');
    expect(stored.startsWith('argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('correct horse batter', stored)).toBe(false);
  });

  it('salts each hash, so equal passwords store different values', async () => {
    const a = await hashPassword('same password here');
    const b = await hashPassword('same password here');
    expect(a).not.toBe(b);
  });

  it('treats a malformed stored value as a failed check, not an error', async () => {
    expect(await verifyPassword('anything at all', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('anything at all', 'argon2id$v=19$m=x$$')).toBe(false);
  });

  it('answers false for the dummy check, so a missing account takes the same time', async () => {
    expect(await verifyAgainstDummy('whatever password')).toBe(false);
  });
});

describe('authenticator codes (TOTP, RFC 6238)', () => {
  // The RFC's test secret (ASCII "12345678901234567890") in base32.
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  it('reproduces the RFC 6238 SHA-1 test vectors (their last six digits)', () => {
    expect(codeAt(rfcSecret, stepAt(59))).toBe('287082');
    expect(codeAt(rfcSecret, stepAt(1111111109))).toBe('081804');
    expect(codeAt(rfcSecret, stepAt(2000000000))).toBe('279037');
  });

  it('accepts a code for the current step and one step either side, and reports the step', () => {
    const now = 1111111109;
    const step = stepAt(now);
    expect(verifyCode(rfcSecret, codeAt(rfcSecret, step), now, null)).toBe(step);
    expect(verifyCode(rfcSecret, codeAt(rfcSecret, step - 1), now, null)).toBe(step - 1);
    expect(verifyCode(rfcSecret, codeAt(rfcSecret, step + 2), now, null)).toBeNull();
  });

  it('refuses a code whose step was already used, so a code cannot be replayed', () => {
    const now = 1111111109;
    const step = stepAt(now);
    const code = codeAt(rfcSecret, step);
    expect(verifyCode(rfcSecret, code, now, step)).toBeNull();
    expect(verifyCode(rfcSecret, code, now, step - 1)).toBe(step);
  });

  it('refuses anything that is not six digits', () => {
    expect(verifyCode(rfcSecret, '12345', 59, null)).toBeNull();
    expect(verifyCode(rfcSecret, '28708a', 59, null)).toBeNull();
  });

  it('round-trips base32 and makes a new secret of the right shape', () => {
    const bytes = randomBytes(20);
    expect(base32Decode(base32Encode(bytes)).equals(bytes)).toBe(true);
    expect(newSecret()).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('builds an otpauth address an authenticator app can read', () => {
    const url = otpauthUrl(rfcSecret, 'editor@example.org', 'Fact Lens');
    expect(url.startsWith('otpauth://totp/Fact%20Lens%3Aeditor%40example.org?')).toBe(true);
    expect(url).toContain('secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(url).toContain('digits=6');
    expect(url).toContain('period=30');
  });
});

describe('access tokens and refresh tokens', () => {
  const issuer = 'https://api.test/';
  const audience = 'fact-lens-api';

  it('signs an access token the existing verifier accepts, with roles and the second factor', async () => {
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const verifier = createTokenVerifier({
      issuer, audience, keys: createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: 'ES256' }] }),
    });
    const now = Math.floor(Date.now() / 1000);
    const { token, expiresAt } = await issueAccessToken({
      key: privateKey, issuer, audience, subject: 'user-1', roles: ['desk_editor'], mfa: true, sessionEndsAt: Date.now() + 8 * 3600_000, now,
    });
    const payload = await verifier.verify(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.roles).toEqual(['desk_editor']);
    expect(payload.amr).toEqual(['pwd', 'mfa']);
    expect(expiresAt).toBe((now + 15 * 60) * 1000);
  });

  it('never lets an access token outlive the sign-in it belongs to', async () => {
    const { privateKey } = await generateKeyPair('ES256');
    const now = Math.floor(Date.now() / 1000);
    const { expiresAt } = await issueAccessToken({
      key: privateKey, issuer, audience, subject: 'user-1', roles: [], mfa: false, sessionEndsAt: (now + 120) * 1000, now,
    });
    expect(expiresAt).toBe((now + 120) * 1000);
  });

  it('issues refresh tokens that are long, random and stored only as a hash', () => {
    const a = newRefreshToken();
    const b = newRefreshToken();
    expect(a.token.length).toBeGreaterThanOrEqual(40);
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashRefreshToken(a.token));
    expect(a.hash).not.toContain(a.token);
  });

  it('encrypts a TOTP secret, decrypts it back, and refuses a changed or wrong-key value', () => {
    const key = randomBytes(32);
    const plain = Buffer.from(newSecret(), 'utf8');
    const stored = encryptSecret(plain, key);
    expect(stored.includes(plain)).toBe(false);
    expect(decryptSecret(stored, key).equals(plain)).toBe(true);
    const changed = Buffer.from(stored);
    changed[changed.length - 1] ^= 1;
    expect(() => decryptSecret(changed, key)).toThrow();
    expect(() => decryptSecret(stored, randomBytes(32))).toThrow();
    expect(() => encryptSecret(plain, randomBytes(16))).toThrow();
  });
});
