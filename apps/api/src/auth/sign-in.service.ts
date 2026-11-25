import { createHash } from 'node:crypto';
import { HttpException, Inject, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { DevAccount, SignInResult, SignedIn } from '@fact-lens/contracts';
import { jwtVerify, SignJWT } from 'jose';
import type { Redis } from 'ioredis';
import type { Pool, PoolClient } from 'pg';
import { countInWindow, RateLimitUnavailableError } from '../common/rate-limit';
import { AuditService } from '../audit/audit.service';
import { REDIS_CLIENT, VIEWS_OPTIONS, type ViewsOptions } from '../analytics/views.service';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { verifyAgainstDummy, verifyPassword } from './credentials';
import {
  ATTEMPTS_PER_MINUTE, CHALLENGE_SECONDS, DEV_ACCOUNT_DOMAIN, LOCK_AFTER_FAILURES, LOCK_SECONDS, SESSION_SECONDS, SIGNIN_OPTIONS, type SignInOptions,
} from './sign-in.options';
import { decryptSecret } from './tokens';
import { hashRefreshToken, issueAccessToken, newRefreshToken } from './tokens';
import { verifyCode } from './totp';

const BAD_SIGN_IN = 'Email or password is incorrect.';
const BAD_CODE = 'The code is not correct.';
const SIGN_IN_AGAIN = 'Sign in again.';

/** What the controller sends back: the body, and the refresh token for the cookie when the sign-in is complete. */
export interface Issued<T> {
  body: T;
  refreshToken?: string;
  sessionEndsAt?: number;
}

/**
 * Sign-in inside the backend (ADR-046, docs/plans/auth-in-app.md, step A4): the password step, the code step, recovery
 * codes, refresh with reuse detection, sign-out, lockout after five failures and a limit per address. Every outcome is
 * audited in the same transaction as the change it records.
 */
@Injectable()
export class SignInService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    @Inject(VIEWS_OPTIONS) private readonly views: ViewsOptions,
    @Inject(SIGNIN_OPTIONS) private readonly options: SignInOptions | null,
  ) {}

  /** The password step. Returns a code challenge when the password is right; never says which part was wrong. */
  async signIn(email: string, password: string, ip: string | null): Promise<Issued<SignInResult>> {
    const opts = this.configured();
    await this.limit(ip);
    const { rows } = await this.pool.query<{
      id: string; status: string; password_hash: string | null; failed_sign_ins: number; locked_until: Date | null;
    }>('SELECT id, status, password_hash, failed_sign_ins, locked_until FROM app_user WHERE lower(email) = lower($1)', [email]);
    const user = rows[0];
    if (!user || !user.password_hash || user.status !== 'active') {
      await verifyAgainstDummy(password);
      await this.auditAnonymous('auth.sign_in_failed', { reason: user ? 'not_active' : 'unknown_account' }, ip);
      throw new UnauthorizedException(BAD_SIGN_IN);
    }
    if (user.locked_until && user.locked_until.getTime() > Date.now()) {
      await verifyPassword(password, user.password_hash);
      await this.audit.record({ actorType: 'system', action: 'auth.sign_in_failed', objectType: 'account', objectId: user.id, metadata: { reason: 'locked' } });
      throw new UnauthorizedException(BAD_SIGN_IN);
    }
    if (!(await verifyPassword(password, user.password_hash))) {
      await this.failed(user.id, 'password');
      throw new UnauthorizedException(BAD_SIGN_IN);
    }
    const factor = await this.pool.query<{ confirmed_at: Date | null }>('SELECT confirmed_at FROM mfa_factor WHERE user_id = $1', [user.id]);
    if (!factor.rows[0]?.confirmed_at) {
      await this.audit.record({ actorType: 'system', action: 'auth.sign_in_failed', objectType: 'account', objectId: user.id, metadata: { reason: 'mfa_not_set_up' } });
      throw new UnauthorizedException(BAD_SIGN_IN);
    }
    await this.pool.query('UPDATE app_user SET failed_sign_ins = 0 WHERE id = $1', [user.id]);
    const challenge = await new SignJWT({ purpose: 'mfa' })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer(opts.issuer)
      .setAudience(`${opts.audience}:mfa`)
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${CHALLENGE_SECONDS}s`)
      .sign(opts.privateKey);
    return { body: { status: 'mfa_required', challengeToken: challenge, expiresAt: new Date(Date.now() + CHALLENGE_SECONDS * 1000).toISOString() } };
  }

  /** The code step: a six-digit authenticator code. The code's time step is recorded, so it works once. */
  async verifyAuthenticatorCode(challengeToken: string, code: string, ip: string | null): Promise<Issued<SignedIn>> {
    const opts = this.configured();
    await this.limit(ip);
    const userId = await this.challengeSubject(challengeToken);
    const { rows } = await this.pool.query<{ secret_encrypted: Buffer; last_used_step: string | null; status: string; failed_sign_ins: number }>(
      `SELECT f.secret_encrypted, f.last_used_step, u.status, u.failed_sign_ins
         FROM mfa_factor f JOIN app_user u ON u.id = f.user_id WHERE f.user_id = $1 AND f.confirmed_at IS NOT NULL`, [userId]);
    const row = rows[0];
    if (!row || row.status !== 'active') throw new UnauthorizedException(SIGN_IN_AGAIN);
    const secret = decryptSecret(row.secret_encrypted, opts.encryptionKey).toString('utf8');
    const lastStep = row.last_used_step === null ? null : Number(row.last_used_step);
    const step = verifyCode(secret, code, Math.floor(Date.now() / 1000), lastStep);
    if (step === null) {
      await this.failed(userId, 'code');
      throw new UnauthorizedException(BAD_CODE);
    }
    return this.complete(userId, ip, async (db) => {
      const used = await db.query('UPDATE mfa_factor SET last_used_step = $2 WHERE user_id = $1 AND (last_used_step IS NULL OR last_used_step < $2)', [userId, step]);
      return (used.rowCount ?? 0) === 1;
    });
  }

  /** A recovery code, used once in place of an authenticator code. */
  async verifyRecoveryCode(challengeToken: string, recoveryCode: string, ip: string | null): Promise<Issued<SignedIn>> {
    this.configured();
    await this.limit(ip);
    const userId = await this.challengeSubject(challengeToken);
    const codes = await this.pool.query<{ id: string; code_hash: string }>(
      'SELECT id, code_hash FROM mfa_recovery_code WHERE user_id = $1 AND used_at IS NULL', [userId]);
    let matched: string | null = null;
    for (const code of codes.rows) {
      if (await verifyPassword(recoveryCode, code.code_hash)) {
        matched = code.id;
        break;
      }
    }
    if (!matched) {
      await this.failed(userId, 'recovery_code');
      throw new UnauthorizedException(BAD_CODE);
    }
    return this.complete(userId, ip, async (db) => {
      const used = await db.query('UPDATE mfa_recovery_code SET used_at = now() WHERE id = $1 AND used_at IS NULL', [matched]);
      return (used.rowCount ?? 0) === 1;
    });
  }

  /**
   * Turns a refresh token into a new access token and a new refresh token. A token that was already used means it was
   * copied: the whole sign-in is revoked and the attempt is audited.
   */
  async refresh(token: string | null, ip: string | null): Promise<Issued<SignedIn>> {
    const opts = this.configured();
    if (!token) throw new UnauthorizedException(SIGN_IN_AGAIN);
    const outcome = await withTransaction(this.pool, async (db) => {
      const { rows } = await db.query<{
        session_id: string; user_id: string; used_at: Date | null; expires_at: Date; revoked_at: Date | null; status: string;
      }>(
        `SELECT s.id AS session_id, s.user_id, r.used_at, s.expires_at, s.revoked_at, u.status
           FROM auth_refresh_token r JOIN auth_session s ON s.id = r.session_id JOIN app_user u ON u.id = s.user_id
          WHERE r.token_hash = $1 FOR UPDATE OF s`, [hashRefreshToken(token)]);
      const row = rows[0];
      if (!row) return { refused: true as const };
      if (row.used_at) {
        await db.query('UPDATE auth_session SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL', [row.session_id]);
        await this.audit.record({
          actorType: 'system', action: 'auth.refresh_reuse', objectType: 'account', objectId: row.user_id,
          requestId: null, metadata: { sessionId: row.session_id, ip: this.addressHash(ip) },
        }, db);
        return { reused: true as const };
      }
      if (row.revoked_at || row.expires_at.getTime() <= Date.now() || row.status !== 'active') return { refused: true as const };
      await db.query('UPDATE auth_refresh_token SET used_at = now() WHERE token_hash = $1', [hashRefreshToken(token)]);
      const next = newRefreshToken();
      await db.query('INSERT INTO auth_refresh_token (token_hash, session_id) VALUES ($1, $2)', [next.hash, row.session_id]);
      await db.query('UPDATE auth_session SET last_used_at = now() WHERE id = $1', [row.session_id]);
      const issued = await this.access(db, row.user_id, row.expires_at.getTime(), opts);
      return { issued, refreshToken: next.token, sessionEndsAt: row.expires_at.getTime() };
    });
    if ('reused' in outcome || 'refused' in outcome) throw new UnauthorizedException(SIGN_IN_AGAIN);
    return { body: outcome.issued, refreshToken: outcome.refreshToken, sessionEndsAt: outcome.sessionEndsAt };
  }

  /** Ends the sign-in that the refresh token belongs to. Safe to repeat. */
  async signOut(token: string | null): Promise<void> {
    if (!token) return;
    await withTransaction(this.pool, async (db) => {
      const { rows } = await db.query<{ session_id: string; user_id: string }>(
        `UPDATE auth_session s SET revoked_at = now() FROM auth_refresh_token r
          WHERE r.token_hash = $1 AND s.id = r.session_id AND s.revoked_at IS NULL RETURNING s.id AS session_id, s.user_id`,
        [hashRefreshToken(token)]);
      if (rows[0]) {
        await this.audit.record({ actorType: 'human', actorId: rows[0].user_id, action: 'auth.sign_out', objectType: 'account', objectId: rows[0].user_id, metadata: { sessionId: rows[0].session_id } }, db);
      }
    });
  }

  // ---------------------------------------------------------------- internals

  private configured(): SignInOptions {
    if (!this.options) throw new ServiceUnavailableException('Sign-in is not configured on this server.');
    return this.options;
  }

  /** Starts a sign-in for an account that has passed both steps: a session, a refresh token and an access token. */
  private async complete(userId: string, ip: string | null, recordSecondFactor: (db: PoolClient | Pool) => Promise<boolean>): Promise<Issued<SignedIn>> {
    const opts = this.configured();
    const outcome = await withTransaction(this.pool, async (db) => {
      if (!(await recordSecondFactor(db))) return null;
      await db.query('UPDATE app_user SET failed_sign_ins = 0, last_sign_in_at = now() WHERE id = $1', [userId]);
      const session = await db.query<{ id: string; expires_at: Date }>(
        `INSERT INTO auth_session (user_id, expires_at) VALUES ($1, now() + make_interval(secs => $2)) RETURNING id, expires_at`, [userId, SESSION_SECONDS]);
      const refresh = newRefreshToken();
      await db.query('INSERT INTO auth_refresh_token (token_hash, session_id) VALUES ($1, $2)', [refresh.hash, session.rows[0]!.id]);
      const issued = await this.access(db, userId, session.rows[0]!.expires_at.getTime(), opts);
      await this.audit.record({
        actorType: 'human', actorId: userId, action: 'auth.sign_in', objectType: 'account', objectId: userId,
        metadata: { sessionId: session.rows[0]!.id, ip: this.addressHash(ip) },
      }, db);
      return { issued, refreshToken: refresh.token, sessionEndsAt: session.rows[0]!.expires_at.getTime() };
    });
    if (!outcome) throw new UnauthorizedException(BAD_CODE);
    return { body: outcome.issued, refreshToken: outcome.refreshToken, sessionEndsAt: outcome.sessionEndsAt };
  }

  private async access(db: PoolClient | Pool, userId: string, sessionEndsAt: number, opts: SignInOptions): Promise<SignedIn> {
    const roles = await db.query<{ role_key: string }>('SELECT role_key FROM user_role WHERE user_id = $1 ORDER BY role_key', [userId]);
    const { token, expiresAt } = await issueAccessToken({
      key: opts.privateKey, issuer: opts.issuer, audience: opts.audience, subject: userId,
      roles: roles.rows.map((r) => r.role_key), mfa: true, sessionEndsAt,
    });
    return {
      status: 'signed_in', accessToken: token, accessExpiresAt: new Date(expiresAt).toISOString(), sessionExpiresAt: new Date(sessionEndsAt).toISOString(),
    };
  }

  private async challengeSubject(token: string): Promise<string> {
    const opts = this.configured();
    try {
      const { payload } = await jwtVerify(token, opts.publicKey, { issuer: opts.issuer, audience: `${opts.audience}:mfa`, algorithms: ['ES256'] });
      if (payload.purpose !== 'mfa' || typeof payload.sub !== 'string') throw new Error('not a code challenge');
      return payload.sub;
    } catch {
      throw new UnauthorizedException(SIGN_IN_AGAIN);
    }
  }

  /**
   * Development only (ADR-064): the dev accounts, for the newsroom's sign-in page. Answers 404 unless DEV_QUICK_LOGIN is on.
   * Only accounts on the reserved dev address are listed.
   */
  async devAccounts(): Promise<DevAccount[]> {
    this.requireDevQuickLogin();
    const { rows } = await this.pool.query<{ email: string; display_name: string; roles: string[] }>(
      `SELECT u.email, u.display_name,
              COALESCE(array_agg(ur.role_key ORDER BY ur.role_key) FILTER (WHERE ur.role_key IS NOT NULL), '{}') AS roles
         FROM app_user u
         LEFT JOIN user_role ur ON ur.user_id = u.id
        WHERE u.status = 'active' AND lower(u.email) LIKE '%@' || $1
        GROUP BY u.id, u.email, u.display_name
        ORDER BY u.email`,
      [DEV_ACCOUNT_DOMAIN],
    );
    return rows.map((r) => ({ email: r.email, displayName: r.display_name, roles: r.roles }));
  }

  /**
   * Development only (ADR-064): signs in as a dev account with no password and no code, and issues the same session as a
   * full sign-in. Three gates: the setting is on (the environment check refuses it in production), the account is on the
   * reserved dev address, and it is active. Anything else answers 404, so the endpoint does not confirm which accounts exist.
   * Every use is written to the audit log.
   */
  async devSignIn(email: string, ip: string | null): Promise<Issued<SignedIn>> {
    this.requireDevQuickLogin();
    const address = email.trim().toLowerCase();
    if (!address.endsWith(`@${DEV_ACCOUNT_DOMAIN}`)) throw new NotFoundException();
    const { rows } = await this.pool.query<{ id: string; status: string }>('SELECT id, status FROM app_user WHERE lower(email) = $1', [address]);
    const account = rows[0];
    if (!account || account.status !== 'active') throw new NotFoundException();
    await this.audit.record({
      actorType: 'human', actorId: account.id, action: 'auth.dev_sign_in', objectType: 'account', objectId: account.id,
      metadata: { ip: this.addressHash(ip) },
    }, this.pool);
    return this.complete(account.id, ip, async () => true);
  }

  private requireDevQuickLogin(): void {
    if (!this.options?.devQuickLogin) throw new NotFoundException();
  }

  /** Counts one attempt from an address; throws 429 past the limit. Also used by the enrolment step. */
  async throttle(ip: string | null): Promise<void> {
    await this.limit(ip);
  }

  /** One failed step counts towards the lockout. Five in a row lock the account for 15 minutes. */
  private async failed(userId: string, reason: 'password' | 'code' | 'recovery_code'): Promise<void> {
    await withTransaction(this.pool, async (db) => {
      const { rows } = await db.query<{ failed_sign_ins: number }>(
        'UPDATE app_user SET failed_sign_ins = failed_sign_ins + 1 WHERE id = $1 RETURNING failed_sign_ins', [userId]);
      const count = rows[0]?.failed_sign_ins ?? 0;
      const locking = count >= LOCK_AFTER_FAILURES;
      if (locking) {
        await db.query('UPDATE app_user SET failed_sign_ins = 0, locked_until = now() + make_interval(secs => $2) WHERE id = $1', [userId, LOCK_SECONDS]);
      }
      await this.audit.record({
        actorType: 'system', action: locking ? 'auth.locked' : 'auth.sign_in_failed', objectType: 'account', objectId: userId,
        metadata: { reason },
      }, db);
    });
  }

  private async auditAnonymous(action: string, metadata: Record<string, unknown>, ip: string | null): Promise<void> {
    await this.audit.record({ actorType: 'system', action, objectType: 'account', objectId: 'anonymous', metadata: { ...metadata, ip: this.addressHash(ip) } });
  }

  /** The address as a hash, so a log or audit row never holds an address (docs/12). */
  private addressHash(ip: string | null): string | null {
    return ip ? createHash('sha256').update(`${this.views.hashSecret ?? ''}|${ip}`).digest('hex').slice(0, 32) : null;
  }

  /** The attempts from one address per minute across the sign-in endpoints. Without Redis nothing is limited. */
  private async limit(ip: string | null): Promise<void> {
    if (!this.redis || !ip) return;
    const slot = Math.floor(Date.now() / 60000);
    const key = `${this.views.prefix}:rl:signin:${slot}:${this.addressHash(ip)}`;
    let count: number;
    try {
      count = await countInWindow(this.redis, key, 60);
    } catch (err) {
      if (!(err instanceof RateLimitUnavailableError)) throw err;
      // Refused, not let through: this limit is what stops guessing (ADR-058).
      throw new ServiceUnavailableException('Sign-in is temporarily unavailable. Try again shortly.');
    }
    const allowed = this.options?.attemptsPerMinute ?? ATTEMPTS_PER_MINUTE;
    if (count > allowed) throw new HttpException('Too many attempts. Try again shortly.', 429);
  }
}
