import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PublicTrending, TrendingTerms } from '@fact-lens/contracts';
import type { Pool, PoolClient } from 'pg';
import { AuditService } from '../audit/audit.service';
import type { Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';

/**
 * The editorial list of trending search terms, per language (docs/26, section 5). An editor replaces the whole list in
 * one audited save. Readers get the list in order; an empty list hides the row on the site.
 */
@Injectable()
export class TrendingService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(locale: string): Promise<TrendingTerms> {
    await this.requireActiveLocale(this.pool, locale);
    return { terms: await this.termsOf(this.pool, locale) };
  }

  async publicList(locale: string): Promise<PublicTrending> {
    return this.list(locale);
  }

  async replace(locale: string, input: TrendingTerms, actor: Actor): Promise<TrendingTerms> {
    await withTransaction(this.pool, async (db) => {
      await this.requireActiveLocale(db, locale);
      await db.query('DELETE FROM trending_term WHERE locale = $1', [locale]);
      for (const [index, term] of input.terms.entries()) {
        await db.query('INSERT INTO trending_term (locale, position, term) VALUES ($1, $2, $3)', [locale, index + 1, term]);
      }
      await this.audit.record(
        {
          actorType: 'human', actorId: actor.principal.subject, action: 'trending.update', objectType: 'locale', objectId: locale,
          requestId: actor.requestId, metadata: { count: input.terms.length },
        },
        db,
      );
    }).catch((error: unknown) => {
      if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505') {
        throw new BadRequestException('A term is listed twice');
      }
      throw error;
    });
    return { terms: input.terms };
  }

  private async requireActiveLocale(db: Pool | PoolClient, locale: string): Promise<void> {
    const { rows } = await db.query('SELECT 1 FROM locale WHERE code = $1 AND active', [locale]);
    if (!rows[0]) throw new NotFoundException('Not found');
  }

  private async termsOf(db: Pool | PoolClient, locale: string): Promise<string[]> {
    const { rows } = await db.query<{ term: string }>('SELECT term FROM trending_term WHERE locale = $1 ORDER BY position', [locale]);
    return rows.map((r) => r.term);
  }
}
