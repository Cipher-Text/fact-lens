-- Up Migration

-- When the address of a section, region or tag changes, the old address keeps working: it redirects to the
-- current one (as news slugs do through news_slug). One row per replaced address, in the kind's own foreign
-- key so a deleted item takes its history with it. An address is unique per kind and language.
CREATE TABLE taxonomy_slug_history (
  locale      text NOT NULL REFERENCES locale (code),
  slug        text NOT NULL,
  category_id uuid REFERENCES category (id) ON DELETE CASCADE,
  tag_id      uuid REFERENCES tag (id) ON DELETE CASCADE,
  region_id   uuid REFERENCES region (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(category_id, tag_id, region_id) = 1)
);
CREATE UNIQUE INDEX taxonomy_slug_history_category_idx ON taxonomy_slug_history (locale, slug) WHERE category_id IS NOT NULL;
CREATE UNIQUE INDEX taxonomy_slug_history_tag_idx ON taxonomy_slug_history (locale, slug) WHERE tag_id IS NOT NULL;
CREATE UNIQUE INDEX taxonomy_slug_history_region_idx ON taxonomy_slug_history (locale, slug) WHERE region_id IS NOT NULL;
CREATE INDEX taxonomy_slug_history_category_item_idx ON taxonomy_slug_history (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX taxonomy_slug_history_tag_item_idx ON taxonomy_slug_history (tag_id) WHERE tag_id IS NOT NULL;
CREATE INDEX taxonomy_slug_history_region_item_idx ON taxonomy_slug_history (region_id) WHERE region_id IS NOT NULL;

-- Down Migration

DROP TABLE taxonomy_slug_history;
