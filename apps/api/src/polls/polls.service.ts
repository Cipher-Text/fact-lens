import {
  BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import type { Poll, PollInput, PollVoteResult, PublicPoll } from '@fact-lens/contracts';
import type { Pool, PoolClient } from 'pg';
import { AuditService } from '../audit/audit.service';
import type { Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';

export const POLL_OPTIONS = Symbol('POLL_OPTIONS');

export interface PollOptions {
  /** Keys the vote hashes. Null turns voting off: without it a vote could not be kept private. */
  secret: string | null;
  /** Votes one address may cast on one poll in 24 hours. */
  perIpPerDay: number;
}

type Db = Pool | PoolClient;

interface PollRow {
  id: string; status: Poll['status']; opens_at: Date | null; closes_at: Date | null; featured: boolean; created_at: Date;
}

const COOKIE = 'fl_voter';
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/;

/** The voter token in a Cookie header, or null when it is missing or not one of ours. */
export function voterTokenFrom(cookieHeader: string | undefined): string | null {
  for (const part of (cookieHeader ?? '').split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) {
      const value = rest.join('=');
      return TOKEN_FORMAT.test(value) ? value : null;
    }
  }
  return null;
}

export const newVoterToken = () => randomBytes(32).toString('base64url'); // 43 characters

/** The Set-Cookie value that keeps a browser's token for a year. HttpOnly: the page cannot read it. */
export const voterCookie = (token: string, secure: boolean) =>
  `${COOKIE}=${token}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;

/**
 * Polls (ADR-024). Editors write them; readers vote once per browser. A vote stores only keyed hashes of
 * the browser token and of the address, never the address itself, and the database allows one vote per
 * token per poll. This cannot prove "one person": clearing cookies or changing network gets another
 * vote, and the per-address limit is what keeps that from being cheap.
 */
@Injectable()
export class PollsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(POLL_OPTIONS) private readonly opts: PollOptions,
  ) {}

  // ----------------------------------------------------------------- editors

  async list(status?: Poll['status']): Promise<Poll[]> {
    const { rows } = await this.pool.query<PollRow>(
      `SELECT * FROM poll WHERE ($1::text IS NULL AND status <> 'archived') OR status = $1 ORDER BY created_at DESC`, [status ?? null]);
    return this.hydrate(this.pool, rows);
  }

  async get(id: string, db: Db = this.pool): Promise<Poll> {
    const { rows } = await db.query<PollRow>('SELECT * FROM poll WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('Poll not found');
    return (await this.hydrate(db, rows))[0]!;
  }

  async create(input: PollInput, actor: Actor): Promise<Poll> {
    const id = await withTransaction(this.pool, async (db) => {
      await this.requireLocales(db, input);
      const made = await db.query<{ id: string }>(
        'INSERT INTO poll (opens_at, closes_at, created_by) VALUES ($1, $2, $3) RETURNING id',
        [input.opensAt ?? null, input.closesAt ?? null, actor.principal.subject]);
      const pollId = made.rows[0]!.id;
      await this.writeWording(db, pollId, input);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'poll.create', objectType: 'poll', objectId: pollId, requestId: actor.requestId,
          metadata: { locales: Object.keys(input.questions), options: input.options.length } },
        db,
      );
      return pollId;
    });
    return this.get(id);
  }

  /** Changes a poll that has no votes yet. Once people have voted the wording is fixed. */
  async update(id: string, input: PollInput, actor: Actor): Promise<Poll> {
    await withTransaction(this.pool, async (db) => {
      const cur = await this.lock(db, id);
      const votes = await db.query('SELECT 1 FROM poll_vote WHERE poll_id = $1 LIMIT 1', [id]);
      if (!['draft', 'open'].includes(cur.status) || votes.rowCount) {
        throw new ConflictException({ message: 'This poll already has votes or has closed, so its wording cannot change', reason: 'poll_locked' });
      }
      await this.requireLocales(db, input);
      await db.query('UPDATE poll SET opens_at = $2, closes_at = $3, updated_at = now() WHERE id = $1', [id, input.opensAt ?? null, input.closesAt ?? null]);
      await db.query('DELETE FROM poll_question WHERE poll_id = $1', [id]);
      await db.query('DELETE FROM poll_option WHERE poll_id = $1', [id]);
      await this.writeWording(db, id, input);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'poll.update', objectType: 'poll', objectId: id, requestId: actor.requestId },
        db,
      );
    });
    return this.get(id);
  }

  async open(id: string, actor: Actor): Promise<Poll> {
    return this.move(id, actor, 'open', ['draft']);
  }

  async close(id: string, actor: Actor): Promise<Poll> {
    return this.move(id, actor, 'closed', ['open']);
  }

  async archive(id: string, actor: Actor): Promise<Poll> {
    return this.move(id, actor, 'archived', ['draft', 'closed']);
  }

  /** One poll is shown on the homepage. Featuring another takes the place of the first. */
  async feature(id: string, featured: boolean, actor: Actor): Promise<Poll> {
    await withTransaction(this.pool, async (db) => {
      const cur = await this.lock(db, id);
      if (featured && !['open', 'closed'].includes(cur.status)) {
        throw new ConflictException({ message: 'Only an open or closed poll can be on the homepage', reason: 'poll_not_public' });
      }
      if (featured) await db.query('UPDATE poll SET featured = false WHERE featured AND id <> $1', [id]);
      await db.query('UPDATE poll SET featured = $2, updated_at = now() WHERE id = $1', [id, featured]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'poll.feature', objectType: 'poll', objectId: id, requestId: actor.requestId, newState: String(featured) },
        db,
      );
    });
    return this.get(id);
  }

  async remove(id: string, actor: Actor): Promise<void> {
    await withTransaction(this.pool, async (db) => {
      const cur = await this.lock(db, id);
      if (cur.status !== 'draft') throw new ConflictException({ message: 'Only a draft can be deleted. Close and archive a poll that was open.', reason: 'poll_not_draft' });
      await db.query('DELETE FROM poll WHERE id = $1', [id]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'poll.delete', objectType: 'poll', objectId: id, requestId: actor.requestId }, db);
    });
  }

  // ----------------------------------------------------------------- readers

  /** The poll on the homepage, in one language, with this browser's own vote. */
  async featured(locale: string, token: string | null): Promise<PublicPoll> {
    const { rows } = await this.pool.query<{ id: string }>(`SELECT id FROM poll WHERE featured AND status IN ('open', 'closed') LIMIT 1`);
    if (!rows[0]) throw new NotFoundException('Not found');
    return this.publicPoll(rows[0].id, locale, token);
  }

  async publicPoll(id: string, locale: string, token: string | null, db: Db = this.pool): Promise<PublicPoll> {
    const { rows } = await db.query<PollRow & { open: boolean; question: string }>(
      `SELECT p.*, q.question,
              (p.status = 'open' AND (p.closes_at IS NULL OR p.closes_at > now())) AS open
         FROM poll p JOIN poll_question q ON q.poll_id = p.id AND q.locale = $2
        WHERE p.id = $1 AND p.status IN ('open', 'closed') AND (p.opens_at IS NULL OR p.opens_at <= now())`,
      [id, locale]);
    const p = rows[0];
    if (!p) throw new NotFoundException('Not found');
    const options = await db.query<{ id: string; label: string; votes: number }>(
      `SELECT o.id, l.label, (SELECT count(*)::int FROM poll_vote v WHERE v.option_id = o.id) AS votes
         FROM poll_option o JOIN poll_option_label l ON l.option_id = o.id AND l.locale = $2
        WHERE o.poll_id = $1 ORDER BY o.position`, [id, locale]);
    let myVote: string | null = null;
    if (token && this.opts.secret) {
      const mine = await db.query<{ option_id: string }>('SELECT option_id FROM poll_vote WHERE poll_id = $1 AND token_hash = $2', [id, this.hash('t', token)]);
      myVote = mine.rows[0]?.option_id ?? null;
    }
    return {
      id, question: p.question, open: p.open, myVote,
      options: options.rows, totalVotes: options.rows.reduce((n, o) => n + o.votes, 0),
    };
  }

  /**
   * Counts one vote. A browser that already voted gets its first vote back, not an error, so a double
   * click or a second tab is harmless. `ip` is the address as the server sees it (see TRUST_PROXY).
   */
  async vote(id: string, optionId: string, locale: string, token: string, ip: string): Promise<PollVoteResult> {
    if (!this.opts.secret) {
      throw new ServiceUnavailableException({ message: 'Voting is not set up on this server', reason: 'polls_not_set_up' });
    }
    return withTransaction(this.pool, async (db) => {
      const current = await this.publicPoll(id, locale, null, db); // 404 when not public in this language
      if (!current.open) throw new ConflictException({ message: 'Voting on this poll has closed', reason: 'poll_closed' });
      if (!current.options.some((o) => o.id === optionId)) throw new BadRequestException('That is not an option of this poll');
      const tokenHash = this.hash('t', token);
      const ipHash = ip ? this.hash(`i:${id}`, ip) : null;

      // Serialise votes on one poll so the per-address count below cannot be raced past.
      await db.query('SELECT 1 FROM poll WHERE id = $1 FOR UPDATE', [id]);
      const earlier = await db.query('SELECT 1 FROM poll_vote WHERE poll_id = $1 AND token_hash = $2', [id, tokenHash]);
      if (earlier.rowCount === 0) {
        if (ipHash) {
          const n = await db.query<{ n: number }>(
            `SELECT count(*)::int AS n FROM poll_vote WHERE poll_id = $1 AND ip_hash = $2 AND created_at > now() - interval '24 hours'`, [id, ipHash]);
          if (n.rows[0]!.n >= this.opts.perIpPerDay) {
            throw new HttpException({ message: 'Too many votes from this network today. Try again tomorrow.', reason: 'poll_ip_limit' }, HttpStatus.TOO_MANY_REQUESTS);
          }
        }
        await db.query('INSERT INTO poll_vote (poll_id, option_id, token_hash, ip_hash) VALUES ($1, $2, $3, $4)', [id, optionId, tokenHash, ipHash]);
      }
      return { ...(await this.publicPoll(id, locale, token, db)), alreadyVoted: earlier.rowCount !== 0 };
    });
  }

  // --------------------------------------------------------------- internals

  private hash(domain: string, value: string): string {
    return createHmac('sha256', this.opts.secret!).update(`${domain}:${value}`).digest('base64url');
  }

  private async lock(db: PoolClient, id: string): Promise<PollRow> {
    const { rows } = await db.query<PollRow>('SELECT * FROM poll WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) throw new NotFoundException('Poll not found');
    return rows[0];
  }

  private async move(id: string, actor: Actor, to: Poll['status'], from: Array<Poll['status']>): Promise<Poll> {
    await withTransaction(this.pool, async (db) => {
      const cur = await this.lock(db, id);
      if (cur.status === to) return;
      if (!from.includes(cur.status)) {
        throw new ConflictException({ message: `A ${cur.status} poll cannot become ${to}`, reason: 'invalid_state' });
      }
      // An archived poll leaves the homepage.
      await db.query('UPDATE poll SET status = $2, featured = featured AND $2 <> \'archived\', updated_at = now() WHERE id = $1', [id, to]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: `poll.${to === 'open' ? 'open' : to === 'closed' ? 'close' : 'archive'}`, objectType: 'poll', objectId: id,
          previousState: cur.status, newState: to, requestId: actor.requestId },
        db,
      );
    });
    return this.get(id);
  }

  private async requireLocales(db: Db, input: PollInput): Promise<void> {
    const codes = [...new Set([...Object.keys(input.questions), ...input.options.flatMap((o) => Object.keys(o))])];
    const { rows } = await db.query<{ code: string }>('SELECT code FROM locale WHERE code = ANY ($1::text[]) AND active', [codes]);
    const known = new Set(rows.map((r) => r.code));
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length > 0) throw new BadRequestException(`Unknown or inactive language: ${unknown.join(', ')}`);
  }

  private async writeWording(db: Db, pollId: string, input: PollInput): Promise<void> {
    for (const [locale, text] of Object.entries(input.questions)) {
      await db.query('INSERT INTO poll_question (poll_id, locale, question) VALUES ($1, $2, $3)', [pollId, locale, text]);
    }
    for (const [i, labels] of input.options.entries()) {
      const o = await db.query<{ id: string }>('INSERT INTO poll_option (poll_id, position) VALUES ($1, $2) RETURNING id', [pollId, i + 1]);
      for (const [locale, label] of Object.entries(labels)) {
        await db.query('INSERT INTO poll_option_label (option_id, locale, label) VALUES ($1, $2, $3)', [o.rows[0]!.id, locale, label]);
      }
    }
  }

  private async hydrate(db: Db, polls: PollRow[]): Promise<Poll[]> {
    if (polls.length === 0) return [];
    const ids = polls.map((p) => p.id);
    const [questions, options, labels, votes] = await Promise.all([
      db.query<{ poll_id: string; locale: string; question: string }>('SELECT * FROM poll_question WHERE poll_id = ANY ($1::uuid[])', [ids]),
      db.query<{ id: string; poll_id: string; position: number }>('SELECT * FROM poll_option WHERE poll_id = ANY ($1::uuid[]) ORDER BY position', [ids]),
      db.query<{ option_id: string; locale: string; label: string }>(
        'SELECT l.* FROM poll_option_label l JOIN poll_option o ON o.id = l.option_id WHERE o.poll_id = ANY ($1::uuid[])', [ids]),
      db.query<{ option_id: string; n: number }>(
        'SELECT option_id, count(*)::int AS n FROM poll_vote WHERE poll_id = ANY ($1::uuid[]) GROUP BY option_id', [ids]),
    ]);
    const voteOf = new Map(votes.rows.map((v) => [v.option_id, v.n]));
    return polls.map((p) => {
      const opts = options.rows.filter((o) => o.poll_id === p.id).map((o) => ({
        id: o.id, position: o.position, votes: voteOf.get(o.id) ?? 0,
        labels: Object.fromEntries(labels.rows.filter((l) => l.option_id === o.id).map((l) => [l.locale, l.label])),
      }));
      const total = opts.reduce((n, o) => n + o.votes, 0);
      return {
        id: p.id, status: p.status, opensAt: p.opens_at?.toISOString() ?? null, closesAt: p.closes_at?.toISOString() ?? null, featured: p.featured,
        questions: Object.fromEntries(questions.rows.filter((q) => q.poll_id === p.id).map((q) => [q.locale, q.question])),
        options: opts, totalVotes: total, editable: ['draft', 'open'].includes(p.status) && total === 0, createdAt: p.created_at.toISOString(),
      };
    });
  }
}
