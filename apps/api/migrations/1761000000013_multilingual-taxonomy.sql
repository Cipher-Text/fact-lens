-- Up Migration

-- Categories are the news menu; tags are many per story. Both are one record with a label per
-- language (the label tables already exist), and the set of languages is the `locale` table, so a
-- new language needs rows, not a migration. This adds what the existing system had on top: a
-- category can be hidden from the menu, and a category label has a description.
ALTER TABLE category ADD COLUMN show_in_menu boolean NOT NULL DEFAULT true;
ALTER TABLE category_label ADD COLUMN description text CHECK (length(description) <= 500);

-- Keys are stable, language-free identifiers (for example `local`); labels carry the words.
ALTER TABLE category ADD CONSTRAINT category_key_format CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE tag ADD CONSTRAINT tag_key_format CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE category_label ADD CONSTRAINT category_label_name CHECK (length(btrim(name)) BETWEEN 1 AND 120);
ALTER TABLE tag_label ADD CONSTRAINT tag_label_name CHECK (length(btrim(name)) BETWEEN 1 AND 120);

-- The menu is read in order, and "what uses this" is asked of both directions.
CREATE INDEX category_menu_idx ON category (position, key) WHERE status = 'active' AND show_in_menu;
CREATE INDEX story_category_idx ON story (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX story_tag_tag_idx ON story_tag (tag_id);

-- Down Migration

DROP INDEX story_tag_tag_idx;
DROP INDEX story_category_idx;
DROP INDEX category_menu_idx;
ALTER TABLE tag_label DROP CONSTRAINT tag_label_name;
ALTER TABLE category_label DROP CONSTRAINT category_label_name;
ALTER TABLE tag DROP CONSTRAINT tag_key_format;
ALTER TABLE category DROP CONSTRAINT category_key_format;
ALTER TABLE category_label DROP COLUMN description;
ALTER TABLE category DROP COLUMN show_in_menu;
