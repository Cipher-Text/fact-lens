-- Up Migration

-- 1. The primary section lives in one place: news_category.is_primary, at most one per news item (a partial
--    unique index). news.category_id, which repeated it, is dropped, so the two cannot drift apart. The
--    application keeps the primary one of the item's sections (a news item with sections has exactly one).
ALTER TABLE news_category ADD COLUMN is_primary boolean NOT NULL DEFAULT false;
UPDATE news_category nc SET is_primary = true FROM news n WHERE n.id = nc.news_id AND n.category_id = nc.category_id;
CREATE UNIQUE INDEX news_category_primary_idx ON news_category (news_id) WHERE is_primary;
DROP INDEX news_category_idx;
ALTER TABLE news DROP COLUMN category_id;

-- 2. Lists are read from the link side: "the news of this section, region or tag" must find its rows by the
--    id alone and read the news ids from the index, so the link indexes carry news_id. The public feed
--    (newest first, cursor on published_at and id, live news only) gets its own index.
DROP INDEX news_category_category_idx;
CREATE INDEX news_category_category_idx ON news_category (category_id, news_id);
DROP INDEX news_tag_tag_idx;
CREATE INDEX news_tag_tag_idx ON news_tag (tag_id, news_id);
DROP INDEX news_region_region_idx;
CREATE INDEX news_region_region_idx ON news_region (region_id, news_id);
CREATE INDEX news_public_feed_idx ON news (published_at DESC, id DESC) WHERE published_revision_id IS NOT NULL;

-- Down Migration

DROP INDEX news_public_feed_idx;
DROP INDEX news_region_region_idx;
CREATE INDEX news_region_region_idx ON news_region (region_id);
DROP INDEX news_tag_tag_idx;
CREATE INDEX news_tag_tag_idx ON news_tag (tag_id);
DROP INDEX news_category_category_idx;
CREATE INDEX news_category_category_idx ON news_category (category_id);

ALTER TABLE news ADD COLUMN category_id uuid REFERENCES category (id);
UPDATE news n SET category_id = nc.category_id FROM news_category nc WHERE nc.news_id = n.id AND nc.is_primary;
CREATE INDEX news_category_idx ON news (category_id) WHERE category_id IS NOT NULL;
DROP INDEX news_category_primary_idx;
ALTER TABLE news_category DROP COLUMN is_primary;
