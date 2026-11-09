import {
  BadRequestException, ConflictException, Inject, Injectable, NotFoundException,
} from '@nestjs/common';
import type {
  CategoryCreate, CategoryOrder, CategoryUpdate, LabelInput, NewsFormat, PublicMedia, PublicNavItem, PublicRegion, RegionCreate, RegionOrder, RegionUpdate, TaxonomyRegion, PublicNewsList, PublicTaxonomyRef, TagCreate, TagUpdate,
  TaxonomyCategory, TaxonomyTag, TaxonomyTagList,
} from '@fact-lens/contracts';
import { taxonomyTagQuerySchema } from '@fact-lens/contracts';
import type { Pool, PoolClient } from 'pg';
import type { z } from 'zod';
import { AuditService } from '../audit/audit.service';
import { isPgError, type Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { slugify } from '../news/validation';
import { LIVE_STATUSES } from '../news/workflow';

type Kind = 'category' | 'tag' | 'region';
type Db = Pool | PoolClient;

// Fixed names, never built from input: the SQL below interpolates only these.
const KIND = {
  category: { table: 'category', labels: 'category_label', fk: 'category_id', hasDescription: true },
  tag: { table: 'tag', labels: 'tag_label', fk: 'tag_id', hasDescription: true },
  region: { table: 'region', labels: 'region_label', fk: 'region_id', hasDescription: true },
} as const;

interface Row {
  id: string; key: string; show_in_menu?: boolean; parent_id?: string | null; position?: number; image_id?: string | null; status: TaxonomyTag['status'];
  usage_count: number; labels: TaxonomyTag['labels'];
}

const KEY_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Categories (the news menu) and tags, each one record with a label per language. Nothing here
 * names a language: the valid ones are the rows of `locale`.
 */
@Injectable()
export class TaxonomyService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------------ categories

  async listCategories(db: Db = this.pool): Promise<TaxonomyCategory[]> {
    const { rows } = await db.query<Row>(`${this.select('category')} ORDER BY c.position, c.key`);
    return rows.map(toCategory);
  }

  async getCategory(id: string, db: Db = this.pool): Promise<TaxonomyCategory> {
    const { rows } = await db.query<Row>(`${this.select('category')} WHERE c.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException('Category not found');
    return toCategory(rows[0]);
  }

  async createCategory(input: CategoryCreate, actor: Actor): Promise<TaxonomyCategory> {
    const id = await withTransaction(this.pool, async (db) => {
      await this.requireLocales(db, Object.keys(input.labels));
      const key = this.keyFor(input.key, input.labels);
      await this.requireParent(db, null, input.parentId);
      const next = await db.query<{ n: number }>('SELECT COALESCE(max(position), 0) + 1 AS n FROM category');
      const created = await this.guard(() =>
        db.query<{ id: string }>('INSERT INTO category (key, show_in_menu, parent_id, position) VALUES ($1, $2, $3, $4) RETURNING id',
          [key, input.showInMenu, input.parentId ?? null, next.rows[0]!.n]));
      const categoryId = created.rows[0]!.id;
      await this.writeLabels(db, 'category', categoryId, key, input.labels);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.category_create', objectType: 'category', objectId: categoryId,
          requestId: actor.requestId, metadata: { key, locales: Object.keys(input.labels) } },
        db,
      );
      return categoryId;
    });
    return this.getCategory(id);
  }

  async updateCategory(id: string, input: CategoryUpdate, actor: Actor): Promise<TaxonomyCategory> {
    await withTransaction(this.pool, async (db) => {
      const found = await db.query<{ key: string }>('SELECT key FROM category WHERE id = $1 FOR UPDATE', [id]);
      if (!found.rows[0]) throw new NotFoundException('Category not found');
      if (input.showInMenu !== undefined) await db.query('UPDATE category SET show_in_menu = $2 WHERE id = $1', [id, input.showInMenu]);
      if (input.parentId !== undefined) {
        await this.requireParent(db, id, input.parentId);
        await db.query('UPDATE category SET parent_id = $2 WHERE id = $1', [id, input.parentId]);
      }
      if (input.status !== undefined) await db.query('UPDATE category SET status = $2 WHERE id = $1', [id, input.status]);
      if (input.labels) await this.applyLabels(db, 'category', id, found.rows[0].key, input.labels);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.category_update', objectType: 'category', objectId: id,
          requestId: actor.requestId, metadata: { changed: Object.keys(input), locales: input.labels ? Object.keys(input.labels) : [] } },
        db,
      );
    });
    return this.getCategory(id);
  }

  /** The listed categories take the first places in the menu, in this order; the rest follow, in their old order. */
  async reorderCategories(input: CategoryOrder, actor: Actor): Promise<TaxonomyCategory[]> {
    await withTransaction(this.pool, async (db) => {
      const known = await db.query('SELECT 1 FROM category WHERE id = ANY ($1::uuid[])', [input.ids]);
      if (known.rowCount !== input.ids.length) throw new BadRequestException('Some of those categories do not exist');
      await db.query('UPDATE category SET position = position + $2 WHERE id <> ALL ($1::uuid[])', [input.ids, input.ids.length]);
      await db.query('UPDATE category c SET position = o.n FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, n) WHERE c.id = o.id', [input.ids]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.category_reorder', objectType: 'category', objectId: 'menu',
          requestId: actor.requestId, metadata: { order: input.ids } },
        db,
      );
    });
    return this.listCategories();
  }

  async deleteCategory(id: string, actor: Actor): Promise<void> {
    await this.remove('category', id, actor);
  }

  // --------------------------------------------------------------------- regions

  async listRegions(db: Db = this.pool): Promise<TaxonomyRegion[]> {
    const { rows } = await db.query<Row>(`${this.select('region')} ORDER BY c.position, c.key`);
    return rows.map(toRegion);
  }

  async getRegion(id: string, db: Db = this.pool): Promise<TaxonomyRegion> {
    const { rows } = await db.query<Row>(`${this.select('region')} WHERE c.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException('Region not found');
    return toRegion(rows[0]);
  }

  async createRegion(input: RegionCreate, actor: Actor): Promise<TaxonomyRegion> {
    const id = await withTransaction(this.pool, async (db) => {
      await this.requireLocales(db, Object.keys(input.labels));
      const key = this.keyFor(input.key, input.labels);
      const next = await db.query<{ n: number }>('SELECT COALESCE(max(position), 0) + 1 AS n FROM region');
      const created = await this.guard(() => db.query<{ id: string }>('INSERT INTO region (key, position) VALUES ($1, $2) RETURNING id', [key, next.rows[0]!.n]));
      const regionId = created.rows[0]!.id;
      await this.writeLabels(db, 'region', regionId, key, input.labels);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.region_create', objectType: 'region', objectId: regionId,
          requestId: actor.requestId, metadata: { key, locales: Object.keys(input.labels) } },
        db,
      );
      return regionId;
    });
    return this.getRegion(id);
  }

  async updateRegion(id: string, input: RegionUpdate, actor: Actor): Promise<TaxonomyRegion> {
    await withTransaction(this.pool, async (db) => {
      const found = await db.query<{ key: string }>('SELECT key FROM region WHERE id = $1 FOR UPDATE', [id]);
      if (!found.rows[0]) throw new NotFoundException('Region not found');
      if (input.status !== undefined) await db.query('UPDATE region SET status = $2 WHERE id = $1', [id, input.status]);
      if (input.labels) await this.applyLabels(db, 'region', id, found.rows[0].key, input.labels);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.region_update', objectType: 'region', objectId: id,
          requestId: actor.requestId, metadata: { changed: Object.keys(input), locales: input.labels ? Object.keys(input.labels) : [] } },
        db,
      );
    });
    return this.getRegion(id);
  }

  /** The listed regions take the first places, in this order; the rest follow, in their old order. */
  async reorderRegions(input: RegionOrder, actor: Actor): Promise<TaxonomyRegion[]> {
    await withTransaction(this.pool, async (db) => {
      const known = await db.query('SELECT 1 FROM region WHERE id = ANY ($1::uuid[])', [input.ids]);
      if (known.rowCount !== input.ids.length) throw new BadRequestException('Some of those regions do not exist');
      await db.query('UPDATE region SET position = position + $2 WHERE id <> ALL ($1::uuid[])', [input.ids, input.ids.length]);
      await db.query('UPDATE region c SET position = o.n FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, n) WHERE c.id = o.id', [input.ids]);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.region_reorder', objectType: 'region', objectId: 'regions',
          requestId: actor.requestId, metadata: { order: input.ids } },
        db,
      );
    });
    return this.listRegions();
  }

  async deleteRegion(id: string, actor: Actor): Promise<void> {
    await this.remove('region', id, actor);
  }

  /** The regions of one news item, replaced as a whole. Regions belong to the news item, not to a revision. */
  async setNewsRegions(newsId: string, regionIds: string[], actor: Actor): Promise<TaxonomyRegion[]> {
    await withTransaction(this.pool, async (db) => {
      const news = await db.query<{ status: string }>('SELECT status FROM news WHERE id = $1 FOR UPDATE', [newsId]);
      if (!news.rows[0]) throw new NotFoundException('News not found');
      if (news.rows[0].status === 'ARCHIVED') throw new ConflictException({ message: 'Archived news cannot be edited', reason: 'news_archived' });
      if (regionIds.length > 0) {
        const usable = await db.query(`SELECT 1 FROM region WHERE id = ANY ($1::uuid[]) AND status <> 'archived'`, [regionIds]);
        if (usable.rowCount !== regionIds.length) throw new BadRequestException('Some of those regions do not exist or are archived');
      }
      const current = await db.query<{ region_id: string }>('SELECT region_id FROM news_region WHERE news_id = $1', [newsId]);
      const had = new Set(current.rows.map((r) => r.region_id));
      const want = new Set(regionIds);
      const added = regionIds.filter((r) => !had.has(r));
      const removed = [...had].filter((r) => !want.has(r));
      if (removed.length > 0) await db.query('DELETE FROM news_region WHERE news_id = $1 AND region_id = ANY ($2::uuid[])', [newsId, removed]);
      if (added.length > 0) await db.query('INSERT INTO news_region (news_id, region_id) SELECT $1, unnest($2::uuid[])', [newsId, added]);
      if (added.length > 0 || removed.length > 0) {
        await db.query('UPDATE news SET updated_at = now() WHERE id = $1', [newsId]);
        await this.audit.record(
          { actorType: 'human', actorId: actor.principal.subject, action: 'news.regions_update', objectType: 'news', objectId: newsId, newsId,
            requestId: actor.requestId, metadata: { added, removed } },
          db,
        );
      }
    });
    return this.regionsOfNews(newsId);
  }

  async regionsOfNews(newsId: string, db: Db = this.pool): Promise<TaxonomyRegion[]> {
    const { rows } = await db.query<Row>(
      `${this.select('region')} WHERE c.id IN (SELECT region_id FROM news_region WHERE news_id = $1) ORDER BY c.position, c.key`, [newsId]);
    return rows.map(toRegion);
  }

  // ------------------------------------------------------------------------ tags

  async listTags(query: z.infer<typeof taxonomyTagQuerySchema>, db: Db = this.pool): Promise<TaxonomyTagList> {
    let after: string | null = null;
    if (query.cursor) {
      try {
        after = String(JSON.parse(Buffer.from(query.cursor, 'base64url').toString()));
      } catch {
        throw new BadRequestException('Invalid cursor');
      }
    }
    const search = query.query ? `%${query.query.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const { rows } = await db.query<Row>(
      `${this.select('tag')}
        WHERE ($1::text IS NULL OR c.key ILIKE $1 OR EXISTS (
                SELECT 1 FROM tag_label l WHERE l.tag_id = c.id AND (l.name ILIKE $1 OR l.slug ILIKE $1 OR EXISTS (SELECT 1 FROM unnest(l.aliases) a WHERE a ILIKE $1))))
          AND ($2::text IS NULL OR c.status = $2)
          AND ($3::text IS NULL OR c.key > $3)
        ORDER BY c.key LIMIT $4`,
      [search, query.status ?? null, after, query.limit + 1],
    );
    const page = rows.slice(0, query.limit);
    return {
      items: page.map(toTag),
      nextCursor: rows.length > query.limit ? Buffer.from(JSON.stringify(page[page.length - 1]!.key)).toString('base64url') : null,
    };
  }

  async getTag(id: string, db: Db = this.pool): Promise<TaxonomyTag> {
    const { rows } = await db.query<Row>(`${this.select('tag')} WHERE c.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException('Tag not found');
    return toTag(rows[0]);
  }

  async createTag(input: TagCreate, actor: Actor): Promise<TaxonomyTag> {
    const id = await withTransaction(this.pool, async (db) => {
      await this.requireLocales(db, Object.keys(input.labels));
      const key = this.keyFor(input.key, input.labels);
      await this.requireImage(db, input.imageId);
      const created = await this.guard(() => db.query<{ id: string }>('INSERT INTO tag (key, image_id) VALUES ($1, $2) RETURNING id', [key, input.imageId ?? null]));
      const tagId = created.rows[0]!.id;
      await this.writeLabels(db, 'tag', tagId, key, input.labels);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.tag_create', objectType: 'tag', objectId: tagId,
          requestId: actor.requestId, metadata: { key, locales: Object.keys(input.labels) } },
        db,
      );
      return tagId;
    });
    return this.getTag(id);
  }

  async updateTag(id: string, input: TagUpdate, actor: Actor): Promise<TaxonomyTag> {
    await withTransaction(this.pool, async (db) => {
      const found = await db.query<{ key: string }>('SELECT key FROM tag WHERE id = $1 FOR UPDATE', [id]);
      if (!found.rows[0]) throw new NotFoundException('Tag not found');
      if (input.status !== undefined) await db.query('UPDATE tag SET status = $2 WHERE id = $1', [id, input.status]);
      if (input.imageId !== undefined) {
        await this.requireImage(db, input.imageId);
        await db.query('UPDATE tag SET image_id = $2 WHERE id = $1', [id, input.imageId]);
      }
      if (input.labels) await this.applyLabels(db, 'tag', id, found.rows[0].key, input.labels);
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'taxonomy.tag_update', objectType: 'tag', objectId: id,
          requestId: actor.requestId, metadata: { changed: Object.keys(input), locales: input.labels ? Object.keys(input.labels) : [] } },
        db,
      );
    });
    return this.getTag(id);
  }

  async deleteTag(id: string, actor: Actor): Promise<void> {
    await this.remove('tag', id, actor);
  }

  /** The tags of one news item, replaced as a whole. Tags belong to the news item, not to a revision. */
  async setNewsTags(newsId: string, tagIds: string[], actor: Actor): Promise<TaxonomyTag[]> {
    await withTransaction(this.pool, async (db) => {
      const news = await db.query<{ status: string }>('SELECT status FROM news WHERE id = $1 FOR UPDATE', [newsId]);
      if (!news.rows[0]) throw new NotFoundException('News not found');
      if (news.rows[0].status === 'ARCHIVED') throw new ConflictException({ message: 'Archived news cannot be edited', reason: 'news_archived' });
      if (tagIds.length > 0) {
        const usable = await db.query(`SELECT 1 FROM tag WHERE id = ANY ($1::uuid[]) AND status <> 'archived'`, [tagIds]);
        if (usable.rowCount !== tagIds.length) throw new BadRequestException('Some of those tags do not exist or are archived');
      }
      const current = await db.query<{ tag_id: string }>('SELECT tag_id FROM news_tag WHERE news_id = $1', [newsId]);
      const had = new Set(current.rows.map((r) => r.tag_id));
      const want = new Set(tagIds);
      const added = tagIds.filter((t) => !had.has(t));
      const removed = [...had].filter((t) => !want.has(t));
      if (removed.length > 0) await db.query('DELETE FROM news_tag WHERE news_id = $1 AND tag_id = ANY ($2::uuid[])', [newsId, removed]);
      if (added.length > 0) await db.query('INSERT INTO news_tag (news_id, tag_id) SELECT $1, unnest($2::uuid[])', [newsId, added]);
      if (added.length > 0 || removed.length > 0) {
        await db.query('UPDATE news SET updated_at = now() WHERE id = $1', [newsId]);
        await this.audit.record(
          { actorType: 'human', actorId: actor.principal.subject, action: 'news.tags_update', objectType: 'news', objectId: newsId, newsId,
            requestId: actor.requestId, metadata: { added, removed } },
          db,
        );
      }
    });
    return this.tagsOfNews(newsId);
  }

  async tagsOfNews(newsId: string, db: Db = this.pool): Promise<TaxonomyTag[]> {
    const { rows } = await db.query<Row>(
      `${this.select('tag')} WHERE c.id IN (SELECT tag_id FROM news_tag WHERE news_id = $1) ORDER BY c.key`, [newsId]);
    return rows.map(toTag);
  }

  // ------------------------------------------------------------- what readers get

  /**
   * The news menu in one language: parent menus with their child menus. Only categories that are active,
   * shown in the menu and named in that language appear; a child under a parent that is hidden goes with it.
   */
  async navigation(locale: string): Promise<PublicNavItem[]> {
    await this.requireActiveLocale(locale);
    const { rows } = await this.pool.query<PublicTaxonomyRef & { id: string; parent_id: string | null }>(
      `SELECT c.id, c.parent_id, c.key, l.name, l.slug FROM category c JOIN category_label l ON l.category_id = c.id AND l.locale = $1
        WHERE c.status = 'active' AND c.show_in_menu ORDER BY c.position, c.key`,
      [locale],
    );
    const ref = (r: PublicTaxonomyRef): PublicTaxonomyRef => ({ key: r.key, name: r.name, slug: r.slug });
    const tops = rows.filter((r) => r.parent_id === null);
    return tops.map((p) => ({ ...ref(p), children: rows.filter((r) => r.parent_id === p.id).map(ref) }));
  }

  /** The regions in one language, in order. Only regions that are active and named in that language appear. */
  async publicRegions(locale: string): Promise<PublicRegion[]> {
    await this.requireActiveLocale(locale);
    const { rows } = await this.pool.query<PublicRegion>(
      `SELECT r.key, l.name, l.slug, l.description FROM region r JOIN region_label l ON l.region_id = r.id AND l.locale = $1
        WHERE r.status = 'active' ORDER BY r.position, r.key`,
      [locale],
    );
    return rows;
  }

  /**
   * For a list address that no longer exists: the same list at its current address, when the section, region or
   * tag was renamed. Null when the address was never used. Only asked after a 404, so the lookup costs nothing
   * on the normal path.
   */
  async movedList(locale: string, q: { category?: string; tag?: string; region?: string }): Promise<{ param: 'category' | 'tag' | 'region'; slug: string } | null> {
    const kinds = [
      ['category', q.category, 'category_id', 'category_label'],
      ['tag', q.tag, 'tag_id', 'tag_label'],
      ['region', q.region, 'region_id', 'region_label'],
    ] as const;
    for (const [param, old, fk, labels] of kinds) {
      if (!old) continue;
      const { rows } = await this.pool.query<{ slug: string }>(
        `SELECT l.slug FROM taxonomy_slug_history h JOIN ${labels} l ON l.${fk} = h.${fk} AND l.locale = h.locale
          WHERE h.locale = $1 AND h.slug = $2`, [locale, old]);
      if (rows[0]) return { param, slug: rows[0].slug };
    }
    return null;
  }

  /** Active tags that have a name in this language, for choosing tags from a text. Capped, in key order. */
  async tagCandidates(locale: string, limit = 400): Promise<Array<{ id: string; key: string; name: string }>> {
    const { rows } = await this.pool.query<{ id: string; key: string; name: string }>(
      `SELECT t.id, t.key, l.name FROM tag t JOIN tag_label l ON l.tag_id = t.id AND l.locale = $1
        WHERE t.status = 'active' ORDER BY t.key LIMIT $2`, [locale, limit]);
    return rows;
  }

  /** Published news in one language, newest first, optionally of one category or tag. */
  async publicNews(locale: string, q: { category?: string; tag?: string; region?: string; format?: NewsFormat; excludeFormat?: NewsFormat; ids?: string[]; limit: number; cursor?: string }): Promise<PublicNewsList> {
    await this.requireActiveLocale(locale);
    if ([q.category, q.tag, q.region].filter(Boolean).length > 1) throw new BadRequestException('Filter by a category, a tag or a region, not more than one');
    let filter: PublicNewsList['filter'] = null;
    let categoryId: string | null = null;
    let tagId: string | null = null;
    let regionId: string | null = null;
    if (q.category) {
      const { rows } = await this.pool.query(
        `SELECT c.id, l.name, l.slug, l.description FROM category c JOIN category_label l ON l.category_id = c.id
          WHERE l.locale = $1 AND l.slug = $2 AND c.status <> 'archived'`, [locale, q.category]);
      if (!rows[0]) throw new NotFoundException('Not found');
      categoryId = rows[0].id;
      filter = { type: 'category', name: rows[0].name, slug: rows[0].slug, description: rows[0].description, image: null };
    } else if (q.region) {
      const { rows } = await this.pool.query(
        `SELECT r.id, l.name, l.slug, l.description FROM region r JOIN region_label l ON l.region_id = r.id
          WHERE l.locale = $1 AND l.slug = $2 AND r.status <> 'archived'`, [locale, q.region]);
      if (!rows[0]) throw new NotFoundException('Not found');
      regionId = rows[0].id;
      filter = { type: 'region', name: rows[0].name, slug: rows[0].slug, description: rows[0].description, image: null };
    } else if (q.tag) {
      const { rows } = await this.pool.query(
        `SELECT t.id, t.image_id, l.name, l.slug, l.description FROM tag t JOIN tag_label l ON l.tag_id = t.id
          WHERE l.locale = $1 AND l.slug = $2 AND t.status <> 'archived'`, [locale, q.tag]);
      if (!rows[0]) throw new NotFoundException('Not found');
      tagId = rows[0].id;
      filter = { type: 'tag', name: rows[0].name, slug: rows[0].slug, description: rows[0].description, image: await this.publicImage(rows[0].image_id) };
    }

    let cursorAt: string | null = null;
    let cursorId: string | null = null;
    if (q.cursor) {
      try {
        [cursorAt, cursorId] = JSON.parse(Buffer.from(q.cursor, 'base64url').toString()) as [string, string];
        if (typeof cursorAt !== 'string' || typeof cursorId !== 'string') throw new Error();
      } catch {
        throw new BadRequestException('Invalid cursor');
      }
    }
    // Only the filters asked for are in the SQL. "$n IS NULL OR EXISTS (...)" hides the link table from the
    // planner, which then walks the whole newest-first feed for a rare section, region or tag; as plain EXISTS
    // it is a semi-join that can start from the link table's own index (category_id, news_id and the like).
    const params: unknown[] = [locale, LIVE_STATUSES];
    const bind = (value: unknown) => `$${params.push(value)}`;
    const filters: string[] = [];
    if (categoryId) {
      const id = bind(categoryId);
      filters.push(`EXISTS (SELECT 1 FROM news_category x JOIN category xc ON xc.id = x.category_id
                             WHERE x.news_id = s.id AND (x.category_id = ${id} OR xc.parent_id = ${id}))`);
    }
    if (tagId) filters.push(`EXISTS (SELECT 1 FROM news_tag x WHERE x.news_id = s.id AND x.tag_id = ${bind(tagId)})`);
    if (regionId) filters.push(`EXISTS (SELECT 1 FROM news_region nr WHERE nr.news_id = s.id AND nr.region_id = ${bind(regionId)})`);
    if (cursorAt) filters.push(`(s.published_at, s.id) < (${bind(cursorAt)}::timestamptz, ${bind(cursorId)}::uuid)`);
    if (q.format) filters.push(`s.format = ${bind(q.format)}`);
    if (q.excludeFormat) filters.push(`s.format <> ${bind(q.excludeFormat)}`);
    // Only these news items (the ranked ids of most read). The caller puts them in order.
    if (q.ids) filters.push(`s.id = ANY (${bind(q.ids)}::uuid[])`);
    const limit = bind(q.limit + 1);
    const { rows } = await this.pool
      .query(
        `SELECT s.id, s.short_id, s.format, ss.slug, st.title, st.dek, s.published_at, s.published_revision_id,
                to_char(s.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_at,
                cl.name AS category_name, cl.slug AS category_slug, c.key AS category_key
           FROM news s
           JOIN news_translation st ON st.revision_id = s.published_revision_id AND st.locale = $1
           JOIN news_slug ss ON ss.news_id = s.id AND ss.locale = $1 AND ss.is_current
           LEFT JOIN news_category pc ON pc.news_id = s.id AND pc.is_primary
           LEFT JOIN category c ON c.id = pc.category_id AND c.status <> 'archived'
           LEFT JOIN category_label cl ON cl.category_id = c.id AND cl.locale = $1
          WHERE s.status = ANY ($2) AND s.published_revision_id IS NOT NULL
            ${filters.map((f) => `AND ${f}`).join('\n            ')}
          ORDER BY s.published_at DESC, s.id DESC LIMIT ${limit}`,
        params,
      )
      .catch((e) => {
        if (isPgError(e) && (e.code === '22007' || e.code === '22P02')) throw new BadRequestException('Invalid cursor');
        throw e;
      });
    const page = rows.slice(0, q.limit);
    const images = await this.leadImages(page.map((r) => r.published_revision_id as string));
    return {
      filter,
      items: page.map((r) => ({
        id: r.id, shortId: r.short_id, format: r.format, slug: r.slug, title: r.title, dek: r.dek, publishedAt: r.published_at.toISOString(),
        category: r.category_name ? { key: r.category_key, name: r.category_name, slug: r.category_slug } : null,
        image: images.get(r.published_revision_id) ?? null,
      })),
      nextCursor: rows.length > q.limit ? Buffer.from(JSON.stringify([page[page.length - 1]!.cursor_at, page[page.length - 1]!.id])).toString('base64url') : null,
    };
  }

  /**
   * The lead image of each published revision, as readers may see it (ready, allowed on the web, rights not expired,
   * credited or licensed), or none. The same rule as a tag's picture.
   */
  private async leadImages(revisionIds: string[]): Promise<Map<string, PublicMedia>> {
    const out = new Map<string, PublicMedia>();
    if (revisionIds.length === 0) return out;
    const { rows } = await this.pool.query<{ revision_id: string; media_asset_id: string }>(
      `SELECT DISTINCT ON (revision_id) revision_id, media_asset_id FROM revision_media
        WHERE revision_id = ANY ($1::uuid[]) AND role = 'lead' ORDER BY revision_id, position`, [revisionIds]);
    const media = new Map<string, PublicMedia | null>();
    await Promise.all([...new Set(rows.map((r) => r.media_asset_id))].map(async (id) => media.set(id, await this.publicImage(id))));
    for (const r of rows) {
      const image = media.get(r.media_asset_id);
      if (image) out.set(r.revision_id, image);
    }
    return out;
  }

  /** A tag's picture as readers may see it: ready, allowed on the web, rights not expired, and credited or licensed. Otherwise none. */
  async publicImage(imageId: string | null): Promise<PublicMedia | null> {
    if (!imageId) return null;
    const { rows } = await this.pool.query(
      `SELECT id, width, height, alt_text, attribution, license FROM media_asset
        WHERE id = $1 AND processing_state = 'ready' AND 'web' = ANY (permitted_channels)
          AND (rights_expires_at IS NULL OR rights_expires_at > now())
          AND (btrim(coalesce(license, '')) <> '' OR btrim(coalesce(attribution, '')) <> '')`, [imageId]);
    const r = rows[0];
    return r ? {
      id: r.id, width: r.width, height: r.height, alt: r.alt_text, attribution: r.attribution, license: r.license,
      urls: { thumb: `/public/media/${r.id}/thumb`, card: `/public/media/${r.id}/card`, hero: `/public/media/${r.id}/hero` },
    } : null;
  }

  /**
   * The sections and tags of a news item as a reader of this language sees them: `category` is the primary
   * section, `categories` all of them with the primary first. One with no label here is left out.
   */
  async publicRefs(newsId: string, locale: string): Promise<{ category: PublicTaxonomyRef | null; categories: PublicTaxonomyRef[]; regions: PublicTaxonomyRef[]; tags: PublicTaxonomyRef[] }> {
    const [categories, tags, regions] = await Promise.all([
      this.pool.query<PublicTaxonomyRef & { is_primary: boolean }>(
        `SELECT c.key, l.name, l.slug, nc.is_primary
           FROM news_category nc
           JOIN category c ON c.id = nc.category_id AND c.status <> 'archived'
           JOIN category_label l ON l.category_id = c.id AND l.locale = $2
          WHERE nc.news_id = $1 ORDER BY nc.is_primary DESC, c.position, c.key`, [newsId, locale]),
      this.pool.query<PublicTaxonomyRef>(
        `SELECT t.key, l.name, l.slug FROM news_tag st JOIN tag t ON t.id = st.tag_id AND t.status <> 'archived'
           JOIN tag_label l ON l.tag_id = t.id AND l.locale = $2
          WHERE st.news_id = $1 ORDER BY l.name`, [newsId, locale]),
      this.pool.query<PublicTaxonomyRef>(
        `SELECT r.key, l.name, l.slug FROM news_region nr JOIN region r ON r.id = nr.region_id AND r.status <> 'archived'
           JOIN region_label l ON l.region_id = r.id AND l.locale = $2
          WHERE nr.news_id = $1 ORDER BY r.position, r.key`, [newsId, locale]),
    ]);
    const refs = categories.rows.map(({ key, name, slug }) => ({ key, name, slug }));
    return { category: categories.rows[0]?.is_primary ? refs[0]! : null, categories: refs, regions: regions.rows, tags: tags.rows };
  }

  // ------------------------------------------------------------------- internals

  private select(kind: Kind): string {
    const k = KIND[kind];
    const usage = { category: 'SELECT count(*) FROM news_category x WHERE x.category_id = c.id', tag: 'SELECT count(*) FROM news_tag x WHERE x.tag_id = c.id', region: 'SELECT count(*) FROM news_region x WHERE x.region_id = c.id' }[kind];
    const description = k.hasDescription ? 'l.description' : 'NULL::text';
    return `SELECT c.id, c.key, ${{ category: 'c.show_in_menu, c.parent_id, c.position,', tag: 'c.image_id,', region: 'c.position,' }[kind]} c.status,
                   (${usage})::int AS usage_count,
                   COALESCE((SELECT jsonb_agg(jsonb_build_object('locale', l.locale, 'name', l.name, 'slug', l.slug, 'description', ${description}, 'aliases', l.aliases) ORDER BY l.locale)
                               FROM ${k.labels} l WHERE l.${k.fk} = c.id), '[]'::jsonb) AS labels
              FROM ${k.table} c`;
  }

  /** The key: given, or made from the English-looking slug of a label. Never guessed from a script that has no Latin form. */
  private keyFor(given: string | undefined, labels: Record<string, LabelInput>): string {
    if (given) return given;
    for (const [locale, label] of Object.entries(labels).sort(([a], [b]) => (a === 'en' ? -1 : b === 'en' ? 1 : 0))) {
      const candidate = label.slug ?? slugify(label.name, '');
      if (KEY_FORMAT.test(candidate)) return candidate;
      void locale;
    }
    throw new BadRequestException('Give a key (lowercase letters, digits and hyphens): it cannot be made from names that are not in Latin letters.');
  }

  /** A parent must be a top-level category, and a category with children cannot become a child: the menu has two levels. */
  private async requireParent(db: Db, id: string | null, parentId: string | null | undefined): Promise<void> {
    if (!parentId) return;
    if (parentId === id) throw new BadRequestException('A category cannot be its own parent');
    const parent = await db.query<{ parent_id: string | null }>('SELECT parent_id FROM category WHERE id = $1', [parentId]);
    if (!parent.rows[0]) throw new BadRequestException('That parent category does not exist');
    if (parent.rows[0].parent_id !== null) throw new BadRequestException('The menu has two levels: a child menu cannot be a parent');
    if (id) {
      const kids = await db.query('SELECT 1 FROM category WHERE parent_id = $1 LIMIT 1', [id]);
      if (kids.rowCount) throw new BadRequestException('This category has child menus, so it cannot become a child itself');
    }
  }

  private async requireImage(db: Db, imageId: string | null | undefined): Promise<void> {
    if (!imageId) return;
    const { rowCount } = await db.query('SELECT 1 FROM media_asset WHERE id = $1', [imageId]);
    if (rowCount === 0) throw new BadRequestException('That image is not in the media library');
  }

  private async requireLocales(db: Db, codes: string[]): Promise<void> {
    if (codes.length === 0) return;
    const { rows } = await db.query<{ code: string }>('SELECT code FROM locale WHERE code = ANY ($1::text[]) AND active', [codes]);
    const known = new Set(rows.map((r) => r.code));
    const unknown = codes.filter((c) => !known.has(c));
    if (unknown.length > 0) throw new BadRequestException(`Unknown or inactive language: ${unknown.join(', ')}`);
  }

  private async requireActiveLocale(code: string): Promise<void> {
    const { rowCount } = await this.pool.query('SELECT 1 FROM locale WHERE code = $1 AND active', [code]);
    if (rowCount === 0) throw new NotFoundException('Not found');
  }

  private async writeLabels(db: Db, kind: Kind, id: string, key: string, labels: Record<string, LabelInput>): Promise<void> {
    for (const [locale, label] of Object.entries(labels)) await this.upsertLabel(db, kind, id, key, locale, label, false);
  }

  private async upsertLabel(db: Db, kind: Kind, id: string, key: string, locale: string, label: LabelInput, keepSlug: boolean): Promise<void> {
    const k = KIND[kind];
    const existing = await db.query<{ slug: string }>(`SELECT slug FROM ${k.labels} WHERE ${k.fk} = $1 AND locale = $2`, [id, locale]);
    const was = existing.rows[0]?.slug;
    // On an update the address is kept unless one is given: changing a name must not move a live page.
    const slug = label.slug ?? (keepSlug ? was : undefined) ?? slugify(label.name, key);
    // A replaced address keeps working (a redirect); an address that is in use again no longer redirects.
    await db.query(`DELETE FROM taxonomy_slug_history WHERE ${k.fk} IS NOT NULL AND locale = $1 AND slug = $2`, [locale, slug]);
    if (was && was !== slug) {
      await db.query(
        `INSERT INTO taxonomy_slug_history (locale, slug, ${k.fk}) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [locale, was, id]);
    }
    await this.guard(() =>
      k.hasDescription
        ? db.query(
            `INSERT INTO ${k.labels} (${k.fk}, locale, name, slug, description, aliases) VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (${k.fk}, locale) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, aliases = EXCLUDED.aliases`,
            [id, locale, label.name, slug, label.description ?? null, label.aliases ?? []])
        : db.query(
            `INSERT INTO ${k.labels} (${k.fk}, locale, name, slug, aliases) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (${k.fk}, locale) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, aliases = EXCLUDED.aliases`,
            [id, locale, label.name, slug, label.aliases ?? []]),
    );
  }

  private async applyLabels(db: Db, kind: Kind, id: string, key: string, labels: Record<string, LabelInput | null>): Promise<void> {
    const k = KIND[kind];
    const set = Object.entries(labels).filter((e): e is [string, LabelInput] => e[1] !== null);
    const drop = Object.entries(labels).filter(([, v]) => v === null).map(([l]) => l);
    await this.requireLocales(db, set.map(([l]) => l));
    for (const [locale, label] of set) await this.upsertLabel(db, kind, id, key, locale, label, true);
    if (drop.length > 0) await db.query(`DELETE FROM ${k.labels} WHERE ${k.fk} = $1 AND locale = ANY ($2::text[])`, [id, drop]);
    const left = await db.query(`SELECT 1 FROM ${k.labels} WHERE ${k.fk} = $1`, [id]);
    if (left.rowCount === 0) throw new BadRequestException('An item needs a name in at least one language');
  }

  private async remove(kind: Kind, id: string, actor: Actor): Promise<void> {
    const k = KIND[kind];
    await withTransaction(this.pool, async (db) => {
      if (kind === 'category') {
        const kids = await db.query('SELECT 1 FROM category WHERE parent_id = $1 LIMIT 1', [id]);
        if (kids.rowCount) throw new ConflictException({ message: 'This category has child menus. Move or delete them first.', reason: 'has_children' });
      }
      try {
        const res = await db.query(`DELETE FROM ${k.table} WHERE id = $1`, [id]);
        if (res.rowCount === 0) throw new NotFoundException(`${{ tag: 'Tag', category: 'Category', region: 'Region' }[kind]} not found`);
      } catch (err) {
        if (isPgError(err) && err.code === '23503') {
          throw new ConflictException({ message: `This ${kind} is used by news. Archive it instead.`, reason: 'in_use' });
        }
        throw err;
      }
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: `taxonomy.${kind}_delete`, objectType: kind, objectId: id, requestId: actor.requestId },
        db,
      );
    });
  }

  /** Turns "that key or address is taken" into a message that says which. */
  private async guard<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (err) {
      if (isPgError(err) && err.code === '23505') {
        const detail = (err as { detail?: string }).detail ?? '';
        const slug = /\(locale, slug\)=\(([^,]+), ([^)]*)\)/.exec(detail);
        if (slug) throw new ConflictException({ message: `The address "${slug[2]}" is already used in ${slug[1]}`, reason: 'slug_taken', locale: slug[1], slug: slug[2] });
        throw new ConflictException({ message: 'That key is already used', reason: 'key_taken' });
      }
      throw err;
    }
  }
}

const toCategory = (r: Row): TaxonomyCategory => ({
  id: r.id, key: r.key, showInMenu: r.show_in_menu ?? true, parentId: r.parent_id ?? null, position: r.position ?? 0, status: r.status, usageCount: r.usage_count, labels: r.labels,
});
const toRegion = (r: Row): TaxonomyRegion => ({ id: r.id, key: r.key, position: r.position ?? 0, status: r.status, usageCount: r.usage_count, labels: r.labels });
const toTag = (r: Row): TaxonomyTag => ({ id: r.id, key: r.key, imageId: r.image_id ?? null, status: r.status, usageCount: r.usage_count, labels: r.labels });
