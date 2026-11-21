import { randomBytes, randomInt } from 'node:crypto';
import {
  BadRequestException, ConflictException, Inject, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';
import type {
  Account, AccountRoles, AccountStatusChange, Invitation, InvitationAccepted, InvitationCreate, RecoveryCodes,
} from '@fact-lens/contracts';
import { jwtVerify, SignJWT } from 'jose';
import type { Pool, PoolClient } from 'pg';
import { AuditService } from '../audit/audit.service';
import type { Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { hashPassword, isCommonPassword } from './credentials';
import { SIGNIN_OPTIONS, type SignInOptions } from './sign-in.options';
import { decryptSecret, encryptSecret, hashRefreshToken } from './tokens';
import { newSecret, otpauthUrl, verifyCode } from './totp';

/** An invitation is good for three days; a setup for the authenticator app, fifteen minutes. */
const INVITATION_HOURS = 72;
const ENROLMENT_SECONDS = 15 * 60;
const RECOVERY_CODES = 10;
/** No look-alike characters: no 0, o, 1, l, i. */
const RECOVERY_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const ISSUER_NAME = 'Fact Lens';

type Db = Pool | PoolClient;

/**
 * Account administration (ADR-046, docs/plans/auth-in-app.md, step A5). An administrator invites people, resets an
 * account's sign-in, sets roles, and turns accounts on or off. A new person accepts the invitation, sets a password,
 * confirms an authenticator app, and only then can sign in. Every change is audited in the same transaction.
 */
@Injectable()
export class AccountsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(SIGNIN_OPTIONS) private readonly options: SignInOptions | null,
  ) {}

  async list(): Promise<Account[]> {
    const { rows } = await this.pool.query<{
      id: string; email: string; display_name: string; status: Account['status']; role_keys: string[];
      mfa_confirmed: boolean; locked_until: Date | null; last_sign_in_at: Date | null;
    }>(
      `SELECT u.id, u.email, u.display_name, u.status,
              COALESCE(array_agg(ur.role_key ORDER BY ur.role_key) FILTER (WHERE ur.role_key IS NOT NULL), '{}') AS role_keys,
              COALESCE(f.confirmed_at IS NOT NULL, false) AS mfa_confirmed, u.locked_until, u.last_sign_in_at
         FROM app_user u
         LEFT JOIN user_role ur ON ur.user_id = u.id
         LEFT JOIN mfa_factor f ON f.user_id = u.id
        GROUP BY u.id, f.confirmed_at
        ORDER BY lower(u.email)`);
    return rows.map((r) => ({
      id: r.id, email: r.email, displayName: r.display_name, status: r.status, roleKeys: r.role_keys, mfaConfirmed: r.mfa_confirmed,
      lockedUntil: r.locked_until?.toISOString() ?? null, lastSignInAt: r.last_sign_in_at?.toISOString() ?? null,
    }));
  }

  /** Creates an account in the invited state with its roles, and returns the one-time link to pass on. */
  async invite(input: InvitationCreate, actor: Actor): Promise<Invitation> {
    const opts = this.configured();
    const token = randomBytes(32).toString('base64url');
    const result = await withTransaction(this.pool, async (db) => {
      const taken = await db.query('SELECT 1 FROM app_user WHERE lower(email) = lower($1)', [input.email]);
      if (taken.rows[0]) throw new ConflictException({ message: 'That email address already has an account.', reason: 'email_taken' });
      const user = await db.query<{ id: string }>(
        `INSERT INTO app_user (email, display_name) VALUES ($1, $2) RETURNING id`, [input.email, input.displayName]);
      const userId = user.rows[0]!.id;
      await this.setRoleRows(db, userId, input.roleKeys);
      const expiry = await this.insertInvitation(db, userId, token, actor);
      await this.audit.record({
        actorType: 'human', actorId: actor.principal.subject, action: 'account.invite', objectType: 'account', objectId: userId,
        requestId: actor.requestId, metadata: { roles: input.roleKeys },
      }, db);
      return { userId, expiresAt: expiry };
    });
    return { userId: result.userId, expiresAt: result.expiresAt.toISOString(), link: this.linkFor(opts, token) };
  }

  /** A new link for an account, for someone who forgot a password or lost the authenticator app. Earlier links stop working. */
  async reissue(userId: string, actor: Actor): Promise<Invitation> {
    const opts = this.configured();
    const token = await withTransaction(this.pool, async (db) => {
      const user = await db.query<{ id: string }>('SELECT id FROM app_user WHERE id = $1 AND status <> \'disabled\' FOR UPDATE', [userId]);
      if (!user.rows[0]) throw new NotFoundException('Not found');
      await db.query('UPDATE auth_session SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
      return this.replaceInvitation(db, userId, actor);
    });
    return { userId, expiresAt: token.expiresAt.toISOString(), link: this.linkFor(opts, token.token) };
  }

  /**
   * Accepts an invitation: sets the password and starts the authenticator setup. The account cannot sign in until the
   * setup is confirmed. Existing sessions of the account end.
   */
  async accept(token: string, password: string): Promise<InvitationAccepted> {
    const opts = this.configured();
    if (isCommonPassword(password)) throw new BadRequestException({ message: 'Choose a less common password.', reason: 'common_password' });
    const hash = await hashPassword(password);
    const secret = newSecret();
    const enrolment = await withTransaction(this.pool, async (db) => {
      const { rows } = await db.query<{ id: string; user_id: string; expires_at: Date; used_at: Date | null }>(
        'SELECT id, user_id, expires_at, used_at FROM auth_invitation WHERE token_hash = $1 FOR UPDATE', [hashRefreshToken(token)]);
      const inv = rows[0];
      if (!inv || inv.used_at || inv.expires_at.getTime() <= Date.now()) {
        throw new BadRequestException({ message: 'This invitation is no longer valid. Ask for a new one.', reason: 'invalid_invitation' });
      }
      await db.query('UPDATE auth_invitation SET used_at = now() WHERE id = $1', [inv.id]);
      await db.query(`UPDATE app_user SET password_hash = $2, status = 'invited', failed_sign_ins = 0, locked_until = NULL WHERE id = $1`, [inv.user_id, hash]);
      await db.query('UPDATE auth_session SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [inv.user_id]);
      await db.query(
        `INSERT INTO mfa_factor (user_id, secret_encrypted, confirmed_at) VALUES ($1, $2, NULL)
         ON CONFLICT (user_id) DO UPDATE SET secret_encrypted = EXCLUDED.secret_encrypted, last_used_step = NULL, confirmed_at = NULL`,
        [inv.user_id, encryptSecret(Buffer.from(secret, 'utf8'), opts.encryptionKey)]);
      await this.audit.record({ actorType: 'human', actorId: inv.user_id, action: 'account.invitation_accepted', objectType: 'account', objectId: inv.user_id }, db);
      return inv.user_id;
    });
    const enrolmentToken = await new SignJWT({ purpose: 'enrol' })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer(opts.issuer)
      .setAudience(`${opts.audience}:enrol`)
      .setSubject(enrolment)
      .setIssuedAt()
      .setExpirationTime(`${ENROLMENT_SECONDS}s`)
      .sign(opts.privateKey);
    return {
      secret,
      otpauthUrl: otpauthUrl(secret, await this.emailOf(enrolment), ISSUER_NAME),
      enrolmentToken,
    };
  }

  /**
   * Confirms the authenticator app with its first code. The account becomes active and gets ten recovery codes, shown
   * once. Confirming twice is refused.
   */
  async confirmEnrolment(enrolmentToken: string, code: string): Promise<RecoveryCodes> {
    const opts = this.configured();
    let userId: string;
    try {
      const { payload } = await jwtVerify(enrolmentToken, opts.publicKey, { issuer: opts.issuer, audience: `${opts.audience}:enrol`, algorithms: ['ES256'] });
      if (payload.purpose !== 'enrol' || typeof payload.sub !== 'string') throw new Error('not an enrolment');
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('The setup has expired. Ask for a new invitation.');
    }
    const { rows } = await this.pool.query<{ secret_encrypted: Buffer; confirmed_at: Date | null; last_used_step: string | null; status: string }>(
      `SELECT f.secret_encrypted, f.confirmed_at, f.last_used_step, u.status
         FROM mfa_factor f JOIN app_user u ON u.id = f.user_id WHERE f.user_id = $1`, [userId]);
    const row = rows[0];
    if (!row) throw new UnauthorizedException('The setup has expired. Ask for a new invitation.');
    if (row.confirmed_at) throw new ConflictException({ message: 'The authenticator app is already set up.', reason: 'already_confirmed' });
    const secret = decryptSecret(row.secret_encrypted, opts.encryptionKey).toString('utf8');
    const step = verifyCode(secret, code, Math.floor(Date.now() / 1000), row.last_used_step === null ? null : Number(row.last_used_step));
    if (step === null) throw new UnauthorizedException('The code is not correct.');
    const codes = Array.from({ length: RECOVERY_CODES }, () => newRecoveryCode());
    const hashes = await Promise.all(codes.map((c) => hashPassword(c)));
    await withTransaction(this.pool, async (db) => {
      await db.query('UPDATE mfa_factor SET confirmed_at = now(), last_used_step = $2 WHERE user_id = $1', [userId, step]);
      await db.query(`UPDATE app_user SET status = 'active' WHERE id = $1 AND status = 'invited'`, [userId]);
      await db.query('DELETE FROM mfa_recovery_code WHERE user_id = $1', [userId]);
      for (const hash of hashes) await db.query('INSERT INTO mfa_recovery_code (user_id, code_hash) VALUES ($1, $2)', [userId, hash]);
      await this.audit.record({ actorType: 'human', actorId: userId, action: 'account.mfa_confirmed', objectType: 'account', objectId: userId }, db);
    });
    return { recoveryCodes: codes };
  }

  /** Replaces the roles of an account. The account keeps its sign-in; the next refresh carries the new roles. */
  async setRoles(userId: string, input: AccountRoles, actor: Actor): Promise<Account> {
    await withTransaction(this.pool, async (db) => {
      await this.requireUser(db, userId);
      await this.setRoleRows(db, userId, input.roleKeys);
      await this.audit.record({
        actorType: 'human', actorId: actor.principal.subject, action: 'account.roles', objectType: 'account', objectId: userId,
        requestId: actor.requestId, metadata: { roles: input.roleKeys },
      }, db);
    });
    return this.one(userId);
  }

  /** Turns an account off (ending its sign-ins) or on. An account can be turned on only after its setup is confirmed. */
  async setStatus(userId: string, input: AccountStatusChange, actor: Actor): Promise<Account> {
    await withTransaction(this.pool, async (db) => {
      const user = await this.requireUser(db, userId);
      if (input.status === 'disabled') {
        await db.query(`UPDATE app_user SET status = 'disabled' WHERE id = $1`, [userId]);
        await db.query('UPDATE auth_session SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
      } else {
        const factor = await db.query('SELECT 1 FROM mfa_factor WHERE user_id = $1 AND confirmed_at IS NOT NULL', [userId]);
        if (!user.password_hash || !factor.rows[0]) {
          throw new ConflictException({ message: 'This account has not finished setting up.', reason: 'not_ready' });
        }
        await db.query(`UPDATE app_user SET status = 'active', failed_sign_ins = 0, locked_until = NULL WHERE id = $1`, [userId]);
      }
      await this.audit.record({
        actorType: 'human', actorId: actor.principal.subject, action: input.status === 'disabled' ? 'account.disabled' : 'account.enabled',
        objectType: 'account', objectId: userId, requestId: actor.requestId,
      }, db);
    });
    return this.one(userId);
  }

  // ---------------------------------------------------------------- internals

  private configured(): SignInOptions {
    if (!this.options) throw new ServiceUnavailableException('Sign-in is not configured on this server.');
    return this.options;
  }

  private linkFor(opts: SignInOptions, token: string): string {
    return `${opts.newsroomUrl.replace(/\/+$/, '')}/sign-in/invitation#token=${token}`;
  }

  private async requireUser(db: Db, userId: string): Promise<{ password_hash: string | null }> {
    const { rows } = await db.query<{ password_hash: string | null }>('SELECT password_hash FROM app_user WHERE id = $1 FOR UPDATE', [userId]);
    if (!rows[0]) throw new NotFoundException('Not found');
    return rows[0];
  }

  private async setRoleRows(db: Db, userId: string, roleKeys: string[]): Promise<void> {
    await db.query('DELETE FROM user_role WHERE user_id = $1', [userId]);
    for (const role of roleKeys) {
      try {
        await db.query('INSERT INTO user_role (user_id, role_key) VALUES ($1, $2)', [userId, role]);
      } catch (error) {
        if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23503') {
          throw new BadRequestException({ message: `Unknown role: ${role}`, reason: 'unknown_role' });
        }
        throw error;
      }
    }
  }

  private async replaceInvitation(db: Db, userId: string, actor: Actor): Promise<{ token: string; expiresAt: Date }> {
    await db.query('UPDATE auth_invitation SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [userId]);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = await this.insertInvitation(db, userId, token, actor);
    await this.audit.record({
      actorType: 'human', actorId: actor.principal.subject, action: 'account.invitation_reissued', objectType: 'account', objectId: userId,
      requestId: actor.requestId,
    }, db);
    return { token, expiresAt };
  }

  private async insertInvitation(db: Db, userId: string, token: string, actor: Actor): Promise<Date> {
    const creator = await db.query<{ id: string }>('SELECT id FROM app_user WHERE id::text = $1', [actor.principal.subject]);
    const { rows } = await db.query<{ expires_at: Date }>(
      `INSERT INTO auth_invitation (token_hash, user_id, created_by, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(hours => $4)) RETURNING expires_at`,
      [hashRefreshToken(token), userId, creator.rows[0]?.id ?? null, INVITATION_HOURS]);
    return rows[0]!.expires_at;
  }

  private async one(userId: string): Promise<Account> {
    const found = (await this.list()).find((a) => a.id === userId);
    if (!found) throw new NotFoundException('Not found');
    return found;
  }

  private async emailOf(userId: string): Promise<string> {
    const { rows } = await this.pool.query<{ email: string }>('SELECT email FROM app_user WHERE id = $1', [userId]);
    return rows[0]?.email ?? '';
  }
}

/** One recovery code, in the form xxxx-xxxx, from unambiguous characters. */
export function newRecoveryCode(): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}
