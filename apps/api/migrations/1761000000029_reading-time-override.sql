-- Up Migration

-- The editor's reading time for one language version (docs/24 section 4). NULL means calculated.
-- A translation belongs to a revision, so a new revision copies it with the text.
ALTER TABLE news_translation
  ADD COLUMN reading_minutes_override integer NULL
    CHECK (reading_minutes_override BETWEEN 1 AND 120);

-- Down Migration

ALTER TABLE news_translation DROP COLUMN reading_minutes_override;
