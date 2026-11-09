-- Up Migration

-- A region is a place a news item is about (Americas, Middle East, South Asia, China ...). It is not a menu
-- section: sections (category) make up the news menu, regions are their own list, and one news item can be
-- about several regions. Like categories and tags, a region is one record with a name, an address and a
-- description per language (the `locale` rows).
CREATE TABLE region (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position   integer NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE region_label (
  region_id   uuid NOT NULL REFERENCES region (id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES locale (code),
  name        text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  slug        text NOT NULL,
  description text CHECK (length(description) <= 500),
  aliases     text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (region_id, locale),
  UNIQUE (locale, slug)
);

CREATE INDEX region_order_idx ON region (position, key) WHERE status = 'active';

-- The regions of a news item. Like tags, they belong to the news item, not to a revision.
CREATE TABLE news_region (
  news_id   uuid NOT NULL REFERENCES news (id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES region (id),
  PRIMARY KEY (news_id, region_id)
);

CREATE INDEX news_region_region_idx ON news_region (region_id);

-- Down Migration

DROP INDEX news_region_region_idx;
DROP TABLE news_region;
DROP INDEX region_order_idx;
DROP TABLE region_label;
DROP TABLE region;
