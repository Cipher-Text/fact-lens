-- Up Migration

-- Append-only audit trail (docs/06, docs/12): no UPDATE, DELETE or TRUNCATE on normal paths.
CREATE TABLE audit_event (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  actor_type     text NOT NULL CHECK (actor_type IN ('human', 'system', 'ai')),
  actor_id       text,
  action         text NOT NULL,
  object_type    text NOT NULL,
  object_id      text NOT NULL,
  story_id       uuid,
  revision_id    uuid,
  previous_state text,
  new_state      text,
  reason         text,
  request_id     text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX audit_event_object_idx ON audit_event (object_type, object_id, occurred_at DESC);
CREATE INDEX audit_event_story_idx ON audit_event (story_id, occurred_at DESC) WHERE story_id IS NOT NULL;

CREATE FUNCTION audit_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_event is append-only (% not allowed)', TG_OP USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER audit_event_no_change
  BEFORE UPDATE OR DELETE ON audit_event
  FOR EACH ROW EXECUTE FUNCTION audit_event_immutable();

CREATE TRIGGER audit_event_no_truncate
  BEFORE TRUNCATE ON audit_event
  FOR EACH STATEMENT EXECUTE FUNCTION audit_event_immutable();

-- Transactional outbox: written in the same transaction as the change, dispatched by the worker.
CREATE TABLE outbox_event (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_type text NOT NULL,
  aggregate_id   text NOT NULL,
  event_type     text NOT NULL,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  available_at   timestamptz NOT NULL DEFAULT now(),
  dispatched_at  timestamptz,
  attempts       integer NOT NULL DEFAULT 0,
  last_error     text
);

CREATE INDEX outbox_event_pending_idx ON outbox_event (available_at, id) WHERE dispatched_at IS NULL;

-- Down Migration

DROP TABLE outbox_event;
DROP TABLE audit_event;
DROP FUNCTION audit_event_immutable();
