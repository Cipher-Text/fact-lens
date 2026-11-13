# T3: worker job and outbox route for card generation

Owner: Codex (normal execution). Wave 3. Needs T1 and T2 merged. Plan: [../card-generation.md](../card-generation.md). Reads: `AGENTS.md` (outbox routes, jobs must be safe to run twice, worker changes state only through the API).

## Goal

Replace the `media.card_generate` stub with a real job. Route the new outbox event `card.requested` to it.

## Workspace

`@fact-lens/worker` (`apps/worker`).

## Files

- Edit `apps/worker/src/outbox/routes.ts`: add `'card.requested': (p) => [job('media.card_generate', { generatedCardId: p.generatedCardId })]`.
- Edit `apps/worker/src/processors/index.ts`: replace `'media.card_generate': notBuilt(...)` with a processor:
  1. `GET /internal/cards/:id/inputs` through the worker's API client (`apps/worker/src/api-client.ts`).
  2. `composeCard` (from T2).
  3. `POST /internal/cards/:id/render` with the bytes.
  - On an API 409 or a card already `ready`, log and succeed (safe to run twice).
  - On a render failure, throw so the normal retry and dead-letter path applies.
- Create `apps/worker/src/processors/card-generate.test.ts`: uses a fake API client and the real `composeCard` on a fixture.

## Rules

- The worker does not read or write the database for cards. It uses the API client only.
- Do not add storage credentials to the worker.
- Do not change the retry or dead-letter behaviour.

## Do NOT touch

`apps/api/**`, `packages/contracts/**` (T0 is done), `apps/worker/src/cards/compose.ts` (T2 owns it), migrations.

## Acceptance

1. `card.requested` routes to exactly one `media.card_generate` job with the same `generatedCardId`.
2. A happy-path run calls inputs, then render, and succeeds.
3. Running it twice gives the same result and no error.
4. A render failure throws, so the job retries.
5. The worker typecheck passes now (it failed on the missing route before this task).

## Verification

```bash
pnpm --filter @fact-lens/worker typecheck
pnpm --filter @fact-lens/worker lint
TEST_REDIS_URL=redis://localhost:6379 pnpm --filter @fact-lens/worker test
```

Report the output of all three.
