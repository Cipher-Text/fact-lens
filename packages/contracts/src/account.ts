import { z } from 'zod';

/**
 * Sign-in and account administration inside the backend (ADR-046, docs/plans/auth-in-app.md, step A2). The refresh token
 * never appears in these bodies: it travels only in an HTTP-only cookie. The access token is short lived.
 */

/** A password: at least 12 characters (the length rule of ADR-046). The common-password check runs in the API. */
export const passwordSchema = z.string().min(12, 'at least 12 characters').max(256, 'at most 256 characters');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('an email address'));

/** A one-time authenticator-app code: six digits. */
export const mfaCodeSchema = z.string().regex(/^\d{6}$/, 'six digits');

/** A recovery code: eight letters and digits in two groups of four, for example ab12-cd34. */
export const recoveryCodeSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]{4}-[a-z0-9]{4}$/, 'two groups of four letters and digits');

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1).max(256) }).strict();
export type SignIn = z.infer<typeof signInSchema>;

/** The result of the password step: either the sign-in is complete, or a code is needed (the challenge lasts a few minutes). */
export const signedInSchema = z.object({
  status: z.literal('signed_in'),
  accessToken: z.string().min(1),
  accessExpiresAt: z.iso.datetime({ offset: true }),
  /** When the sign-in itself ends (8 hours after it started). */
  sessionExpiresAt: z.iso.datetime({ offset: true }),
});
export const mfaRequiredSchema = z.object({
  status: z.literal('mfa_required'),
  challengeToken: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }),
});
export const signInResultSchema = z.discriminatedUnion('status', [signedInSchema, mfaRequiredSchema]);
export type SignInResult = z.infer<typeof signInResultSchema>;
export type SignedIn = z.infer<typeof signedInSchema>;

export const mfaVerifySchema = z.object({ challengeToken: z.string().min(1).max(512), code: mfaCodeSchema }).strict();
export const recoverySignInSchema = z.object({ challengeToken: z.string().min(1).max(512), recoveryCode: recoveryCodeSchema }).strict();
export type MfaVerify = z.infer<typeof mfaVerifySchema>;

/** Confirming a new authenticator app: the first code proves it was set up. The response carries the recovery codes, once. */
export const mfaConfirmSchema = z.object({ code: mfaCodeSchema }).strict();
export const recoveryCodesSchema = z.object({ recoveryCodes: z.array(recoveryCodeSchema).length(10) });
export type RecoveryCodes = z.infer<typeof recoveryCodesSchema>;

export const mfaEnrolmentSchema = z.object({
  /** The secret as a base32 string, for the authenticator app (also shown as a QR code by the newsroom). */
  secret: z.string().min(16),
  otpauthUrl: z.string().startsWith('otpauth://'),
});
export type MfaEnrolment = z.infer<typeof mfaEnrolmentSchema>;

export const passwordChangeSchema = z
  .object({ currentPassword: z.string().min(1).max(256), newPassword: passwordSchema })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, { message: 'the new password must differ', path: ['newPassword'] });
export type PasswordChange = z.infer<typeof passwordChangeSchema>;

/** A role key as stored in app_role (lowercase, letters, digits, underscores). */
export const roleKeySchema = z.string().regex(/^[a-z][a-z0-9_]*$/).max(64);

export const invitationCreateSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().min(1).max(200),
    roleKeys: z.array(roleKeySchema).min(1).max(20).refine((k) => new Set(k).size === k.length, 'each role once'),
  })
  .strict();
export type InvitationCreate = z.infer<typeof invitationCreateSchema>;

/** The one-time link is returned once, when the invitation is created. */
export const invitationSchema = z.object({
  userId: z.uuid(),
  expiresAt: z.iso.datetime({ offset: true }),
  /** The link to pass on, containing the one-time token. Shown once. */
  link: z.string().url(),
});
export type Invitation = z.infer<typeof invitationSchema>;

export const invitationAcceptSchema = z.object({ token: z.string().min(20).max(256), password: passwordSchema }).strict();
export type InvitationAccept = z.infer<typeof invitationAcceptSchema>;

export const accountStatuses = ['invited', 'active', 'disabled'] as const;

/** An account as an administrator sees it. Never includes a password, a secret or a code. */
export const accountSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  displayName: z.string(),
  status: z.enum(accountStatuses),
  roleKeys: z.array(roleKeySchema),
  mfaConfirmed: z.boolean(),
  lockedUntil: z.iso.datetime({ offset: true }).nullable(),
  lastSignInAt: z.iso.datetime({ offset: true }).nullable(),
});
export type Account = z.infer<typeof accountSchema>;

export const accountRolesSchema = z.object({ roleKeys: z.array(roleKeySchema).max(20).refine((k) => new Set(k).size === k.length, 'each role once') }).strict();
export type AccountRoles = z.infer<typeof accountRolesSchema>;
