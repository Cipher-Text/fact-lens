-- Up Migration

-- RSS feeds the newsroom has approved, and what they brought in (docs/08). A feed address is an allowlist
-- entry: only addresses an administrator added are ever fetched. The worker fetches; the API owns these rows.
CREATE TABLE feed (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  url             text NOT NULL CHECK (url ~* '^https?://'),
  canonical_url   text NOT NULL UNIQUE,
  active          boolean NOT NULL DEFAULT true,
  poll_minutes    integer NOT NULL DEFAULT 15 CHECK (poll_minutes BETWEEN 5 AND 1440),
  etag            text,
  last_modified   text,
  last_fetched_at timestamptz,
  last_status     text CHECK (last_status IN ('ok', 'not_modified', 'error')),
  last_error      text,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inbox_item (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id       uuid NOT NULL REFERENCES feed (id) ON DELETE CASCADE,
  guid          text NOT NULL,
  title         text NOT NULL,
  url           text CHECK (url IS NULL OR url ~* '^https?://'),
  canonical_url text,
  summary       text CHECK (summary IS NULL OR length(summary) <= 1000),
  published_at  timestamptz,
  retrieved_at  timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'used', 'rejected', 'duplicate')),
  news_id       uuid REFERENCES news (id) ON DELETE SET NULL,
  triaged_by    text,
  triaged_at    timestamptz,
  -- The same item is never stored twice for a feed, so a repeated fetch changes nothing.
  UNIQUE (feed_id, guid)
);
CREATE INDEX inbox_item_status_idx ON inbox_item (status, published_at DESC NULLS LAST, retrieved_at DESC);
CREATE INDEX inbox_item_canonical_idx ON inbox_item (canonical_url) WHERE canonical_url IS NOT NULL;

-- Down Migration

DROP TABLE inbox_item;
DROP TABLE feed;
