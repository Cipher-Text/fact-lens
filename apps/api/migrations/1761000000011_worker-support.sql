-- Up Migration

-- Outbox dispatch (docs/08): a claim is a lease, and a row that keeps failing is parked, not retried forever.
ALTER TABLE outbox_event
  ADD COLUMN lease_until timestamptz,
  ADD COLUMN failed_at   timestamptz,
  ADD CONSTRAINT outbox_event_one_outcome CHECK (dispatched_at IS NULL OR failed_at IS NULL);

DROP INDEX outbox_event_pending_idx;
CREATE INDEX outbox_event_pending_idx ON outbox_event (available_at, id)
  WHERE dispatched_at IS NULL AND failed_at IS NULL;
-- The dead-letter view: rows an operator needs to look at.
CREATE INDEX outbox_event_failed_idx ON outbox_event (failed_at) WHERE failed_at IS NOT NULL;

-- Consumers are idempotent by event/operation key: a key is recorded once its work has committed.
CREATE TABLE processed_job (
  idempotency_key text PRIMARY KEY,
  job_type        text NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX processed_job_time_idx ON processed_job (processed_at);

-- Down Migration

DROP TABLE processed_job;
DROP INDEX outbox_event_failed_idx;
DROP INDEX outbox_event_pending_idx;
CREATE INDEX outbox_event_pending_idx ON outbox_event (available_at, id) WHERE dispatched_at IS NULL;
ALTER TABLE outbox_event
  DROP CONSTRAINT outbox_event_one_outcome,
  DROP COLUMN failed_at,
  DROP COLUMN lease_until;
