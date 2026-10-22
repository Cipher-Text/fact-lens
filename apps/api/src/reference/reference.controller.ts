import { Body, Controller, Get, HttpCode, Inject, Post, Query, Req } from '@nestjs/common';
import {
  contributorCreateSchema, editorialCapabilities, type Category, type Contributor, type Desk, type Locale, type Principal,
} from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { z } from 'zod';
import { AuditService } from '../audit/audit.service';
import { CurrentPrincipal, RequireAnyCapability, RequireCapability } from '../auth/decorators';
import { parse } from '../common/http';
import { PG_POOL } from '../db/pool';

/** Reference data the newsroom needs to fill in forms. Newsroom-only; none of it is a public read model. */
@Controller()
export class ReferenceController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get('reference/desks')
  @RequireAnyCapability(...editorialCapabilities)
  async desks(): Promise<Desk[]> {
    const { rows } = await this.pool.query('SELECT id, key, name, active FROM desk WHERE active ORDER BY name');
    return rows;
  }

  @Get('reference/locales')
  @RequireAnyCapability(...editorialCapabilities)
  async locales(): Promise<Locale[]> {
    const { rows } = await this.pool.query('SELECT code, display_name, direction, active FROM locale WHERE active ORDER BY code');
    return rows.map((r) => ({ code: r.code, displayName: r.display_name, direction: r.direction, active: r.active }));
  }

  @Get('reference/categories')
  @RequireAnyCapability(...editorialCapabilities)
  async categories(): Promise<Category[]> {
    const { rows } = await this.pool.query(
      `SELECT c.id, c.key, c.parent_id, c.show_in_menu, c.position, c.status,
              COALESCE(jsonb_agg(jsonb_build_object('locale', l.locale, 'name', l.name, 'slug', l.slug, 'description', l.description, 'aliases', l.aliases) ORDER BY l.locale)
                       FILTER (WHERE l.locale IS NOT NULL), '[]'::jsonb) AS labels
         FROM category c LEFT JOIN category_label l ON l.category_id = c.id
        WHERE c.status = 'active' GROUP BY c.id ORDER BY c.position, c.key`,
    );
    return rows.map((r) => ({ id: r.id, key: r.key, parentId: r.parent_id, showInMenu: r.show_in_menu, position: r.position, status: r.status, labels: r.labels }));
  }

  @Get('contributors')
  @RequireAnyCapability(...editorialCapabilities)
  async contributors(@Query('query') query: unknown): Promise<Contributor[]> {
    const q = parse(z.string().trim().max(100).optional(), query);
    const { rows } = await this.pool.query(
      `SELECT id, kind, display_name, bio FROM contributor
        WHERE $1::text IS NULL OR display_name ILIKE '%' || replace(replace(replace($1, '\\', '\\\\'), '%', '\\%'), '_', '\\_') || '%'
        ORDER BY display_name LIMIT 50`,
      [q || null],
    );
    return rows.map((r) => ({ id: r.id, kind: r.kind, displayName: r.display_name, bio: r.bio }));
  }

  @Post('contributors')
  @HttpCode(201)
  @RequireCapability('story.edit')
  async createContributor(@Body() body: unknown, @CurrentPrincipal() principal: Principal, @Req() req: FastifyRequest): Promise<Contributor> {
    const input = parse(contributorCreateSchema, body);
    const { rows } = await this.pool.query(
      `INSERT INTO contributor (kind, display_name, bio) VALUES ($1, $2, $3) RETURNING id, kind, display_name, bio`,
      [input.kind, input.displayName, input.bio ?? null],
    );
    const r = rows[0];
    await this.audit.record({
      actorType: 'human', actorId: principal.subject, action: 'contributor.create', objectType: 'contributor', objectId: r.id,
      requestId: String(req.id),
    });
    return { id: r.id, kind: r.kind, displayName: r.display_name, bio: r.bio };
  }
}
