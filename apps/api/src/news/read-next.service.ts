import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PublicRelatedList } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { PG_POOL } from '../db/pool';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { SHORT_REF } from './news.service';
import { LIVE_STATUSES } from './workflow';

/** How many of the newest live items are scored for the automatic part of the list. */
const POOL = 300;
/** A recency boost of 2 for a new item, halving every 30 days. It only ranks items that already share something. */
const HALF_LIFE_DAYS = 30;
const MAX_OPINION = 1;
const MAX_PER_AUTHOR = 2;

interface Base { id: string; format: string; publishedAt: number }
interface Profile extends Base {
  primary: string | null;
  categories: Set<string>;
  tags: Set<string>;
  regions: Set<string>;
  authors: string[];
}

const shared = (a: Set<string>, b: Set<string>): number => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
};

/**
 * The "Read next" list under an article (docs/plans/product/read-next.md, RN3). Order: the editor's picks, then the
 * best scoring items (shared tags 3, regions 2, sections 1, plus recency), then the newest in the same section, then
 * the newest of the site. Only live items with a version in the page's language are ever chosen.
 */
@Injectable()
export class ReadNextService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(TaxonomyService) private readonly taxonomy: TaxonomyService,
  ) {}

  async related(locale: string, ref: string, limit: number): Promise<PublicRelatedList> {
    const articleId = await this.articleId(locale, ref);
    const picks = (await this.pool.query<{ related_news_id: string }>(
      'SELECT related_news_id FROM news_related WHERE news_id = $1 ORDER BY position', [articleId])).rows.map((r) => r.related_news_id);

    const [anchored, pool] = await Promise.all([
      this.liveBase(locale, [articleId, ...picks]),
      this.pool.query<{ id: string; format: string; published_at: Date }>(
        `SELECT s.id, s.format, s.published_at FROM news s
           JOIN news_translation st ON st.revision_id = s.published_revision_id AND st.locale = $1
          WHERE s.status = ANY($2) AND s.published_revision_id IS NOT NULL AND s.id <> $3
          ORDER BY s.published_at DESC, s.id DESC LIMIT ${POOL}`, [locale, LIVE_STATUSES, articleId]),
    ]);
    const candidates: Base[] = pool.rows.map((r) => ({ id: r.id, format: r.format, publishedAt: r.published_at.getTime() }));
    const profiles = await this.profiles(anchored, candidates);
    const article = profiles.get(articleId);
    if (!article) throw new NotFoundException('Not found');

    const chosen: string[] = [];
    const opinions = { count: 0 };
    const authors = new Map<string, number>();
    /** Editor picks are the editor's choice, so only the not-live and repeat checks apply to them. */
    const take = (p: Profile, enforce: boolean): boolean => {
      if (chosen.length >= limit || chosen.includes(p.id) || p.id === articleId) return false;
      if (enforce) {
        if (p.format === 'opinion' && (opinions.count >= MAX_OPINION || shared(article.tags, p.tags) === 0)) return false;
        if (p.authors.some((a) => (authors.get(a) ?? 0) >= MAX_PER_AUTHOR)) return false;
      }
      chosen.push(p.id);
      if (p.format === 'opinion') opinions.count++;
      for (const a of p.authors) authors.set(a, (authors.get(a) ?? 0) + 1);
      return true;
    };
    const poolProfiles = candidates.map((c) => profiles.get(c.id)).filter((p): p is Profile => !!p);

    for (const id of picks) {
      const p = profiles.get(id);
      if (p) take(p, false);
    }

    const now = Date.now();
    const scored = poolProfiles
      .map((p) => {
        const overlap = 3 * shared(article.tags, p.tags) + 2 * shared(article.regions, p.regions) + shared(article.categories, p.categories);
        const ageDays = Math.max(0, (now - p.publishedAt) / 86_400_000);
        return { p, overlap, total: overlap + 2 * 0.5 ** (ageDays / HALF_LIFE_DAYS) };
      })
      .filter((x) => x.overlap > 0)
      // A stable sort keeps the newest first among equal scores.
      .sort((a, b) => b.total - a.total);
    for (const x of scored) take(x.p, true);

    if (article.primary) {
      for (const p of poolProfiles) if (p.primary === article.primary) take(p, true);
    }
    for (const p of poolProfiles) take(p, true);

    if (chosen.length === 0) return { items: [] };
    const { items } = await this.taxonomy.publicNews(locale, { ids: chosen, limit: chosen.length });
    const byId = new Map(items.map((i) => [i.id, i]));
    return { items: chosen.map((id) => byId.get(id)).filter((i): i is NonNullable<typeof i> => !!i) };
  }

  /** The item an address names. The id decides it; a bare slug is not an address for the related list. */
  private async articleId(locale: string, ref: string): Promise<string> {
    const parsed = SHORT_REF.exec(ref);
    if (!parsed) throw new NotFoundException('Not found');
    const { rows } = await this.pool.query<{ id: string }>(
      `SELECT p.id FROM news p JOIN news_translation st ON st.revision_id = p.published_revision_id AND st.locale = $1
        WHERE p.short_id = $2 AND p.published_revision_id IS NOT NULL AND p.status = ANY($3)`, [locale, parsed[2], LIVE_STATUSES]);
    if (!rows[0]) throw new NotFoundException('Not found');
    return rows[0].id;
  }

  /** The live items among `ids` that have a version in the locale. */
  private async liveBase(locale: string, ids: string[]): Promise<Base[]> {
    if (ids.length === 0) return [];
    const { rows } = await this.pool.query<{ id: string; format: string; published_at: Date }>(
      `SELECT s.id, s.format, s.published_at FROM news s
         JOIN news_translation st ON st.revision_id = s.published_revision_id AND st.locale = $1
        WHERE s.status = ANY($2) AND s.published_revision_id IS NOT NULL AND s.id = ANY($3::uuid[])`, [locale, LIVE_STATUSES, ids]);
    return rows.map((r) => ({ id: r.id, format: r.format, publishedAt: r.published_at.getTime() }));
  }

  /** Sections, tags, regions and authors of each item, read in one query per kind. */
  private async profiles(anchored: Base[], candidates: Base[]): Promise<Map<string, Profile>> {
    const out = new Map<string, Profile>();
    const bases = new Map([...anchored, ...candidates].map((b) => [b.id, b] as const));
    for (const b of bases.values()) {
      out.set(b.id, { ...b, primary: null, categories: new Set(), tags: new Set(), regions: new Set(), authors: [] });
    }
    const ids = [...bases.keys()];
    if (ids.length === 0) return out;
    const [categories, tags, regions, authors] = await Promise.all([
      this.pool.query<{ news_id: string; category_id: string; is_primary: boolean }>(
        'SELECT news_id, category_id, is_primary FROM news_category WHERE news_id = ANY($1::uuid[])', [ids]),
      this.pool.query<{ news_id: string; tag_id: string }>('SELECT news_id, tag_id FROM news_tag WHERE news_id = ANY($1::uuid[])', [ids]),
      this.pool.query<{ news_id: string; region_id: string }>('SELECT news_id, region_id FROM news_region WHERE news_id = ANY($1::uuid[])', [ids]),
      this.pool.query<{ news_id: string; contributor_id: string }>(
        `SELECT news_id, contributor_id FROM news_contributor WHERE news_id = ANY($1::uuid[]) AND role = 'author' ORDER BY position`, [ids]),
    ]);
    for (const r of categories.rows) {
      const p = out.get(r.news_id);
      if (!p) continue;
      p.categories.add(r.category_id);
      if (r.is_primary) p.primary = r.category_id;
    }
    for (const r of tags.rows) out.get(r.news_id)?.tags.add(r.tag_id);
    for (const r of regions.rows) out.get(r.news_id)?.regions.add(r.region_id);
    for (const r of authors.rows) {
      const p = out.get(r.news_id);
      if (p && !p.authors.includes(r.contributor_id)) p.authors.push(r.contributor_id);
    }
    return out;
  }
}
