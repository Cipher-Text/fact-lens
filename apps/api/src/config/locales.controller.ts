import { Body, ConflictException, Controller, Get, HttpCode, Inject, NotFoundException, Param, Post, Put, Req } from '@nestjs/common';
import { localeCreateSchema, localeUpdateSchema, type Locale, type Principal } from '@fact-lens/contracts';
import type { FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { CurrentPrincipal, RequireCapability } from '../auth/decorators';
import { isPgError, parse } from '../common/http';
import { PG_POOL } from '../db/pool';

interface Row { code: string; display_name: string; direction: 'ltr' | 'rtl'; active: boolean }
const toLocale = (r: Row): Locale => ({ code: r.code, displayName: r.display_name, direction: r.direction, active: r.active });

/**
 * The languages the platform can publish in. Adding one is data, not a release: categories and tags
 * can then be named in it, and news translated into it.
 */
@Controller('config/locales')
@RequireCapability('config.manage')
export class LocalesController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  async list(): Promise<Locale[]> {
    const { rows } = await this.pool.query<Row>('SELECT code, display_name, direction, active FROM locale ORDER BY code');
    return rows.map(toLocale);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Locale> {
    const input = parse(localeCreateSchema, body);
    try {
      const { rows } = await this.pool.query<Row>(
        'INSERT INTO locale (code, display_name, direction) VALUES ($1, $2, $3) RETURNING code, display_name, direction, active',
        [input.code, input.displayName, input.direction],
      );
      await this.audit.record({ actorType: 'human', actorId: p.subject, action: 'locale.create', objectType: 'locale', objectId: input.code, requestId: String(req.id) });
      return toLocale(rows[0]!);
    } catch (err) {
      if (isPgError(err) && err.code === '23505') throw new ConflictException({ message: 'That language already exists', reason: 'locale_exists' });
      throw err;
    }
  }

  @Put(':code')
  async update(@Param('code') code: string, @Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Locale> {
    const input = parse(localeUpdateSchema, body);
    const { rows } = await this.pool.query<Row>(
      `UPDATE locale SET display_name = COALESCE($2, display_name), direction = COALESCE($3, direction), active = COALESCE($4, active)
        WHERE code = $1 RETURNING code, display_name, direction, active`,
      [code, input.displayName ?? null, input.direction ?? null, input.active ?? null],
    );
    if (!rows[0]) throw new NotFoundException('Language not found');
    await this.audit.record({
      actorType: 'human', actorId: p.subject, action: 'locale.update', objectType: 'locale', objectId: code, requestId: String(req.id), metadata: { changed: Object.keys(input) },
    });
    return toLocale(rows[0]);
  }
}
