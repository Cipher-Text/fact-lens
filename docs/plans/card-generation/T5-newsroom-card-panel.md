# T5: newsroom card panel

Owner: Codex (normal execution). Wave 4. Needs T4 merged. Plan: [../card-generation.md](../card-generation.md). Reads: [docs/07](../../07-newsroom-application.md) (media library, branded cards), `AGENTS.md` (newsroom rules: CSS variables, `onSubmit` forms, the API decides what a person may do).

## Goal

On the news item page, an editor can request a branded card, see its status, and open the result when it is ready.

## Workspace

`@fact-lens/newsroom` (`apps/newsroom`).

## Files

- Create `apps/newsroom/src/components/CardParts.tsx`: a client component with
  - a form: source photo (pick from the media library, by asset id), template (from `GET /card-templates`, active only), locale (from the news item's translations), crop (four number inputs, 0 to 1), headline (prefilled from the translation title, editable), byline (optional).
  - a list of this news item's cards with status (`pending`, `ready`, `failed`) and, for `ready`, a link to the public derivative.
- Edit `apps/newsroom/src/app/(app)/news/[id]/page.tsx`: add a "Cards" panel using the component. Only the new panel; do not change others.
- Create `apps/newsroom/src/lib/cards.ts` for pure helpers (crop validation, headline default), and `apps/newsroom/src/lib/cards.test.ts`.

## Rules

- Form submit uses `onSubmit` with `submitWith` from `@/lib/form`, so a failed request keeps what was typed.
- Show the API's refusal message and `issues` through `Notice`. Do not re-check rights in the UI; show the reason the API gives.
- Hide the form for people without `news.edit` (`can(principal, 'news.edit')` from `@/lib/nav`). This is a convenience only.
- Poll nothing. A pending card updates when the page is refreshed.
- Colours from CSS variables only.

## Do NOT touch

`apps/api/**`, `packages/**`, the worker, other panels on the news page.

## Acceptance

1. An editor can request a card and sees it as `pending` after the request.
2. After a refresh, a rendered card shows `ready` and links to its image.
3. A refused request shows the API reason and keeps the typed values.
4. Only active templates appear in the picker.
5. Light and dark both work.

## Verification

```bash
pnpm --filter @fact-lens/newsroom typecheck
pnpm --filter @fact-lens/newsroom lint
pnpm --filter @fact-lens/newsroom test
pnpm --filter @fact-lens/newsroom build
```

Report the output of all four.
