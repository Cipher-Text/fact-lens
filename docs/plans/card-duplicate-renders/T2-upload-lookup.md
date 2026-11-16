# T2: upload lookups exclude card outputs

Owner: Claude (critical: upload handling). Runs after T1 is merged. Plan: [../card-duplicate-renders.md](../card-duplicate-renders.md). Reads: [docs/10](../../10-media-architecture.md) (uploads, identical bytes return the existing asset).

## Goal

An upload must never return a card output as "the existing asset", and the upload race handling must keep working.

## Workspace

`@fact-lens/api` (`apps/api`).

## Files

- Edit `apps/api/src/media/media.service.ts`: both lookups (`WHERE m.sha256 = $1`, line 88 and the winner lookup at line 128) add `AND m.object_key NOT LIKE 'derivatives/cards/%'`.
- Edit `apps/api/src/media/media.test.ts`: add tests (see acceptance). Use the existing `fresh()` and `asset()` helpers.
- Edit `apps/api/src/cards/cards.test.ts` only if a render helper is needed. Do not change the card code.

## Do NOT touch

The migration (T1), the card service, the public routes, docs (T3).

## Acceptance

1. Two card renders with identical bytes both succeed and produce two `ready` outputs with the same checksum. (Write this test in `cards.test.ts`; it fails before T1.)
2. An upload of bytes equal to a card output stores a new original and returns `created: true`; it does not return the card asset.
3. Two identical uploads still return one asset (`created: false` the second time), as today.
4. Two simultaneous identical uploads still produce one asset (the existing race test keeps passing).
5. A card output's checksum is never used to dedupe an upload.

## Verification

```bash
TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres TEST_REDIS_URL=redis://localhost:6379 pnpm --filter @fact-lens/api test
pnpm --filter @fact-lens/api typecheck
pnpm --filter @fact-lens/api lint
```
Report the output.
