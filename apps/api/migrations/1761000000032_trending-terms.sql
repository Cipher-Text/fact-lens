-- Up Migration

-- The editorial list of trending search terms for the public site (docs/26, section 5): up to six terms per language,
-- in order. An editor replaces the whole list in one save. An empty list hides the row on the site.
CREATE TABLE trending_term (
  locale   text     NOT NULL REFERENCES locale (code),
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 6),
  term     text     NOT NULL CHECK (char_length(btrim(term)) BETWEEN 1 AND 60),
  PRIMARY KEY (locale, position),
  UNIQUE (locale, term)
);

-- Down Migration

DROP TABLE trending_term;
