-- Up Migration

-- Reader polls: created in the newsroom, voted on from the public site. The question and the option labels
-- exist per language (the supported languages are the `locale` rows), like categories and tags.
CREATE TABLE poll (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status     text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  opens_at   timestamptz,
  closes_at  timestamptz,
  featured   boolean NOT NULL DEFAULT false,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at > opens_at)
);
-- One poll is featured on the homepage at a time.
CREATE UNIQUE INDEX poll_featured_idx ON poll (featured) WHERE featured;

CREATE TABLE poll_question (
  poll_id  uuid NOT NULL REFERENCES poll (id) ON DELETE CASCADE,
  locale   text NOT NULL REFERENCES locale (code),
  question text NOT NULL CHECK (length(btrim(question)) BETWEEN 1 AND 300),
  PRIMARY KEY (poll_id, locale)
);

CREATE TABLE poll_option (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  uuid NOT NULL REFERENCES poll (id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position BETWEEN 1 AND 4),
  UNIQUE (poll_id, position)
);

CREATE TABLE poll_option_label (
  option_id uuid NOT NULL REFERENCES poll_option (id) ON DELETE CASCADE,
  locale    text NOT NULL REFERENCES locale (code),
  label     text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 120),
  PRIMARY KEY (option_id, locale)
);

-- A vote keeps no personal data: the browser token and the address are stored only as keyed hashes. One vote per
-- browser token per poll is a database rule; the per-address limit is checked from `ip_hash` and `created_at`.
CREATE TABLE poll_vote (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid NOT NULL REFERENCES poll (id) ON DELETE CASCADE,
  option_id  uuid NOT NULL REFERENCES poll_option (id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  ip_hash    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, token_hash)
);
CREATE INDEX poll_vote_ip_idx ON poll_vote (poll_id, ip_hash, created_at);
CREATE INDEX poll_vote_option_idx ON poll_vote (option_id);

-- Down Migration

DROP TABLE poll_vote;
DROP TABLE poll_option_label;
DROP TABLE poll_option;
DROP TABLE poll_question;
DROP TABLE poll;
