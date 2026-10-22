-- Up Migration

-- The domain word is "news", not "story". Rename every table, column, index and constraint that carries
-- the old word, then the rows that spell it (capabilities, configuration, queued events). Audit rows are
-- append-only and keep the words they were written with.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'story%' LOOP
    EXECUTE format('ALTER TABLE %I RENAME TO %I', r.tablename, replace(r.tablename, 'story', 'news'));
  END LOOP;

  FOR r IN SELECT table_name, column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND column_name LIKE '%story%' LOOP
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', r.table_name, r.column_name, replace(r.column_name, 'story', 'news'));
  END LOOP;

  FOR r IN SELECT c.conrelid::regclass AS tbl, c.conname FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' AND c.conname LIKE '%story%' AND c.conrelid <> 0 LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', r.tbl, r.conname, replace(r.conname, 'story', 'news'));
  END LOOP;

  FOR r IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%story%' LOOP
    EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname, replace(r.indexname, 'story', 'news'));
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION correction_revision_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM news_revision WHERE id = NEW.revision_id AND is_correction) THEN
    RAISE EXCEPTION 'revision % is not flagged is_correction', NEW.revision_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE app_role_capability DROP CONSTRAINT app_role_capability_capability_check;
UPDATE app_role_capability SET capability = replace(capability, 'story.', 'news.') WHERE capability LIKE 'story.%';
ALTER TABLE app_role_capability ADD CONSTRAINT app_role_capability_capability_check CHECK (capability IN (
  'news.edit', 'news.submit', 'news.review', 'news.fact_check', 'news.publish',
  'news.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage'));

UPDATE configuration SET key = replace(key, 'story', 'news') WHERE key LIKE '%story%';
UPDATE configuration SET value = replace(value::text, '"story.', '"news.')::jsonb WHERE value::text LIKE '%"story.%';

UPDATE outbox_event
   SET aggregate_type = CASE WHEN aggregate_type = 'story' THEN 'news' ELSE aggregate_type END,
       event_type = replace(event_type, 'story.', 'news.'),
       payload = replace(replace(payload::text, '"storyId"', '"newsId"'), '"story.', '"news.')::jsonb
 WHERE aggregate_type = 'story' OR event_type LIKE 'story.%' OR payload::text LIKE '%"storyId"%';

-- Down Migration

UPDATE outbox_event
   SET aggregate_type = CASE WHEN aggregate_type = 'news' THEN 'story' ELSE aggregate_type END,
       event_type = replace(event_type, 'news.', 'story.'),
       payload = replace(replace(payload::text, '"newsId"', '"storyId"'), '"news.', '"story.')::jsonb
 WHERE aggregate_type = 'news' OR event_type LIKE 'news.%' OR payload::text LIKE '%"newsId"%';

UPDATE configuration SET value = replace(value::text, '"news.', '"story.')::jsonb WHERE value::text LIKE '%"news.%';
UPDATE configuration SET key = replace(key, 'news', 'story') WHERE key LIKE '%news%';

ALTER TABLE app_role_capability DROP CONSTRAINT app_role_capability_capability_check;
UPDATE app_role_capability SET capability = replace(capability, 'news.', 'story.') WHERE capability LIKE 'news.%';
ALTER TABLE app_role_capability ADD CONSTRAINT app_role_capability_capability_check CHECK (capability IN (
  'story.edit', 'story.submit', 'story.review', 'story.fact_check', 'story.publish',
  'story.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage'));

CREATE OR REPLACE FUNCTION correction_revision_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM story_revision WHERE id = NEW.revision_id AND is_correction) THEN
    RAISE EXCEPTION 'revision % is not flagged is_correction', NEW.revision_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%news%' LOOP
    EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname, replace(r.indexname, 'news', 'story'));
  END LOOP;
  FOR r IN SELECT c.conrelid::regclass AS tbl, c.conname FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' AND c.conname LIKE '%news%' AND c.conrelid <> 0 LOOP
    EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I', r.tbl, r.conname, replace(r.conname, 'news', 'story'));
  END LOOP;
  FOR r IN SELECT table_name, column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND column_name LIKE '%news%' LOOP
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', r.table_name, r.column_name, replace(r.column_name, 'news', 'story'));
  END LOOP;
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'news%' LOOP
    EXECUTE format('ALTER TABLE %I RENAME TO %I', r.tablename, replace(r.tablename, 'news', 'story'));
  END LOOP;
END $$;
