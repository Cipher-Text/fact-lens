-- Up Migration

-- Durable view counts, one row per news item, language and Dhaka day. The live counters are in Redis (hourly
-- buckets, 9 days); the worker's rollup adds each finished hour here once, so this is the record for
-- "this month", least read and the newsroom's reports. A view is the first view of that news item in that
-- language by a session in 24 hours, so views are unique-session views.
CREATE TABLE news_performance_daily (
  news_id      uuid NOT NULL REFERENCES news (id) ON DELETE CASCADE,
  locale       text NOT NULL REFERENCES locale (code),
  day          date NOT NULL,
  views        integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  src_search   integer NOT NULL DEFAULT 0 CHECK (src_search >= 0),
  src_social   integer NOT NULL DEFAULT 0 CHECK (src_social >= 0),
  src_direct   integer NOT NULL DEFAULT 0 CHECK (src_direct >= 0),
  src_internal integer NOT NULL DEFAULT 0 CHECK (src_internal >= 0),
  src_other    integer NOT NULL DEFAULT 0 CHECK (src_other >= 0),
  PRIMARY KEY (news_id, locale, day)
);
CREATE INDEX news_performance_day_idx ON news_performance_daily (day, locale);

-- Which finished hours of which counters were already added, so a repeated or crashed rollup never counts twice.
CREATE TABLE analytics_flush (
  bucket     text PRIMARY KEY,
  rows       integer NOT NULL,
  flushed_at timestamptz NOT NULL DEFAULT now()
);

-- The newsroom's reports need their own capability.
ALTER TABLE app_role_capability DROP CONSTRAINT app_role_capability_capability_check;
ALTER TABLE app_role_capability ADD CONSTRAINT app_role_capability_capability_check CHECK (capability IN (
  'news.edit', 'news.submit', 'news.review', 'news.fact_check', 'news.publish',
  'news.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage', 'analytics.read'));
INSERT INTO app_role_capability (role_key, capability)
SELECT key, 'analytics.read' FROM app_role WHERE key IN ('managing_editor', 'analyst', 'admin')
ON CONFLICT DO NOTHING;

-- Down Migration

DELETE FROM app_role_capability WHERE capability = 'analytics.read';
ALTER TABLE app_role_capability DROP CONSTRAINT app_role_capability_capability_check;
ALTER TABLE app_role_capability ADD CONSTRAINT app_role_capability_capability_check CHECK (capability IN (
  'news.edit', 'news.submit', 'news.review', 'news.fact_check', 'news.publish',
  'news.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage'));
DROP TABLE analytics_flush;
DROP TABLE news_performance_daily;
