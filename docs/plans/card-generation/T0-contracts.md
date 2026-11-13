# T0: contracts for card generation

Owner: Claude (critical: contracts, shared by API and worker). Wave 0. Must pass before every other task. Plan: [../card-generation.md](../card-generation.md). Reads: [docs/10](../../10-media-architecture.md) (branded cards), [docs/17](../../17-architecture-decisions.md) (ADR-010).

## Goal

Add the shared schemas the API, worker and newsroom use for cards. No behaviour, no database change.

## Workspace

`@fact-lens/contracts` (`packages/contracts`).

## Files

- Edit `packages/contracts/src/jobs.ts`: add the outbox event `card.requested` with payload `{ generatedCardId: idSchema }`, and register it in `outboxEventSchemas`.
- Create `packages/contracts/src/cards.ts`:
  - `cardAspectRatios` (`square`, `vertical`, `landscape`) from the existing `aspect_ratio` column.
  - `cardTemplateStatuses` (`draft`, `active`, `retired`).
  - `cardRequestSchema`: `{ templateId, sourceMediaAssetId, locale, crop: { x, y, width, height } (0 to 1), headline: string (1 to 300), byline?: string (max 200) }`.
  - `cardTemplateSchema` and `CardTemplate` type (id, key, version, name, aspectRatio, width, height, status).
  - `generatedCardSchema` and `GeneratedCard` type (id, mediaAssetId, sourceMediaAssetId, templateId, revisionId, locale, status of the output asset).
- Edit `packages/contracts/src/index.ts` to export `cards.ts`.
- Add tests in `packages/contracts/src/cards.test.ts`: valid request passes, crop outside 0 to 1 fails, empty headline fails, unknown aspect ratio fails.

## Do NOT touch

Any app code, migrations, the outbox routes (T3 owns them).

## Acceptance

1. The new event type is in the outbox event union, so an unlisted route fails typecheck in the worker (this is the intended guard).
2. Schemas are strict: unknown keys are rejected in `cardRequestSchema`.
3. All existing contract tests still pass.

## Verification

```bash
pnpm --filter @fact-lens/contracts build
pnpm --filter @fact-lens/contracts typecheck
pnpm --filter @fact-lens/contracts lint
pnpm --filter @fact-lens/contracts test
```

Also check that `pnpm --filter @fact-lens/worker typecheck` fails with a clear error about the missing `card.requested` route. That failure is expected until T3 merges, so record it in the merge note rather than fixing it here.
