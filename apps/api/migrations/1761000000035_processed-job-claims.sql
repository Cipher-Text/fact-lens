-- Up Migration

-- A job is claimed before its work runs, and marked finished after it. A claim with no finish is a job
-- that is running, or one whose worker died; it is reclaimed once its claim is older than the lease (ADR-056).
-- Rows written before this migration were recorded after their work finished, so they are finished.
ALTER TABLE processed_job ADD COLUMN claimed_at timestamptz;
ALTER TABLE processed_job ADD COLUMN finished_at timestamptz;
UPDATE processed_job SET claimed_at = processed_at, finished_at = processed_at;
ALTER TABLE processed_job ALTER COLUMN claimed_at SET NOT NULL;

-- Down Migration

ALTER TABLE processed_job DROP COLUMN finished_at;
ALTER TABLE processed_job DROP COLUMN claimed_at;
