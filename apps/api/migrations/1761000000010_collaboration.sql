-- Up Migration

-- When a revision was opened. changed_at moves on every save, so it cannot order the timeline.
ALTER TABLE story_revision ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

-- One open assignment per person and role on a story (docs/07 desk queue).
CREATE UNIQUE INDEX editorial_assignment_open_idx
  ON editorial_assignment (story_id, assignee, role) WHERE status = 'open';

-- Replies are looked up by parent.
CREATE INDEX editorial_comment_parent_idx ON editorial_comment (parent_id) WHERE parent_id IS NOT NULL;

-- Down Migration

DROP INDEX editorial_comment_parent_idx;
DROP INDEX editorial_assignment_open_idx;
ALTER TABLE story_revision DROP COLUMN created_at;
