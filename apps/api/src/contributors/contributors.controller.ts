import { BadRequestException, Body, Controller, Get, HttpCode, Inject, NotFoundException, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import {
  contributorCreateSchema, contributorUpdateSchema, socialNetworks, type ContributorProfile, type ContributorProfileList, type Principal,
} from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';
import { AuditService } from '../audit/audit.service';
import { CurrentPrincipal, RequireCapability } from '../auth/decorators';
import { parse } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';

type Db = Pool | PoolClient;

interface Row {
  id: string; kind: ContributorProfile['kind']; display_name: string; bio: string | null; contact_email: string | null;
  image_id: string | null; social_links: Record<string, string | null>; usage_count: number; created_at: Date;
}

const SELECT = `SELECT c.id, c.kind, c.display_name, c.bio, c.contact_email, c.image_id, c.social_links, c.created_at,
                       (SELECT count(*) FROM news_contributor nc WHERE nc.contributor_id = c.id)::int AS usage_count
                  FROM contributor c`;

/** One address per network, null where none is set, in the order the site shows them. */
const links = (stored: Record<string, string | null>) => Object.fromEntries(socialNetworks.map((n) => [n, stored[n] ?? null])) as ContributorProfile['socialLinks'];
const toProfile = (r: Row): ContributorProfile => ({
  id: r.id, kind: r.kind, displayName: r.display_name, bio: r.bio, contactEmail: r.contact_email,
  imageId: r.image_id, socialLinks: links(r.social_links), usageCount: r.usage_count,
});
/** Empty addresses are not stored. */
const clean = (given: Record<string, string | null | undefined>) =>
  Object.fromEntries(socialNetworks.flatMap((n) => (given[n]?.trim() ? [[n, given[n]!.trim()]] : [])));

/** Writers, editors and photographers are people with a profile: a name, a bio, a picture and social accounts. Newsroom-only. */
@Controller('contributors')
export class ContributorsController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** The people directory, by name. The search matches part of a name. */
  @Get('directory')
  @RequireCapability('news.edit')
  async directory(@Query('query') query: unknown, @Query('limit') limit: unknown, @Query('cursor') cursor: unknown): Promise<ContributorProfileList> {
    const q = parse(z.string().trim().max(100).optional(), query);
    const max = parse(z.coerce.number().int().min(1).max(200).default(50), limit);
    const after = parse(z.string().max(300).optional(), cursor);
    const { rows } = await this.pool.query<Row>(
      `${SELECT}
        WHERE ($1::text IS NULL OR c.display_name ILIKE '%' || replace(replace(replace($1, '\\', '\\\\'), '%', '\\%'), '_', '\\_') || '%')
          AND ($2::text IS NULL OR (lower(c.display_name), c.id::text) > (lower(split_part($2, '|', 1)), split_part($2, '|', 2)))
        ORDER BY lower(c.display_name), c.id LIMIT $3`,
      [q || null, after ? Buffer.from(after, 'base64url').toString() : null, max + 1],
    );
    const page = rows.slice(0, max);
    const last = page[page.length - 1];
    return {
      items: page.map(toProfile),
      nextCursor: rows.length > max && last ? Buffer.from(`${last.display_name}|${last.id}`).toString('base64url') : null,
    };
  }

  @Get(':id')
  @RequireCapability('news.edit')
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<ContributorProfile> {
    return toProfile(await this.load(this.pool, id));
  }

  @Post()
  @HttpCode(201)
  @RequireCapability('news.edit')
  async create(@Body() body: unknown, @CurrentPrincipal() principal: Principal, @Req() req: FastifyRequest): Promise<ContributorProfile> {
    const input = parse(contributorCreateSchema, body);
    const id = await withTransaction(this.pool, async (db) => {
      await this.requireImage(db, input.imageId);
      const { rows } = await db.query<{ id: string }>(
        `INSERT INTO contributor (kind, display_name, bio, contact_email, image_id, social_links) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [input.kind, input.displayName, input.bio || null, input.contactEmail || null, input.imageId ?? null, JSON.stringify(clean(input.socialLinks ?? {}))],
      );
      await this.audit.record(
        { actorType: 'human', actorId: principal.subject, action: 'contributor.create', objectType: 'contributor', objectId: rows[0]!.id, requestId: String(req.id) },
        db,
      );
      return rows[0]!.id;
    });
    return toProfile(await this.load(this.pool, id));
  }

  /** Changes only what is sent. A social link left empty is removed; `imageId: null` removes the picture. */
  @Put(':id')
  @RequireCapability('news.edit')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown, @CurrentPrincipal() principal: Principal, @Req() req: FastifyRequest): Promise<ContributorProfile> {
    const input = parse(contributorUpdateSchema, body);
    await withTransaction(this.pool, async (db) => {
      const before = await db.query<Row>(`${SELECT} WHERE c.id = $1 FOR UPDATE OF c`, [id]);
      if (!before.rows[0]) throw new NotFoundException('Person not found');
      if (input.imageId !== undefined) await this.requireImage(db, input.imageId);
      const has = (k: keyof typeof input) => k in input;
      await db.query(
        `UPDATE contributor SET kind = CASE WHEN $2::boolean THEN $3 ELSE kind END,
                                display_name = CASE WHEN $4::boolean THEN $5 ELSE display_name END,
                                bio = CASE WHEN $6::boolean THEN $7 ELSE bio END,
                                contact_email = CASE WHEN $8::boolean THEN $9 ELSE contact_email END,
                                image_id = CASE WHEN $10::boolean THEN $11::uuid ELSE image_id END,
                                social_links = CASE WHEN $12::boolean THEN $13::jsonb ELSE social_links END
          WHERE id = $1`,
        [id, has('kind'), input.kind ?? null, has('displayName'), input.displayName ?? null, has('bio'), input.bio || null,
          has('contactEmail'), input.contactEmail || null, has('imageId'), input.imageId ?? null,
          has('socialLinks'), JSON.stringify(clean(input.socialLinks ?? {}))],
      );
      await this.audit.record(
        { actorType: 'human', actorId: principal.subject, action: 'contributor.update', objectType: 'contributor', objectId: id, requestId: String(req.id),
          metadata: { changed: Object.keys(input) } },
        db,
      );
    });
    return toProfile(await this.load(this.pool, id));
  }

  private async load(db: Db, id: string): Promise<Row> {
    const { rows } = await db.query<Row>(`${SELECT} WHERE c.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException('Person not found');
    return rows[0];
  }

  private async requireImage(db: Db, imageId: string | null | undefined): Promise<void> {
    if (!imageId) return;
    const { rows } = await db.query<{ mime_type: string }>('SELECT mime_type FROM media_asset WHERE id = $1', [imageId]);
    if (!rows[0]) throw new BadRequestException('Unknown image');
    if (!rows[0].mime_type.startsWith('image/')) throw new BadRequestException('The picture must be an image');
  }
}
