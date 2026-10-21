-- Up Migration

CREATE TABLE desk (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  name       text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Category is navigational; Tag is a discovery label. Both have per-locale labels and slugs.
CREATE TABLE category (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  parent_id  uuid REFERENCES category (id),
  position   integer NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE category_label (
  category_id uuid NOT NULL REFERENCES category (id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES locale (code),
  name        text NOT NULL,
  slug        text NOT NULL,
  aliases     text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (category_id, locale),
  UNIQUE (locale, slug)
);

CREATE TABLE tag (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tag_label (
  tag_id  uuid NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
  locale  text NOT NULL REFERENCES locale (code),
  name    text NOT NULL,
  slug    text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (tag_id, locale),
  UNIQUE (locale, slug)
);

-- Person or organization credited for reporting/editing. contact_email is private.
CREATE TABLE contributor (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          text NOT NULL DEFAULT 'person' CHECK (kind IN ('person', 'organization')),
  display_name  text NOT NULL,
  bio           text,
  contact_email text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Object keys are storage locators only; rights and attachment live here (docs/05).
CREATE TABLE media_asset (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key       text NOT NULL UNIQUE,
  mime_type        text NOT NULL,
  byte_size        bigint NOT NULL CHECK (byte_size >= 0),
  width            integer CHECK (width > 0),
  height           integer CHECK (height > 0),
  sha256           text NOT NULL,
  variants         jsonb NOT NULL DEFAULT '[]'::jsonb,
  license          text,
  attribution      text,
  rights_notes     text,
  processing_state text NOT NULL DEFAULT 'pending'
                   CHECK (processing_state IN ('pending', 'processing', 'ready', 'failed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX media_asset_sha256_idx ON media_asset (sha256);

-- Down Migration

DROP TABLE media_asset;
DROP TABLE contributor;
DROP TABLE tag_label;
DROP TABLE tag;
DROP TABLE category_label;
DROP TABLE category;
DROP TABLE desk;
