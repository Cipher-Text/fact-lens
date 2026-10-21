-- Up Migration

-- Durable story identity. Workflow states are code, not configuration (docs/21): changing the
-- set needs a migration and an ADR.
CREATE TABLE story (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key         text NOT NULL UNIQUE,
  status                text NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'INGESTED', 'RESEARCHING', 'DRAFT', 'EDITOR_REVIEW', 'FACT_CHECK', 'READY',
    'SCHEDULED', 'PUBLISHED', 'UPDATED', 'CORRECTED', 'ARCHIVED')),
  category_id           uuid REFERENCES category (id),
  desk_id               uuid REFERENCES desk (id),
  published_revision_id uuid,
  published_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX story_status_idx ON story (status);
CREATE INDEX story_desk_idx ON story (desk_id) WHERE desk_id IS NOT NULL;
CREATE INDEX story_published_at_idx ON story (published_at DESC) WHERE published_at IS NOT NULL;

CREATE TABLE story_revision (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id       uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  revision_no    integer NOT NULL CHECK (revision_no > 0),
  changed_by     text NOT NULL,
  changed_at     timestamptz NOT NULL DEFAULT now(),
  change_reason  text,
  submitted_at   timestamptz,
  submitted_by   text,
  approved_at    timestamptz,
  approved_by    text,
  is_correction  boolean NOT NULL DEFAULT false,
  ai_assisted    boolean NOT NULL DEFAULT false,
  content_hash   text,
  UNIQUE (story_id, revision_no),
  -- allows story.published_revision_id to be forced to point at one of the story's own revisions
  UNIQUE (story_id, id)
);

ALTER TABLE story
  ADD CONSTRAINT story_published_revision_fk
  FOREIGN KEY (id, published_revision_id) REFERENCES story_revision (story_id, id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE story_translation (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id           uuid NOT NULL REFERENCES story_revision (id) ON DELETE CASCADE,
  locale                text NOT NULL REFERENCES locale (code),
  title                 text NOT NULL,
  dek                   text,
  body                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  slug                  text NOT NULL,
  seo_title             text,
  seo_description       text,
  translation_status    text NOT NULL DEFAULT 'original'
                        CHECK (translation_status IN ('original', 'machine_draft', 'human_reviewed', 'approved')),
  source_translation_id uuid REFERENCES story_translation (id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (revision_id, locale)
);

-- Slug registry: unique within locale; a story's old slugs stay as redirect records (docs/05).
CREATE TABLE story_slug (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  locale     text NOT NULL REFERENCES locale (code),
  slug       text NOT NULL,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (locale, slug)
);

CREATE UNIQUE INDEX story_slug_current_idx ON story_slug (story_id, locale) WHERE is_current;

CREATE TABLE story_tag (
  story_id uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tag (id),
  PRIMARY KEY (story_id, tag_id)
);

CREATE TABLE story_contributor (
  story_id       uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  contributor_id uuid NOT NULL REFERENCES contributor (id),
  role           text NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'editor', 'photographer', 'translator')),
  position       integer NOT NULL DEFAULT 0,
  PRIMARY KEY (story_id, contributor_id, role)
);

CREATE TABLE revision_media (
  revision_id    uuid NOT NULL REFERENCES story_revision (id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES media_asset (id),
  role           text NOT NULL DEFAULT 'inline' CHECK (role IN ('lead', 'inline', 'gallery')),
  position       integer NOT NULL DEFAULT 0,
  caption        jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (revision_id, media_asset_id, role)
);

-- Down Migration

DROP TABLE revision_media;
DROP TABLE story_contributor;
DROP TABLE story_tag;
DROP TABLE story_slug;
DROP TABLE story_translation;
ALTER TABLE story DROP CONSTRAINT story_published_revision_fk;
DROP TABLE story_revision;
DROP TABLE story;
