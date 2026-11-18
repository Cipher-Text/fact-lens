-- Up Migration

-- Public search (docs/26, section 4). A derived copy of the published text of each live news item, one row per
-- language. The API writes it when a news item is published, updated, archived or reindexed, and it can always be
-- rebuilt from news_translation. Rows exist only for live items; anything else is removed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE news_search (
  news_id     uuid        NOT NULL REFERENCES news (id) ON DELETE CASCADE,
  locale      text        NOT NULL REFERENCES locale (code),
  revision_id uuid        NOT NULL REFERENCES news_revision (id) ON DELETE CASCADE,
  title       text        NOT NULL,
  body_text   text        NOT NULL,
  -- Title words weigh more than body words. The text configuration is per language (english or simple).
  document    tsvector    NOT NULL,
  indexed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (news_id, locale)
);

CREATE INDEX news_search_document_idx ON news_search USING gin (document);
-- Trigram matching on titles, so a typo or a partial word still finds the item (docs/26, section 4).
CREATE INDEX news_search_title_trgm_idx ON news_search USING gin (title gin_trgm_ops);

-- Down Migration

DROP TABLE news_search;
-- The pg_trgm extension is left in place: other objects may use it, and dropping it needs the same rights to recreate.
