import {
  BadRequestException, ConflictException, Inject, Injectable, NotFoundException,
} from '@nestjs/common';
import type {
  CategoryCreate, CategoryOrder, CategoryUpdate, LabelInput, PublicNewsList, PublicTaxonomyRef, TagCreate, TagUpdate,
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

type Kind = 'category' | 'tag';
type Db = Pool | PoolClient;

// Fixed names, never built from input: the SQL below interpolates only these.
const KIND = {
  category: { table: 'category', labels: 'category_label', fk: 'category_id', hasDescription: true },
  tag: { table: 'tag', labels: 'tag_label', fk: 'tag_id', hasDescription: false },
} as const;

interface Row {
  id: string; key: string; show_in_menu?: boolean; position?: number; status: TaxonomyTag['status'];
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
      const next = await db.query<{ n: number }>('SELECT COALESCE(max(position), 0) + 1 AS n FROM category');
      const created = await this.guard(() =>
        db.query<{ id: string }>('INSERT INTO category (key, show_in_menu, position) VALUES ($1, $2, $3) RETURNING id', [key, input.showInMenu, next.rows[0]!.n]));
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
      const created = await this.guard(() => db.query<{ id: string }>('INSERT INTO tag (key) VALUES ($1) RETURNING id', [key]));
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

  /** The news menu in one language: only categories that are active, shown in the menu and named in that language. */
  async navigation(locale: string): Promise<PublicTaxonomyRef[]> {
    await this.requireActiveLocale(locale);
    const { rows } = await this.pool.query<PublicTaxonomyRef>(
      `SELECT c.key, l.name, l.slug FROM category c JOIN category_label l ON l.category_id = c.id AND l.locale = $1
        WHERE c.status = 'active' AND c.show_in_menu ORDER BY c.position, c.key`,
      [locale],
    );
    return rows;
  }

  /** Published news in one language, newest first, optionally of one category or tag. */
  async publicNews(locale: string, q: { category?: string; tag?: string; limit: number; cursor?: string }): Promise<PublicNewsList> {
    await this.requireActiveLocale(locale);
    if (q.category && q.tag) throw new BadRequestException('Filter by a category or a tag, not both');
    let filter: PublicNewsList['filter'] = null;
    let categoryId: string | null = null;
    let tagId: string | null = null;
    if (q.category) {
      const { rows } = await this.pool.query(
        `SELECT c.id, l.name, l.slug, l.description FROM category c JOIN category_label l ON l.category_id = c.id
          WHERE l.locale = $1 AND l.slug = $2 AND c.status <> 'archived'`, [locale, q.category]);
      if (!rows[0]) throw new NotFoundException('Not found');
      categoryId = rows[0].id;
      filter = { type: 'category', name: rows[0].name, slug: rows[0].slug, description: rows[0].description };
    } else if (q.tag) {
      const { rows } = await this.pool.query(
        `SELECT t.id, l.name, l.slug FROM tag t JOIN tag_label l ON l.tag_id = t.id
          WHERE l.locale = $1 AND l.slug = $2 AND t.status <> 'archived'`, [locale, q.tag]);
      if (!rows[0]) throw new NotFoundException('Not found');
      tagId = rows[0].id;
      filter = { type: 'tag', name: rows[0].name, slug: rows[0].slug, description: null };
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
    const { rows } = await this.pool
      .query(
        `SELECT s.id, ss.slug, st.title, st.dek, s.published_at,
                to_char(s.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_at,
                cl.name AS category_name, cl.slug AS category_slug, c.key AS category_key
           FROM news s
           JOIN news_translation st ON st.revision_id = s.published_revision_id AND st.locale = $1
           JOIN news_slug ss ON ss.news_id = s.id AND ss.locale = $1 AND ss.is_current
           LEFT JOIN category c ON c.id = s.category_id AND c.status <> 'archived'
           LEFT JOIN category_label cl ON cl.category_id = c.id AND cl.locale = $1
          WHERE s.status = ANY ($2) AND s.published_revision_id IS NOT NULL
            AND ($3::uuid IS NULL OR s.category_id = $3)
            AND ($4::uuid IS NULL OR EXISTS (SELECT 1 FROM news_tag x WHERE x.news_id = s.id AND x.tag_id = $4))
            AND ($5::timestamptz IS NULL OR (s.published_at, s.id) < ($5::timestamptz, $6::uuid))
          ORDER BY s.published_at DESC, s.id DESC LIMIT $7`,
        [locale, LIVE_STATUSES, categoryId, tagId, cursorAt, cursorId, q.limit + 1],
      )
      .catch((e) => {
        if (isPgError(e) && (e.code === '22007' || e.code === '22P02')) throw new BadRequestException('Invalid cursor');
        throw e;
      });
    const page = rows.slice(0, q.limit);
    return {
      filter,
      items: page.map((r) => ({
        id: r.id, slug: r.slug, title: r.title, dek: r.dek, publishedAt: r.published_at.toISOString(),
        category: r.category_name ? { key: r.category_key, name: r.category_name, slug: r.category_slug } : null,
      })),
      nextCursor: rows.length > q.limit ? Buffer.from(JSON.stringify([page[page.length - 1]!.cursor_at, page[page.length - 1]!.id])).toString('base64url') : null,
    };
  }

  /** The category and tags of a news item as a reader of this language sees them. An item with no label here is left out. */
  async publicRefs(newsId: string, categoryId: string | null, locale: string): Promise<{ category: PublicTaxonomyRef | null; tags: PublicTaxonomyRef[] }> {
    const [category, tags] = await Promise.all([
      categoryId
        ? this.pool.query<PublicTaxonomyRef>(
            `SELECT c.key, l.name, l.slug FROM category c JOIN category_label l ON l.category_id = c.id AND l.locale = $2
              WHERE c.id = $1 AND c.status <> 'archived'`, [categoryId, locale])
        : Promise.resolve({ rows: [] as PublicTaxonomyRef[] }),
      this.pool.query<PublicTaxonomyRef>(
        `SELECT t.key, l.name, l.slug FROM news_tag st JOIN tag t ON t.id = st.tag_id AND t.status <> 'archived'
           JOIN tag_label l ON l.tag_id = t.id AND l.locale = $2
          WHERE st.news_id = $1 ORDER BY l.name`, [newsId, locale]),
    ]);
    return { category: category.rows[0] ?? null, tags: tags.rows };
  }

  // ------------------------------------------------------------------- internals

  private select(kind: Kind): string {
    const k = KIND[kind];
    const usage = kind === 'category' ? 'SELECT count(*) FROM news s WHERE s.category_id = c.id' : 'SELECT count(*) FROM news_tag x WHERE x.tag_id = c.id';
    const description = k.hasDescription ? 'l.description' : 'NULL::text';
    return `SELECT c.id, c.key, ${kind === 'category' ? 'c.show_in_menu, c.position,' : ''} c.status,
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
    const existing = keepSlug ? await db.query<{ slug: string }>(`SELECT slug FROM ${k.labels} WHERE ${k.fk} = $1 AND locale = $2`, [id, locale]) : { rows: [] as Array<{ slug: string }> };
    // On an update the address is kept unless one is given: changing a name must not move a live page.
    const slug = label.slug ?? existing.rows[0]?.slug ?? slugify(label.name, key);
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
      try {
        const res = await db.query(`DELETE FROM ${k.table} WHERE id = $1`, [id]);
        if (res.rowCount === 0) throw new NotFoundException(`${kind === 'tag' ? 'Tag' : 'Category'} not found`);
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
  id: r.id, key: r.key, showInMenu: r.show_in_menu ?? true, position: r.position ?? 0, status: r.status, usageCount: r.usage_count, labels: r.labels,
});
const toTag = (r: Row): TaxonomyTag => ({ id: r.id, key: r.key, status: r.status, usageCount: r.usage_count, labels: r.labels });
