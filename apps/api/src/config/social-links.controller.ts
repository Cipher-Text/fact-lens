import { Body, Controller, Get, Inject, Put, Req, Res } from '@nestjs/common';
import {
  parseConfigValue, socialNetworks, type PublicSocialLinks, type Principal, type SocialLinks,
} from '@fact-lens/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { CurrentPrincipal, Public, RequireCapability } from '../auth/decorators';
import { parse } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';
import { socialLinksSchema } from '@fact-lens/contracts';

const KEY = 'site.social_links';

/** The saved addresses, one per network (null where none is set). */
async function load(pool: Pick<Pool, 'query'>): Promise<Record<(typeof socialNetworks)[number], string | null>> {
  const { rows } = await pool.query<{ value: Record<string, string | null> }>(`SELECT value FROM configuration WHERE key = $1 AND scope = 'global'`, [KEY]);
  const value = (rows[0]?.value ?? {}) as Record<string, string | null | undefined>;
  return Object.fromEntries(socialNetworks.map((n) => [n, value[n] ?? null])) as Record<(typeof socialNetworks)[number], string | null>;
}

/** The newsroom side: administrators set the site's social accounts. */
@Controller('config/social-links')
export class SocialLinksController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequireCapability('config.manage')
  get(): Promise<Awaited<ReturnType<typeof load>>> {
    return load(this.pool);
  }

  /** Replaces the whole set: a network left empty goes back to the site's default link. */
  @Put()
  @RequireCapability('config.manage')
  async put(@Body() body: unknown, @CurrentPrincipal() p: Principal, @Req() req: FastifyRequest): Promise<Awaited<ReturnType<typeof load>>> {
    const input: SocialLinks = parse(socialLinksSchema, body);
    const clean = Object.fromEntries(socialNetworks.flatMap((n) => (input[n] ? [[n, input[n]!.trim()]] : [])));
    parseConfigValue(KEY, clean); // the same rule the configuration table uses
    await withTransaction(this.pool, async (db) => {
      const before = await load(db);
      await db.query(
        `INSERT INTO configuration (key, scope, value, updated_by) VALUES ($1, 'global', $2, $3)
         ON CONFLICT (key, scope) DO UPDATE SET value = EXCLUDED.value, version = configuration.version + 1, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [KEY, JSON.stringify(clean), p.subject]);
      await this.audit.record(
        { actorType: 'human', actorId: p.subject, action: 'config.social_links_update', objectType: 'configuration', objectId: KEY, requestId: String(req.id),
          previousState: JSON.stringify(before), newState: JSON.stringify(clean) },
        db,
      );
    });
    return load(this.pool);
  }
}

/** What the public site reads. Only networks with an address; the site keeps its default link for the rest. */
@Public()
@Controller('public/site')
export class PublicSiteController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get('social-links')
  async socialLinks(@Res({ passthrough: true }) reply: FastifyReply): Promise<PublicSocialLinks> {
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    const saved = await load(this.pool);
    return { links: socialNetworks.flatMap((network) => (saved[network] ? [{ network, url: saved[network]! }] : [])) };
  }
}
