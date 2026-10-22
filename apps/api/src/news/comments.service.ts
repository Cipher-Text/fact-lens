import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Comment, CommentCreate } from '@fact-lens/contracts';
import type { Pool } from 'pg';
import { AuthorizationService } from '../auth/authorization.service';
import type { Actor } from '../common/http';
import { PG_POOL } from '../db/pool';

interface CommentRow {
  id: string; news_id: string; revision_id: string | null; parent_id: string | null; author: string; body: string;
  status: 'open' | 'resolved'; created_at: Date; resolved_at: Date | null; resolved_by: string | null;
}
const toComment = (r: CommentRow): Comment & { resolvedBy: string | null } => ({
  id: r.id, newsId: r.news_id, revisionId: r.revision_id, parentId: r.parent_id, author: r.author, body: r.body,
  status: r.status, createdAt: r.created_at.toISOString(), resolvedAt: r.resolved_at?.toISOString() ?? null, resolvedBy: r.resolved_by,
});

/**
 * Internal review comments. They are newsroom-only and never appear in any public read model.
 * Comments are not edited or deleted, so a review stays traceable; resolve and reopen change status only.
 */
@Injectable()
export class CommentsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(AuthorizationService) private readonly authz: AuthorizationService,
  ) {}

  async list(newsId: string, status?: 'open' | 'resolved') {
    await this.requireNews(newsId);
    const { rows } = await this.pool.query<CommentRow>(
      `SELECT * FROM editorial_comment WHERE news_id = $1 AND ($2::text IS NULL OR status = $2) ORDER BY created_at, id`,
      [newsId, status ?? null],
    );
    return rows.map(toComment);
  }

  async create(newsId: string, input: CommentCreate, actor: Actor) {
    const news = await this.requireNews(newsId);
    if (news.status === 'ARCHIVED') throw new ConflictException({ message: 'Archived news cannot be commented on', reason: 'news_archived' });

    let revisionId = input.revisionId ?? null;
    if (revisionId) {
      const rev = await this.pool.query('SELECT 1 FROM news_revision WHERE id = $1 AND news_id = $2', [revisionId, newsId]);
      if (rev.rowCount === 0) throw new BadRequestException('That revision does not belong to this news item');
    } else {
      const latest = await this.pool.query<{ id: string }>('SELECT id FROM news_revision WHERE news_id = $1 ORDER BY revision_no DESC LIMIT 1', [newsId]);
      revisionId = latest.rows[0]?.id ?? null;
    }
    if (input.parentId) {
      const parent = await this.pool.query<{ parent_id: string | null }>('SELECT parent_id FROM editorial_comment WHERE id = $1 AND news_id = $2', [input.parentId, newsId]);
      if (!parent.rows[0]) throw new BadRequestException('Parent comment not found on this news item');
      if (parent.rows[0].parent_id) throw new BadRequestException('Replies are one level deep: reply to the top-level comment');
    }
    const { rows } = await this.pool.query<CommentRow>(
      `INSERT INTO editorial_comment (news_id, revision_id, parent_id, author, body) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [newsId, revisionId, input.parentId ?? null, actor.principal.subject, input.body],
    );
    return toComment(rows[0]!);
  }

  /** The author may resolve or reopen their own thread; otherwise it takes news.review. */
  async setStatus(commentId: string, status: 'open' | 'resolved', actor: Actor) {
    const { rows } = await this.pool.query<CommentRow>('SELECT * FROM editorial_comment WHERE id = $1', [commentId]);
    const comment = rows[0];
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.parent_id) throw new BadRequestException('Resolve the top-level comment, not a reply');
    if (comment.author !== actor.principal.subject) {
      await this.authz.requireAll(actor.principal, ['news.review'], { requestId: actor.requestId, objectType: 'comment', objectId: commentId });
    }
    if (comment.status === status) throw new ConflictException({ message: `Comment is already ${status}`, reason: 'no_change' });
    const updated = await this.pool.query<CommentRow>(
      status === 'resolved'
        ? `UPDATE editorial_comment SET status = 'resolved', resolved_by = $2, resolved_at = now() WHERE id = $1 RETURNING *`
        : `UPDATE editorial_comment SET status = 'open', resolved_by = NULL, resolved_at = NULL WHERE id = $1 RETURNING *`,
      status === 'resolved' ? [commentId, actor.principal.subject] : [commentId],
    );
    return toComment(updated.rows[0]!);
  }

  private async requireNews(id: string) {
    const { rows } = await this.pool.query<{ status: string }>('SELECT status FROM news WHERE id = $1', [id]);
    if (!rows[0]) throw new NotFoundException('News not found');
    return rows[0];
  }
}
