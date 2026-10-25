-- Up Migration

-- A news item can sit in several menu sections. news.category_id stays as the primary section (the one
-- the reader's page names first); news_category holds every section of the item, the primary included.
CREATE TABLE news_category (
  news_id     uuid NOT NULL REFERENCES news (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category (id),
  PRIMARY KEY (news_id, category_id)
);

CREATE INDEX news_category_category_idx ON news_category (category_id);

INSERT INTO news_category (news_id, category_id)
SELECT id, category_id FROM news WHERE category_id IS NOT NULL;

-- Down Migration

DROP INDEX news_category_category_idx;
DROP TABLE news_category;
