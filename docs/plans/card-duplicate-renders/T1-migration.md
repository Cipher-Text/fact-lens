# T1: migration for card output checksums

Owner: Claude (critical: SQL migration). Runs alone. Plan: [../card-duplicate-renders.md](../card-duplicate-renders.md). Reads: [docs/10](../../10-media-architecture.md), `AGENTS.md` (migrations: new file, Up and Down, never edit one on `main`).

## Goal

Replace the unique checksum index with a plain lookup index and a partial unique index that exempts card outputs.

## Workspace

`@fact-lens/api` (`apps/api`), migrations only.

## Files

- Create `apps/api/migrations/1761000000028_card-output-checksum.sql`.

Up:
```sql
DROP INDEX media_asset_sha256_idx;
CREATE INDEX media_asset_sha256_idx ON media_asset (sha256);
CREATE UNIQUE INDEX media_asset_sha256_unique_idx ON media_asset (sha256)
  WHERE object_key NOT LIKE 'derivatives/cards/%';
```

Down (refuses while card outputs share a checksum with another asset, instead of deleting anything):
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM media_asset GROUP BY sha256 HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Cannot restore the unique checksum index: some assets share a checksum';
  END IF;
END $$;
DROP INDEX media_asset_sha256_unique_idx;
DROP INDEX media_asset_sha256_idx;
CREATE UNIQUE INDEX media_asset_sha256_idx ON media_asset (sha256);
```

Keep the header comment in the migration file style used by `1761000000012_media-library.sql`.

## Do NOT touch

Any other migration, application code (T2), docs (T3), any `.env` file.

## Acceptance

1. After Up: `media_asset_sha256_idx` is non-unique; `media_asset_sha256_unique_idx` is unique and partial on card outputs.
2. Two assets with the same checksum are allowed when one is a card output; two originals with the same checksum are still refused.
3. Down succeeds on a database with no duplicate checksums, and restores the unique index.
4. Down refuses with the stated error when duplicate checksums exist, and changes nothing.

## Verification

```bash
# on a scratch database (not the test database)
createdb fl_mig_scratch  # via the factlens role
DATABASE_URL=postgres://factlens:factlens@localhost:5432/fl_mig_scratch pnpm --filter @fact-lens/api migrate up
DATABASE_URL=postgres://factlens:factlens@localhost:5432/fl_mig_scratch pnpm --filter @fact-lens/api migrate down
```
Then insert the rows described in acceptance 2 and 4 with `psql` and report the results. Drop the scratch database when done.
