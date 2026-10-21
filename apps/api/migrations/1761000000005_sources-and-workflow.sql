-- Up Migration

-- A cited source (docs/05, docs/08). Every external source is untrusted input: it carries
-- provenance, retrieval time and a validation status. The ingestion allowlist (RSS feeds,
-- Telegram channels) is a separate Phase 5 concern.
CREATE TABLE source (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              text NOT NULL DEFAULT 'web'
                    CHECK (kind IN ('web', 'document', 'social', 'interview', 'dataset', 'agency', 'other')),
  title             text NOT NULL,
  publisher         text,
  url               text CHECK (url IS NULL OR url ~* '^https?://'),
  canonical_url     text CHECK (canonical_url IS NULL OR canonical_url ~* '^https?://'),
  archive_url       text CHECK (archive_url IS NULL OR archive_url ~* '^https?://'),
  published_at      timestamptz,
  retrieved_at      timestamptz,
  ingest_channel    text CHECK (ingest_channel IN ('rss', 'partner_api', 'approved_url', 'telegram')),
  external_id       text,
  validation_status text NOT NULL DEFAULT 'unvalidated'
                    CHECK (validation_status IN ('unvalidated', 'valid', 'rejected')),
  notes             text,
  created_by        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK ((ingest_channel IS NULL) = (external_id IS NULL))
);

-- Deduplicate first by canonical URL, then by channel and external id (docs/08).
CREATE UNIQUE INDEX source_canonical_url_idx ON source (canonical_url) WHERE canonical_url IS NOT NULL;
CREATE UNIQUE INDEX source_external_idx ON source (ingest_channel, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE story_source (
  story_id  uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES source (id),
  relation  text NOT NULL DEFAULT 'primary' CHECK (relation IN ('primary', 'secondary')),
  use_type  text NOT NULL DEFAULT 'background'
            CHECK (use_type IN ('quoted', 'background', 'data', 'media', 'attribution')),
  notes     text,
  PRIMARY KEY (story_id, source_id)
);

CREATE TABLE editorial_assignment (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id     uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  assignee     text NOT NULL,
  role         text NOT NULL CHECK (role IN ('reporter', 'editor', 'copy_editor', 'fact_checker', 'translator')),
  assigned_by  text,
  due_at       timestamptz,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK ((status = 'done') = (completed_at IS NOT NULL))
);

CREATE INDEX editorial_assignment_queue_idx ON editorial_assignment (assignee, due_at) WHERE status = 'open';
CREATE INDEX editorial_assignment_story_idx ON editorial_assignment (story_id);

CREATE TABLE editorial_comment (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id    uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  revision_id uuid,
  parent_id   uuid REFERENCES editorial_comment (id) ON DELETE CASCADE,
  author      text NOT NULL,
  body        text NOT NULL CHECK (length(btrim(body)) > 0),
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_by text,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- a comment can only point at a revision of its own story
  FOREIGN KEY (story_id, revision_id) REFERENCES story_revision (story_id, id),
  CHECK ((status = 'resolved') = (resolved_at IS NOT NULL))
);

CREATE INDEX editorial_comment_story_idx ON editorial_comment (story_id, created_at);
CREATE INDEX editorial_comment_open_idx ON editorial_comment (story_id) WHERE status = 'open';

-- A correction is recorded together with the new revision that carries it (docs/05, docs/06).
CREATE TABLE correction (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id     uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  revision_id  uuid NOT NULL,
  reason       text NOT NULL CHECK (length(btrim(reason)) > 0),
  requested_by text NOT NULL,
  approved_by  text NOT NULL,
  approved_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (revision_id),
  FOREIGN KEY (story_id, revision_id) REFERENCES story_revision (story_id, id)
);

-- Public-facing correction text per locale. How it is displayed is an open question (doc 19, 3).
CREATE TABLE correction_notice (
  correction_id uuid NOT NULL REFERENCES correction (id) ON DELETE CASCADE,
  locale        text NOT NULL REFERENCES locale (code),
  notice        text NOT NULL CHECK (length(btrim(notice)) > 0),
  PRIMARY KEY (correction_id, locale)
);

CREATE FUNCTION correction_revision_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM story_revision WHERE id = NEW.revision_id AND is_correction) THEN
    RAISE EXCEPTION 'revision % is not flagged is_correction', NEW.revision_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER correction_revision_is_correction
  BEFORE INSERT OR UPDATE OF revision_id ON correction
  FOR EACH ROW EXECUTE FUNCTION correction_revision_check();

CREATE TABLE publishing_schedule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  locale          text REFERENCES locale (code),
  channel         text NOT NULL DEFAULT 'web',
  scheduled_for   timestamptz NOT NULL,
  time_zone       text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'cancelled', 'failed')),
  created_by      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  executed_at     timestamptz,
  last_error      text
);

CREATE INDEX publishing_schedule_due_idx ON publishing_schedule (scheduled_for) WHERE status = 'pending';

-- Down Migration

DROP TABLE publishing_schedule;
DROP TABLE correction_notice;
DROP TABLE correction;
DROP FUNCTION correction_revision_check();
DROP TABLE editorial_comment;
DROP TABLE editorial_assignment;
DROP TABLE story_source;
DROP TABLE source;
