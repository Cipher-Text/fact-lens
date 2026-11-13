# T4: public API for card requests and template management

Owner: Claude (critical: authorisation, rights, audit, and the outbox event). Wave 2. Needs T1 merged. Plan: [../card-generation.md](../card-generation.md). Reads: [docs/10](../../10-media-architecture.md) (rights), [docs/06](../../06-editorial-workflow.md), `AGENTS.md` (capabilities, audit and outbox in one transaction).

## Goal

Let an editor request a card from a news item, list the cards, and manage templates.

## Workspace

`@fact-lens/api` (`apps/api`).

## Files

- Create `apps/api/src/cards/cards.controller.ts`:
  - `POST /news/:id/cards` with `RequireCapability('news.edit')`, body `cardRequestSchema`. Creates the output `media_asset` (status `pending`), the `generated_card` row (source, template version, revision, locale, crop, text inputs) and the `card.requested` outbox event, in one transaction, with an audit event `card.request`.
  - `GET /news/:id/cards` with `RequireAnyCapability(editorial capabilities)`. Lists the cards for a news item with the output status.
  - `GET /card-templates` with editorial capabilities.
  - `POST /card-templates` (draft), `POST /card-templates/:id/publish`, `POST /card-templates/:id/retire`, all with `RequireCapability('config.manage')`. Publishing makes a new version active; an active version is never edited in place.
- Create `apps/api/src/cards/cards.service.ts` with the rules below.
- Create `apps/api/src/cards/cards.test.ts` (database tests, skipped without `TEST_DATABASE_URL`).
- Edit `packages/contracts` only if a schema is missing (T0 owns it; ask first).

## Rules

- Source rights: the source photo must be `ready`, its rights must permit `social`, and it must not be expired. Use the same checks as `apps/api/src/news/validation.ts`; do not copy them.
- The template must be `active`. A draft or retired template cannot be used.
- The text comes from the news item's translation in the requested locale. Refuse if that translation has no title.
- Crop must be inside the photo (0 to 1), checked again here, not only in the schema.
- `generated_card` links the revision that was current when the card was requested.
- Template assets: none in v1 (plan decision 2). Reject any `assets` field.

## Do NOT touch

The internal endpoints (T1), the worker, the newsroom, migrations.

## Acceptance

1. An editor with `news.edit` requests a card on a news item and gets a `pending` card. One `card.requested` outbox row and one `card.request` audit row exist, in the same transaction.
2. A request with an expired or non-social source is refused with a reason, and nothing is written.
3. A request using a draft template is refused.
4. Publishing a template creates a new version; the old active version stays unchanged.
5. A user without `config.manage` cannot manage templates (403).
6. Crop outside 0 to 1 is refused even if it passes the schema.

## Verification

```bash
TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres pnpm --filter @fact-lens/api test
pnpm --filter @fact-lens/api typecheck
pnpm --filter @fact-lens/api lint
```

Report the output.
