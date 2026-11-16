# Plan: card renders with identical bytes

Status: **done**. Resolves open question 29 in [docs/19](../19-open-questions.md); the decision is [ADR-036](../17-architecture-decisions.md).

## Goal

Two card requests that render to the same bytes (same photo, template, crop and text) must both succeed. Today the second render fails on the unique checksum of `media_asset`, the worker retries it and then dead-letters it, and the editor sees a card stuck in `failed`.

## Current state (checked in the code)

- `apps/api/migrations/1761000000012_media-library.sql` (lines 20 to 21) made `media_asset_sha256_idx` a **unique** index on `sha256`. Its down step (lines 25 to 26) recreates it as non-unique.
- Upload dedupe (`apps/api/src/media/media.service.ts`) looks up `WHERE sha256 = $1` before storing, and on a unique violation (SQLSTATE `23505`, line 127) returns the winner. Both paths depend on the unique index.
- Card outputs have object keys `derivatives/cards/<uuid>.webp` (`card-requests.service.ts`). Their checksum is `pending-<uuid>` until the render stores the real checksum.
- **Second problem found while planning:** the upload lookup does not exclude card outputs. Once a card renders bytes equal to an uploaded photo, uploading that photo would return the card's output asset as "the existing asset". This must be fixed with the migration, not after.

## Decision (recommended, to approve)

Keep the checksum unique for everything except card outputs, using a partial unique index. Card outputs are exempt because they are derived, one per request, and identified by their card, not by their bytes.

- Keep a plain (non-unique) `media_asset_sha256_idx` for lookups.
- Add a partial unique index on `sha256` `WHERE object_key NOT LIKE 'derivatives/cards/%'`.
- Upload lookups exclude card outputs (`AND object_key NOT LIKE 'derivatives/cards/%'`), so an upload never returns a card.

Rejected alternatives:
- Drop uniqueness everywhere: loses the upload race guarantee ("two simultaneous uploads make one asset").
- Reuse the first card output for an identical request: couples two cards that may later differ in rights or publication, and needs a cross-card rule. Revisit only if card volume makes duplicate storage costly.

## Tasks and ordering

Both are critical (migration and the upload path), so Claude implements them. They run in order and in one worktree, because the migration must run alone.

| ID | Task | Owner | Status |
| --- | --- | --- | --- |
| T1 | Migration `1761000000028_card-output-checksum.sql`: partial unique index, plain lookup index, down step with a guard | Claude | merged (4b00872) |
| T2 | Upload lookups exclude card outputs; tests for the race and for card/upload collisions | Claude | merged (9ba6b07) |
| T3 | Record ADR-036, resolve open question 29, update `docs/10` and `docs/22` | Claude | done |

Specs: [`card-duplicate-renders/`](./card-duplicate-renders/).

## Verification

- T1: run the migration up and down against a scratch database, and check the indexes with `\di` (or a catalogue query). The down step must refuse, with a clear error, while duplicate card checksums exist.
- T2: `TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres pnpm --filter @fact-lens/api test`, with `TEST_REDIS_URL` set for the full run.
- Before merge: `pnpm check` at the root with the test variables set.

## Risks

- Creating the partial index on a large table locks writes. Current volume is small; if this runs on production-sized data later, build the index concurrently in a separate step.
- The down step cannot restore uniqueness over card duplicates. It refuses instead of deleting data.
