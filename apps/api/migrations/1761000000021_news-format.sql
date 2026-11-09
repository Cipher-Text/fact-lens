-- Up Migration

-- The format of a news item: news, analysis or opinion. It is part of the content, not of the address
-- (/story/<slug>-<id> is the same for all three) and not a category. The site shows analysis on its own hub,
-- and keeps opinion out of the news lists.
ALTER TABLE news ADD COLUMN format text NOT NULL DEFAULT 'news' CHECK (format IN ('news', 'analysis', 'opinion'));
CREATE INDEX news_format_idx ON news (format) WHERE format <> 'news';

-- Down Migration

DROP INDEX news_format_idx;
ALTER TABLE news DROP COLUMN format;
