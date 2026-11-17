-- Up Migration

-- The editor's picks for the Read next row under an article (docs/23 section 5). Stored per news item,
-- not per revision, like tags. At most three, in the editor's order.
CREATE TABLE news_related (
  news_id         uuid     NOT NULL REFERENCES news (id) ON DELETE CASCADE,
  related_news_id uuid     NOT NULL REFERENCES news (id) ON DELETE CASCADE,
  position        smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
  PRIMARY KEY (news_id, related_news_id),
  UNIQUE (news_id, position),
  CHECK (news_id <> related_news_id)
);

-- Down Migration

DROP TABLE news_related;
