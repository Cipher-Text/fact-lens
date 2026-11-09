-- Up Migration

-- A contributor's public profile: one picture from the media library and the accounts the byline links to.
-- Social links are an object of network -> https address (the networks in the contracts).
ALTER TABLE contributor ADD COLUMN image_id uuid REFERENCES media_asset (id);
ALTER TABLE contributor ADD COLUMN social_links jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(social_links) = 'object');
ALTER TABLE contributor ADD CONSTRAINT contributor_name CHECK (length(btrim(display_name)) BETWEEN 1 AND 200);

CREATE INDEX contributor_name_idx ON contributor (lower(display_name));
CREATE INDEX contributor_image_idx ON contributor (image_id) WHERE image_id IS NOT NULL;

-- Down Migration

DROP INDEX contributor_image_idx;
DROP INDEX contributor_name_idx;
ALTER TABLE contributor DROP CONSTRAINT contributor_name;
ALTER TABLE contributor DROP COLUMN social_links;
ALTER TABLE contributor DROP COLUMN image_id;
