# T1: internal endpoints for card inputs and render

Owner: Claude (critical: media storage and the worker-to-API boundary). Wave 1. Needs T0 merged. Plan: [../card-generation.md](../card-generation.md). Reads: [docs/10](../../10-media-architecture.md) (storage, derivatives), `AGENTS.md` (worker boundary, audit in the same transaction).

## Goal

Give the worker what it needs to render a card, and a place to store the result, through `/internal` only. The worker never gets storage credentials.

## Workspace

`@fact-lens/api` (`apps/api`).

## Files

- Create `apps/api/src/cards/cards.internal.controller.ts` (or add to `apps/api/src/internal/internal.controller.ts`, following its pattern; the internal guard applies):
  - `GET /internal/cards/:id/inputs`: returns `{ template: { width, height, spec, aspectRatio }, source: { bytes, contentType }, headline, byline, crop, locale }`. Reads the source image's **derivative** (`card` variant, 800 px), never the original.
  - `POST /internal/cards/:id/render`: body is the rendered WebP bytes (`application/octet-stream`, size cap 5 MB). Stores under `derivatives/cards/<id>.webp` through the existing storage (`apps/api/src/media/storage.ts`), sets the output `media_asset` to `ready`, writes an audit event `card.render`, all in one transaction. Second call for a `ready` card returns 200 and changes nothing.
- Create `apps/api/src/cards/cards.service.ts` with `inputsFor(cardId)` and `storeRender(cardId, bytes)`.
- Create `apps/api/src/cards/cards.test.ts`.
- Edit `apps/api/src/app.module.ts` (or the module that registers internal routes) to register the service.

## Rules

- Both endpoints are behind the internal token guard. No `@RequireCapability`, and no `@Public()`.
- Refuse to render if the output's source asset is no longer `ready` or its rights fail the `social` channel check. Use the same rights rules as `apps/api/src/news/validation.ts`; do not copy them.
- Validate the render bytes the same way as an upload: sniff the type, re-encode with sharp, cap pixels. Do not trust the worker's bytes.
- Output media asset must not already be `ready` with different bytes.

## Do NOT touch

The public routes (T4), the newsroom, the worker, migrations (none needed).

## Acceptance

1. A worker with the token gets inputs for a valid card, and the bytes are the card-size derivative.
2. Without the token, both endpoints return 401 or 503 (as the guard does now).
3. A render stores the file, sets the asset `ready` and writes exactly one `card.render` audit row in the same transaction.
4. A repeated render is a no-op with no second audit row.
5. A render from a source whose rights no longer allow `social` is refused, and the output asset is set to `failed` with a reason.
6. Non-image bytes are refused.

## Verification

```bash
TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres pnpm --filter @fact-lens/api test
pnpm --filter @fact-lens/api typecheck
pnpm --filter @fact-lens/api lint
```

Report the output.
