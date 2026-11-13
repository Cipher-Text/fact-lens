# Plan: branded photocard and poster generation

Status: **approved** (decisions below accepted as recommended on 14 November 2026). Work in progress: Wave 0.

## Goal

An editor picks a photo, a template and a crop, adds the text from the news item, and gets a branded photocard or poster. The output is a media asset linked to its source photo, template version and news item revision. Compositing is deterministic template work, not generative AI (ADR-010, [docs/10](../10-media-architecture.md)).

## Current state (checked in the code)

- Tables exist (migration `1761000000006_cards.sql`): `card_template` (versioned, status `draft`, `active`, `retired`) and `generated_card` (`media_asset_id` NOT NULL, so the output asset row must exist before the card row).
- Job `media.card_generate` has a contract (`{ generatedCardId }` in `packages/contracts/src/jobs.ts`) and a queue, and fails with "not implemented" in `apps/worker/src/processors/index.ts`.
- No outbox event starts it. `apps/worker/src/outbox/routes.ts` has no card route.
- No API endpoints, no newsroom screens, no templates.
- `sharp` is a dependency of `apps/api` (media variants, `apps/api/src/media/image.ts`). The worker has no sharp and no storage access; it talks to the API only through `/internal` with the shared token.
- Media status values `pending`, `processing`, `failed` exist and are unused (variants are made during the upload request). Card generation is the first use of the asynchronous path.

## Decisions (approved as recommended)

1. **Where compositing runs.** Recommended: in the worker, as `docs/10` says. The worker gets source bytes and stores the result only through new `/internal` endpoints, so it never holds storage credentials. Alternative: composite in the API during the request, like upload variants. That is simpler, but it departs from `docs/10` and needs an ADR.
2. **Template assets in v1.** Recommended: no uploaded fonts or SVG. Templates use a fixed set of fonts bundled with the worker, and reference them by name. This removes the template-asset upload risk for now.
3. **Who may do what.** Recommended: generating a card needs `news.edit`, and the source photo's rights must permit the `social` channel. Managing templates (draft, publish, retire) needs `config.manage`.
4. **Output rights.** Recommended: a generated card inherits the source photo's rights, attribution and expiry. It is not published to the web without the web permission.

## Design

- **Request:** `POST /news/:id/cards` (API, `news.edit`). In one transaction it creates a `media_asset` in status `pending` (the output), a `generated_card` row linking source, template version, revision, locale, crop and text inputs, an audit event, and an outbox event `card.requested`.
- **Fan-out:** outbox event `card.requested` routes to job `media.card_generate` with `{ generatedCardId }`. New event schema in `packages/contracts`, new route in `apps/worker/src/outbox/routes.ts` (required by `AGENTS.md`).
- **Render:** the worker reads the source derivative and the template through `GET /internal/cards/:id/inputs` (bytes and spec), composites with sharp (`composeCard`, a pure function), then sends the bytes with `POST /internal/cards/:id/render`. The API stores the file, sets the output asset to `ready` and writes an audit event. A repeated job with the same card is a no-op (jobs must be safe to run twice).
- **Failure:** a render error marks the output asset `failed` with a reason. The job uses the normal retry and dead-letter path.
- **Templates:** `GET /card-templates`, `POST /card-templates` (draft), `POST /card-templates/:id/publish` (draft to active, new version rather than editing an active one), `POST /card-templates/:id/retire`. Each writes an audit event.

## Ordering and ownership

Critical (Claude): contracts, the internal endpoints, the API endpoints and template rules, and the rights check. Normal (Codex): the compositor, the worker job, the newsroom panel.

- Wave 0 (Claude): decisions above, then the contracts (`card.requested` event and its schema) in its own task. Must pass before anything else.
- Wave 1 (parallel, separate worktrees):
  - T1 Claude: internal endpoints and the render path in the API.
  - T2 Codex: `composeCard` in the worker, with fixtures. No API calls.
- Wave 2 (Claude): T4, the public API endpoints and template rules. Needs T1 merged.
- Wave 3 (Codex): T3, the worker job and route. Needs T1 and T2 merged.
- Wave 4 (Codex): T5, the newsroom panel. Needs T4 merged.
- Migrations: none expected. The tables exist. If a later need arises (for example a card-level status), it becomes its own migration task that runs alone.

## Tasks

| ID | Task | Owner | Status |
| --- | --- | --- | --- |
| T0 | Contracts: `card.requested` event schema, card API types | Claude | pending |
| T1 | Internal endpoints: card inputs and render, with storage | Claude | pending |
| T2 | `composeCard` compositor in the worker, with tests | Codex | pending |
| T3 | Worker `media.card_generate` job and outbox route | Codex | pending |
| T4 | Public API: request a card, list cards, template rules | Claude | pending |
| T5 | Newsroom card panel: pick photo, template, crop, text | Codex | pending |

Specs are in [`card-generation/`](./card-generation/).

## Verification

- Per task: the filtered typecheck, lint and tests for that workspace.
- Database tests: `TEST_DATABASE_URL` (and `TEST_S3_*` for storage tests, which run against MinIO in CI).
- Before merge: `pnpm check` at the root, with the test variables set.
- After merge: render a card by hand against `./run.sh` in the main repo, and check the output image visually.

## Risks

- sharp in the worker needs its native build to be allowed. The root `pnpm-workspace.yaml` lists `sharp: false` under `allowBuilds`. Check this in T2 before relying on it.
- Fonts: the bundled font licences must allow the use. Check before T2 uses any.
- Rights: a card made from a photo with expired rights must not be produced. T4 owns that check.
