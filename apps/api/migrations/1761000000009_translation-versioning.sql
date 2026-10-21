-- Up Migration

-- Optimistic concurrency for translation edits (docs/07): a save names the version it started from.
ALTER TABLE story_translation
  ADD COLUMN version    integer NOT NULL DEFAULT 1 CHECK (version > 0),
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Down Migration

ALTER TABLE story_translation DROP COLUMN updated_at, DROP COLUMN version;
