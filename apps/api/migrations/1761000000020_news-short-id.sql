-- Up Migration

-- The public address of a news item is /story/<slug>-<id>. The id is short, the same in every language and
-- never changes; the slug is for people and can change (the page finds the item by the id).
-- The id is the creation time in milliseconds since 1970, written in base 36: 8 characters of 0-9a-z until
-- 2059. It sorts by creation time and can be read back (parseInt(id, 36)). The contract and the site accept
-- 6 to 8 characters. Two items in the same millisecond cannot share one: the later one takes the next free
-- millisecond. (A race between two writers still hits the unique key; the API retries.)
CREATE FUNCTION to_base36(n bigint) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE chars text := '0123456789abcdefghijklmnopqrstuvwxyz'; result text := '';
BEGIN
  IF n = 0 THEN RETURN '0'; END IF;
  WHILE n > 0 LOOP
    result := substr(chars, (n % 36)::int + 1, 1) || result;
    n := n / 36;
  END LOOP;
  RETURN result;
END $$;

CREATE FUNCTION new_short_id(at timestamptz DEFAULT clock_timestamp()) RETURNS text LANGUAGE plpgsql VOLATILE AS $$
DECLARE ms bigint := floor(extract(epoch FROM at) * 1000)::bigint; candidate text;
BEGIN
  LOOP
    candidate := lpad(to_base36(ms), 8, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM news WHERE short_id = candidate);
    ms := ms + 1;
  END LOOP;
  RETURN candidate;
END $$;

ALTER TABLE news ADD COLUMN short_id text;

-- Existing items get the id of their creation time, oldest first.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, created_at FROM news ORDER BY created_at, id LOOP
    UPDATE news SET short_id = new_short_id(r.created_at) WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE news ALTER COLUMN short_id SET DEFAULT new_short_id();
ALTER TABLE news ALTER COLUMN short_id SET NOT NULL;
ALTER TABLE news ADD CONSTRAINT news_short_id_format CHECK (short_id ~ '^[0-9a-z]{6,8}$');
ALTER TABLE news ADD CONSTRAINT news_short_id_key UNIQUE (short_id);

-- Down Migration

ALTER TABLE news DROP CONSTRAINT news_short_id_key;
ALTER TABLE news DROP CONSTRAINT news_short_id_format;
ALTER TABLE news DROP COLUMN short_id;
DROP FUNCTION new_short_id(timestamptz);
DROP FUNCTION to_base36(bigint);
