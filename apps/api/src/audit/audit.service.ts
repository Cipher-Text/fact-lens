import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../db/pool';

export interface AuditInput {
  actorType: 'human' | 'system' | 'ai';
  actorId?: string | null;
  action: string;
  objectType: string;
  objectId: string;
  newsId?: string | null;
  revisionId?: string | null;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  requestId?: string | null;
  /** Never put secrets or personal data here. */
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Pass a transaction client so the audit row commits or rolls back with the change. */
  async record(event: AuditInput, db: Pool | PoolClient = this.pool): Promise<void> {
    await db.query(
      `INSERT INTO audit_event
         (actor_type, actor_id, action, object_type, object_id, news_id, revision_id,
          previous_state, new_state, reason, request_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        event.actorType, event.actorId ?? null, event.action, event.objectType, event.objectId,
        event.newsId ?? null, event.revisionId ?? null, event.previousState ?? null, event.newState ?? null,
        event.reason ?? null, event.requestId ?? null, JSON.stringify(event.metadata ?? {}),
      ],
    );
  }
}
