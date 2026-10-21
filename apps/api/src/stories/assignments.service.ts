import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Assignment, AssignmentCreate, AssignmentWithStory } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { AuthorizationService } from '../auth/authorization.service';
import { isPgError, type Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';

interface Row {
  id: string; story_id: string; assignee: string; role: Assignment['role']; assigned_by: string | null;
  due_at: Date | null; status: Assignment['status']; completed_at: Date | null; story_titles?: Record<string, string>;
}
const toAssignment = (r: Row): Assignment & { assignedBy: string | null } => ({
  id: r.id, storyId: r.story_id, assignee: r.assignee, role: r.role, status: r.status, assignedBy: r.assigned_by,
  dueAt: r.due_at?.toISOString() ?? null, completedAt: r.completed_at?.toISOString() ?? null,
});

@Injectable()
export class AssignmentsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuthorizationService) private readonly authz: AuthorizationService,
  ) {}

  async forStory(storyId: string) {
    const exists = await this.pool.query('SELECT 1 FROM story WHERE id = $1', [storyId]);
    if (exists.rowCount === 0) throw new NotFoundException('Story not found');
    const { rows } = await this.pool.query<Row>(
      `SELECT * FROM editorial_assignment WHERE story_id = $1 ORDER BY (status = 'open') DESC, due_at NULLS LAST, created_at`, [storyId]);
    return rows.map(toAssignment);
  }

  /** The caller's own desk queue: soonest due first, undated last. */
  async mine(subject: string, status: Assignment['status'], limit: number): Promise<AssignmentWithStory[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT a.*, COALESCE(t.titles, '{}'::jsonb) AS story_titles
         FROM editorial_assignment a
         LEFT JOIN LATERAL (
           SELECT jsonb_object_agg(st.locale, st.title) AS titles FROM story_translation st
            WHERE st.revision_id = (SELECT id FROM story_revision WHERE story_id = a.story_id ORDER BY revision_no DESC LIMIT 1)
         ) t ON true
        WHERE a.assignee = $1 AND a.status = $2
        ORDER BY a.due_at NULLS LAST, a.created_at LIMIT $3`,
      [subject, status, limit],
    );
    return rows.map((r) => ({ ...toAssignment(r), storyTitles: r.story_titles ?? {} }));
  }

  async create(storyId: string, input: AssignmentCreate, actor: Actor) {
    await this.authz.requireAll(actor.principal, ['story.review'], { requestId: actor.requestId, objectType: 'story', objectId: storyId });
    return withTransaction(this.pool, async (db) => {
      const story = await db.query<{ status: string }>('SELECT status FROM story WHERE id = $1 FOR SHARE', [storyId]);
      if (!story.rows[0]) throw new NotFoundException('Story not found');
      if (story.rows[0].status === 'ARCHIVED') throw new ConflictException({ message: 'Archived stories cannot be assigned', reason: 'story_archived' });
      let row: Row;
      try {
        const res = await db.query<Row>(
          `INSERT INTO editorial_assignment (story_id, assignee, role, assigned_by, due_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [storyId, input.assignee, input.role, actor.principal.subject, input.dueAt ?? null],
        );
        row = res.rows[0]!;
      } catch (e) {
        if (isPgError(e) && e.code === '23505') throw new ConflictException({ message: 'That person already has this open assignment', reason: 'duplicate_assignment' });
        throw e;
      }
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'assignment.create', objectType: 'assignment', objectId: row.id,
          storyId, newState: 'open', requestId: actor.requestId, metadata: { assignee: input.assignee, role: input.role } },
        db,
      );
      return toAssignment(row);
    });
  }

  /** The assignee may close their own assignment; closing someone else's takes story.review. */
  async close(id: string, to: 'done' | 'cancelled', actor: Actor) {
    const found = await this.pool.query<Row>('SELECT * FROM editorial_assignment WHERE id = $1', [id]);
    const current = found.rows[0];
    if (!current) throw new NotFoundException('Assignment not found');
    const own = current.assignee === actor.principal.subject;
    if (to === 'cancelled' || !own) {
      await this.authz.requireAll(actor.principal, ['story.review'], { requestId: actor.requestId, objectType: 'assignment', objectId: id });
    }
    return withTransaction(this.pool, async (db) => {
      const res = await db.query<Row>(
        `UPDATE editorial_assignment SET status = $2, completed_at = CASE WHEN $2 = 'done' THEN now() ELSE NULL END
          WHERE id = $1 AND status = 'open' RETURNING *`,
        [id, to],
      );
      if (!res.rows[0]) throw new ConflictException({ message: 'This assignment is already closed', reason: 'already_closed' });
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: `assignment.${to === 'done' ? 'complete' : 'cancel'}`,
          objectType: 'assignment', objectId: id, storyId: current.story_id, previousState: 'open', newState: to, requestId: actor.requestId,
          metadata: { assignee: current.assignee, role: current.role } },
        db,
      );
      return toAssignment(res.rows[0]);
    });
  }
}
