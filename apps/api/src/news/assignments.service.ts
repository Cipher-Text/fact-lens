import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Assignment, AssignmentCreate, AssignmentWithNews } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { AuditService } from '../audit/audit.service';
import { AuthorizationService } from '../auth/authorization.service';
import { isPgError, type Actor } from '../common/http';
import { PG_POOL } from '../db/pool';
import { withTransaction } from '../db/transaction';

interface Row {
  id: string; news_id: string; assignee: string; role: Assignment['role']; assigned_by: string | null;
  due_at: Date | null; status: Assignment['status']; completed_at: Date | null; news_titles?: Record<string, string>;
}
const toAssignment = (r: Row): Assignment & { assignedBy: string | null } => ({
  id: r.id, newsId: r.news_id, assignee: r.assignee, role: r.role, status: r.status, assignedBy: r.assigned_by,
  dueAt: r.due_at?.toISOString() ?? null, completedAt: r.completed_at?.toISOString() ?? null,
});

@Injectable()
export class AssignmentsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuthorizationService) private readonly authz: AuthorizationService,
  ) {}

  async forNews(newsId: string) {
    const exists = await this.pool.query('SELECT 1 FROM news WHERE id = $1', [newsId]);
    if (exists.rowCount === 0) throw new NotFoundException('News not found');
    const { rows } = await this.pool.query<Row>(
      `SELECT * FROM editorial_assignment WHERE news_id = $1 ORDER BY (status = 'open') DESC, due_at NULLS LAST, created_at`, [newsId]);
    return rows.map(toAssignment);
  }

  /** The caller's own desk queue: soonest due first, undated last. */
  async mine(subject: string, status: Assignment['status'], limit: number): Promise<AssignmentWithNews[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT a.*, COALESCE(t.titles, '{}'::jsonb) AS news_titles
         FROM editorial_assignment a
         LEFT JOIN LATERAL (
           SELECT jsonb_object_agg(st.locale, st.title) AS titles FROM news_translation st
            WHERE st.revision_id = (SELECT id FROM news_revision WHERE news_id = a.news_id ORDER BY revision_no DESC LIMIT 1)
         ) t ON true
        WHERE a.assignee = $1 AND a.status = $2
        ORDER BY a.due_at NULLS LAST, a.created_at LIMIT $3`,
      [subject, status, limit],
    );
    return rows.map((r) => ({ ...toAssignment(r), newsTitles: r.news_titles ?? {} }));
  }

  async create(newsId: string, input: AssignmentCreate, actor: Actor) {
    await this.authz.requireAll(actor.principal, ['news.review'], { requestId: actor.requestId, objectType: 'news', objectId: newsId });
    return withTransaction(this.pool, async (db) => {
      const news = await db.query<{ status: string }>('SELECT status FROM news WHERE id = $1 FOR SHARE', [newsId]);
      if (!news.rows[0]) throw new NotFoundException('News not found');
      if (news.rows[0].status === 'ARCHIVED') throw new ConflictException({ message: 'Archived news cannot be assigned', reason: 'news_archived' });
      let row: Row;
      try {
        const res = await db.query<Row>(
          `INSERT INTO editorial_assignment (news_id, assignee, role, assigned_by, due_at) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [newsId, input.assignee, input.role, actor.principal.subject, input.dueAt ?? null],
        );
        row = res.rows[0]!;
      } catch (e) {
        if (isPgError(e) && e.code === '23505') throw new ConflictException({ message: 'That person already has this open assignment', reason: 'duplicate_assignment' });
        throw e;
      }
      await this.audit.record(
        { actorType: 'human', actorId: actor.principal.subject, action: 'assignment.create', objectType: 'assignment', objectId: row.id,
          newsId, newState: 'open', requestId: actor.requestId, metadata: { assignee: input.assignee, role: input.role } },
        db,
      );
      return toAssignment(row);
    });
  }

  /** The assignee may close their own assignment; closing someone else's takes news.review. */
  async close(id: string, to: 'done' | 'cancelled', actor: Actor) {
    const found = await this.pool.query<Row>('SELECT * FROM editorial_assignment WHERE id = $1', [id]);
    const current = found.rows[0];
    if (!current) throw new NotFoundException('Assignment not found');
    const own = current.assignee === actor.principal.subject;
    if (to === 'cancelled' || !own) {
      await this.authz.requireAll(actor.principal, ['news.review'], { requestId: actor.requestId, objectType: 'assignment', objectId: id });
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
          objectType: 'assignment', objectId: id, newsId: current.news_id, previousState: 'open', newState: to, requestId: actor.requestId,
          metadata: { assignee: current.assignee, role: current.role } },
        db,
      );
      return toAssignment(res.rows[0]);
    });
  }
}
