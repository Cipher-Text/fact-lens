-- Up Migration

-- Branded photocard/poster templates (docs/10): deterministic compositing, not generative.
-- A template version is a row; publish a new version instead of editing an active one.
CREATE TABLE card_template (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL,
  version      integer NOT NULL CHECK (version > 0),
  name         text NOT NULL,
  aspect_ratio text NOT NULL CHECK (aspect_ratio IN ('square', 'vertical', 'landscape')),
  width        integer NOT NULL CHECK (width > 0),
  height       integer NOT NULL CHECK (height > 0),
  -- slots: logo/watermark position, frame/gradient, headline and byline regions
  spec         jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- validated template assets (SVG, fonts): object keys, never inline active content
  assets       jsonb NOT NULL DEFAULT '[]'::jsonb,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'retired')),
  created_by   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);

-- The composited output is itself a media_asset; this row links it to its inputs.
CREATE TABLE generated_card (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id        uuid NOT NULL UNIQUE REFERENCES media_asset (id),
  source_media_asset_id uuid NOT NULL REFERENCES media_asset (id),
  template_id           uuid NOT NULL REFERENCES card_template (id),
  story_id              uuid NOT NULL REFERENCES story (id) ON DELETE CASCADE,
  revision_id           uuid NOT NULL,
  locale                text REFERENCES locale (code),
  crop                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  text_inputs           jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by            text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (media_asset_id <> source_media_asset_id),
  FOREIGN KEY (story_id, revision_id) REFERENCES story_revision (story_id, id)
);

CREATE INDEX generated_card_story_idx ON generated_card (story_id, created_at DESC);
CREATE INDEX generated_card_source_idx ON generated_card (source_media_asset_id);

-- Down Migration

DROP TABLE generated_card;
DROP TABLE card_template;
