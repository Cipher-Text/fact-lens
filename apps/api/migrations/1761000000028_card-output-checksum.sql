-- Up Migration

-- A branded card is derived, one per request, and identified by its card (docs/10). Two cards that
-- render to the same bytes must both succeed, so card outputs are exempt from the unique checksum.
-- Every other asset keeps one row per checksum, which the upload race handling relies on.
DROP INDEX media_asset_sha256_idx;
CREATE INDEX media_asset_sha256_idx ON media_asset (sha256);
CREATE UNIQUE INDEX media_asset_sha256_unique_idx ON media_asset (sha256)
  WHERE object_key NOT LIKE 'derivatives/cards/%';

-- Down Migration

-- Refuses rather than deletes: restoring uniqueness is impossible while two assets share a checksum.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM media_asset GROUP BY sha256 HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Cannot restore the unique checksum index: some assets share a checksum';
  END IF;
END $$;
DROP INDEX media_asset_sha256_unique_idx;
DROP INDEX media_asset_sha256_idx;
CREATE UNIQUE INDEX media_asset_sha256_idx ON media_asset (sha256);
