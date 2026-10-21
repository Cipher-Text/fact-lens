import { BadRequestException, Body, Controller, Get, Inject, NotFoundException, Param, Put } from '@nestjs/common';
import { featureFlagKeys, featureFlagUpdateSchema, type FeatureFlag, type Principal } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import type { FastifyRequest } from 'fastify';
import { Req } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { CurrentPrincipal, RequireCapability } from '../auth/decorators';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';

interface FlagRow { key: string; enabled: boolean; description: string; updated_at: Date }
const toFlag = (r: FlagRow): FeatureFlag => ({
  key: r.key, enabled: r.enabled, description: r.description, updatedAt: r.updated_at.toISOString(),
});

@Controller('config/flags')
@RequireCapability('config.manage')
export class FeatureFlagsController {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  async list(): Promise<FeatureFlag[]> {
    const { rows } = await this.pool.query<FlagRow>('SELECT key, enabled, description, updated_at FROM feature_flag ORDER BY key');
    return rows.map(toFlag);
  }

  @Put(':key')
  async update(
    @Param('key') key: string,
    @Body() body: unknown,
    @CurrentPrincipal() principal: Principal,
    @Req() request: FastifyRequest,
  ): Promise<FeatureFlag> {
    const parsed = featureFlagUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ message: 'Invalid request body', issues: parsed.error.issues });
    }
    if (!(featureFlagKeys as readonly string[]).includes(key)) throw new NotFoundException('Unknown feature flag');

    return withTransaction(this.pool, async (db) => {
      const current = await db.query<FlagRow>(
        'SELECT key, enabled, description, updated_at FROM feature_flag WHERE key = $1 FOR UPDATE',
        [key],
      );
      const before = current.rows[0];
      if (!before) throw new NotFoundException('Unknown feature flag');
      if (before.enabled === parsed.data.enabled) return toFlag(before);

      const updated = await db.query<FlagRow>(
        `UPDATE feature_flag SET enabled = $2, updated_by = $3, updated_at = now()
          WHERE key = $1 RETURNING key, enabled, description, updated_at`,
        [key, parsed.data.enabled, principal.subject],
      );
      await this.audit.record(
        {
          actorType: 'human', actorId: principal.subject, action: 'feature_flag.update',
          objectType: 'feature_flag', objectId: key,
          previousState: String(before.enabled), newState: String(parsed.data.enabled),
          reason: parsed.data.reason, requestId: String(request.id),
        },
        db,
      );
      // Lets the worker invalidate caches that read this flag.
      await db.query(
        `INSERT INTO outbox_event (aggregate_type, aggregate_id, event_type, payload)
         VALUES ('feature_flag', $1, 'config.flag_changed', $2)`,
        [key, JSON.stringify({ key, enabled: parsed.data.enabled })],
      );
      return toFlag(updated.rows[0]!);
    });
  }
}
