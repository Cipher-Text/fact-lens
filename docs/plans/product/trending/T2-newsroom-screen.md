# Trending terms: the newsroom screen (Codex)

Status: built (API, public read and newsroom configuration screen; ADR-045). Parent: [doc 26, section 5](../../../26-search-and-trending.md). The API is built (ADR-045): `GET /trending-searches/:locale` and `PUT /trending-searches/:locale` with body `{ terms: string[] }`, behind `config.manage`. The public read is `GET /public/trending-searches/:locale`.

## Goal

On the newsroom configuration page, an editor keeps the trending terms for each language: up to six, in order, each at most 60 characters and not listed twice (case-insensitively). Saving replaces the whole list through the API. An empty list is allowed (it hides the row on the site).

## Workspace

`@fact-lens/newsroom` (filter name `@fact-lens/newsroom`).

## Read first

- `AGENTS.md` (root): newsroom rules. Forms use `onSubmit` with `submitWith` (`apps/newsroom/src/lib/form.ts`), so a failed save keeps what was typed. Colours from the CSS variables in `globals.css`, never hard-coded.
- `apps/newsroom/src/app/(app)/config/page.tsx`: the configuration page. Look at how it loads data and gates what it shows (`can(principal, 'config.manage')` or the page's own pattern), and how the locale list is read there.
- `apps/newsroom/src/components/RelatedParts.tsx` and `apps/newsroom/src/lib/related.ts`: the pattern this screen follows (a small helper file with pure functions, and a client component that saves through `bff`, showing the API's message on failure).
- `packages/contracts/src/search.ts`: `trendingTermsSchema`, `TRENDING_MAX_TERMS` (6), `TRENDING_MAX_TERM` (60).

## Files

Create:
- `apps/newsroom/src/lib/trending.ts`: pure helpers, no React, no fetch.
  - `export const MAX_TERMS = 6;` and `export const MAX_TERM = 60;`
  - `addTerm(terms, raw): string[]`: trims; ignores an empty term; ignores a term already in the list (case-insensitive); returns the same array when there are already six.
  - `removeTerm(terms, index): string[]`.
  - `moveTerm(terms, index, direction: 'up' | 'down'): string[]`: no-op at the ends.
  - `validateTerms(terms): string | null`: returns the first problem as a message (too many, a term over 60 characters, a duplicate), or null.
- `apps/newsroom/src/lib/trending.test.ts`: tests for every helper, including the six-term limit, the case-insensitive duplicate, the 60-character limit, the ends of `moveTerm`, and an empty list being valid.
- `apps/newsroom/src/components/TrendingParts.tsx`: `export function TrendingTermsEditor({ locale, label, initialTerms }: { locale: string; label: string; initialTerms: string[] })`.
  - Shows the terms as an ordered list with up, down and remove buttons, and an input with an Add button (disabled at six terms). Each term is shown as typed.
  - Saves with `bff('PUT', \`trending-searches/${locale}\`, { terms })` on a Save button (not on each change). On success, replaces the list with the response. On failure, keeps the typed list and shows the API's message.
  - Heading `label` (the language name), and a short hint: "Up to six, in order. An empty list hides the row on the site."
  - Keep `useState` initialised from `initialTerms`. No browser storage.

Edit:
- `apps/newsroom/src/app/(app)/config/page.tsx`: load `trending-searches/:locale` for each active locale the page already knows (use the existing `api(...)` helper with a zod schema from `@fact-lens/contracts`, `trendingTermsSchema` for the response shape), and render one `TrendingTermsEditor` per locale in a "Trending searches" section, gated the same way as the rest of the page.
- `apps/newsroom/src/components/index.ts`: export `TrendingTermsEditor`.

## What NOT to touch

- Anything under `apps/api`, `packages/contracts`, `apps/web`, `apps/worker`. The API and contract are finished; if the API response does not match the spec, stop and report.
- `docs/` (the lead updates the docs).

## Acceptance criteria

- An editor adds, reorders, removes and saves terms for each language; the list survives a reload.
- Six terms is the limit: the add field is disabled at six. A term over 60 characters, and a term listed twice (ignoring case), are refused before saving with a clear message.
- A save of an empty list works and shows the row as empty.
- A failed save keeps the typed terms and shows the API's message.
- The section is hidden from anyone the page already hides config from.

## Verification

```bash
pnpm --filter @fact-lens/newsroom typecheck
pnpm --filter @fact-lens/newsroom lint
pnpm --filter @fact-lens/newsroom test
pnpm --filter @fact-lens/newsroom build
```
