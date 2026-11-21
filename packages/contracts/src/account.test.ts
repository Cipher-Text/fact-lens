import { describe, expect, it } from 'vitest';
import {
  accountRolesSchema, emailSchema, invitationAcceptSchema, invitationCreateSchema, mfaCodeSchema, passwordChangeSchema, passwordSchema,
  recoveryCodeSchema, signInResultSchema, signInSchema,
} from './account';

describe('account contracts', () => {
  it('requires a password of at least twelve characters', () => {
    expect(passwordSchema.safeParse('a'.repeat(11)).success).toBe(false);
    expect(passwordSchema.safeParse('a'.repeat(12)).success).toBe(true);
    expect(passwordSchema.safeParse('a'.repeat(257)).success).toBe(false);
  });

  it('normalises email addresses and rejects malformed ones', () => {
    expect(emailSchema.parse('  Editor@Example.ORG ')).toBe('editor@example.org');
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });

  it('accepts only six-digit codes and two-group recovery codes', () => {
    expect(mfaCodeSchema.safeParse('123456').success).toBe(true);
    expect(mfaCodeSchema.safeParse('12345').success).toBe(false);
    expect(mfaCodeSchema.safeParse('12345a').success).toBe(false);
    expect(recoveryCodeSchema.parse('AB12-cd34')).toBe('ab12-cd34');
    expect(recoveryCodeSchema.safeParse('ab12cd34').success).toBe(false);
  });

  it('refuses unknown fields in a sign-in request', () => {
    expect(signInSchema.safeParse({ email: 'a@b.co', password: 'x', role: 'admin' }).success).toBe(false);
  });

  it('describes both sign-in results and never carries a refresh token', () => {
    const signedIn = signInResultSchema.parse({
      status: 'signed_in', accessToken: 'tok', accessExpiresAt: '2026-11-22T10:15:00Z', sessionExpiresAt: '2026-11-22T18:00:00Z',
    });
    expect(signedIn).not.toHaveProperty('refreshToken');
    const challenge = signInResultSchema.parse({ status: 'mfa_required', challengeToken: 'c', expiresAt: '2026-11-22T10:05:00Z' });
    expect(challenge.status).toBe('mfa_required');
    expect(signInResultSchema.safeParse({ status: 'other' }).success).toBe(false);
  });

  it('requires a new password to differ from the current one', () => {
    const same = 'correct horse battery';
    expect(passwordChangeSchema.safeParse({ currentPassword: same, newPassword: same }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: same, newPassword: 'another long phrase' }).success).toBe(true);
  });

  it('needs at least one role for an invitation, each role once', () => {
    const base = { email: 'new@example.org', displayName: 'New Editor' };
    expect(invitationCreateSchema.safeParse({ ...base, roleKeys: [] }).success).toBe(false);
    expect(invitationCreateSchema.safeParse({ ...base, roleKeys: ['desk_editor', 'desk_editor'] }).success).toBe(false);
    expect(invitationCreateSchema.safeParse({ ...base, roleKeys: ['desk_editor'] }).success).toBe(true);
    expect(accountRolesSchema.safeParse({ roleKeys: ['Admin'] }).success).toBe(false);
  });

  it('checks the invitation token length and the new password', () => {
    expect(invitationAcceptSchema.safeParse({ token: 'short', password: 'correct horse battery' }).success).toBe(false);
    expect(invitationAcceptSchema.safeParse({ token: 'x'.repeat(40), password: 'correct horse battery' }).success).toBe(true);
  });
});
