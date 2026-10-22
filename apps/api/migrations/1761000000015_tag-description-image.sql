-- Up Migration

-- A tag page has a short text per language, like a category, and one picture that does not depend on language.
ALTER TABLE tag_label ADD COLUMN description text CHECK (description IS NULL OR length(description) <= 500);
ALTER TABLE tag ADD COLUMN image_id uuid REFERENCES media_asset (id);
CREATE INDEX tag_image_idx ON tag (image_id) WHERE image_id IS NOT NULL;

-- Down Migration

DROP INDEX tag_image_idx;
ALTER TABLE tag DROP COLUMN image_id;
ALTER TABLE tag_label DROP COLUMN description;
