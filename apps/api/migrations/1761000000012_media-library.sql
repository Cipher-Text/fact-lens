-- Up Migration

-- What the library needs beyond the first media_asset (docs/10): who uploaded what under which name,
-- the default alt text, and the rights fields: owner, credit line (attribution), source, expiry and
-- the channels the asset may be used on. `variants` holds the generated derivatives.
ALTER TABLE media_asset
  ADD COLUMN original_filename   text CHECK (length(original_filename) <= 200),
  ADD COLUMN alt_text            text CHECK (length(alt_text) <= 500),
  ADD COLUMN uploaded_by         text,
  ADD COLUMN rights_owner        text CHECK (length(rights_owner) <= 300),
  ADD COLUMN source_url          text CHECK (source_url IS NULL OR source_url ~* '^https?://'),
  ADD COLUMN rights_expires_at   timestamptz,
  ADD COLUMN permitted_channels  text[] NOT NULL DEFAULT '{web}'
                                 CHECK (permitted_channels <@ ARRAY['web', 'social', 'print']);

CREATE INDEX media_asset_created_idx ON media_asset (created_at DESC, id DESC);

-- One asset per file. The upload path looks the checksum up first, but two uploads of the same file
-- at once both pass that check, so the database must refuse the second.
DROP INDEX media_asset_sha256_idx;
CREATE UNIQUE INDEX media_asset_sha256_idx ON media_asset (sha256);

-- Down Migration

DROP INDEX media_asset_sha256_idx;
CREATE INDEX media_asset_sha256_idx ON media_asset (sha256);
DROP INDEX media_asset_created_idx;
ALTER TABLE media_asset
  DROP COLUMN permitted_channels, DROP COLUMN rights_expires_at, DROP COLUMN source_url, DROP COLUMN rights_owner,
  DROP COLUMN uploaded_by, DROP COLUMN alt_text, DROP COLUMN original_filename;
