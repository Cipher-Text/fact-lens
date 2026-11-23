-- Up Migration

-- One vote per network address per poll, enforced by the database rather than by a lock on the poll (ADR-060).
-- A repeat from one address is refused by the index, even when two votes race. The old index is replaced by it.
-- Fails if an address already has two votes on one poll: none should exist, since the lock held them apart.
DROP INDEX poll_vote_ip_idx;
CREATE UNIQUE INDEX poll_vote_ip_unique ON poll_vote (poll_id, ip_hash) WHERE ip_hash IS NOT NULL;

-- Down Migration

DROP INDEX poll_vote_ip_unique;
CREATE INDEX poll_vote_ip_idx ON poll_vote (poll_id, ip_hash, created_at);
