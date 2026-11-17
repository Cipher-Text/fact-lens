# RN4: "Related news" panel in the newsroom (Codex)

Status: pending. Parent: [read-next](../read-next.md). Runs in parallel with RN5.

## Goal

On a news item's page an editor sets up to three Read next picks: search the newsroom's items, add one, order the picks, remove one. Saves go through the API (`PUT /news/:id/related`, built in RN2). The panel shows the picks the API returned, not a copy kept in the browser.

## Workspace

`@fact-lens/newsroom` (filter name `@fact-lens/newsroom`).

## Read first

- `AGENTS.md` (root): newsroom rules. Forms use `onSubmit` with `submitWith` (`apps/newsroom/src/lib/form.ts`), so a failed save keeps what was typed. Colours come from CSS variables, not hard-coded values.
- `apps/newsroom/src/components/NewsTagPicker` and `NewsRegionPicker` in `apps/newsroom/src/components/TaxonomyParts.tsx`: the same pattern (saved as you change it, search over a list, `bff` calls). Copy their structure, not their code.
- `apps/newsroom/src/lib/client.ts` (`bff`).
- API contract: `packages/contracts/src/news.ts`, `newsRelatedSchema` (up to 3 picks, positions 1 to 3, no duplicates). `GET /news/:id/related` returns `Array<{ newsId, position, title }>`.

## Files

Create:
- `apps/newsroom/src/lib/related.ts`: pure helpers (no React, no fetch):
  - `export const MAX_RELATED = 3;`
  - `export type RelatedPick = { newsId: string; position: number; title: string | null };`
  - `orderPicks(picks: RelatedPick[]): RelatedPick[]` sorts by position, then renumbers 1..n.
  - `addPick(picks, newsId, title): RelatedPick[]` appends at the end; returns the same array when already present or when there are 3 picks.
  - `removePick(picks, newsId): RelatedPick[]` removes and renumbers.
  - `movePick(picks, newsId, direction: 'up' | 'down'): RelatedPick[]` swaps with the neighbour; no-op at the ends.
  - `toPayload(picks): { related: Array<{ newsId: string; position: number }> }`.
  - `filterCandidates(items, query, excludeIds): Array<{ id: string; title: string }>` case-insensitive match on title; excludes the item itself and picks; at most 20 results.
- `apps/newsroom/src/lib/related.test.ts`: tests for every helper, including the three-item limit, the self exclusion, the renumbering after removal, and the ends of `movePick`.
- `apps/newsroom/src/components/RelatedParts.tsx`: `export function RelatedPicker({ newsId, picks, candidates }: { newsId: string; picks: RelatedPick[]; candidates: Array<{ id: string; title: string }> })`.
  - Shows the picks as a list with up/down and remove buttons, and an add search field (filtered with `filterCandidates`). Disabled add when three picks are set.
  - Saves with `bff('PUT', \`news/${newsId}/related\`, toPayload(next))`. On success, replaces the list from the response. On failure, keeps the list as it was and shows the API error message.
  - Heading "Related news", and a one-line hint: "Up to three. Shown under the article on the site; empty means the site fills the list itself."
- Keep the `useState` for the picks, initialised from the prop.

Edit:
- `apps/newsroom/src/components/index.ts`: export `RelatedPicker`.
- `apps/newsroom/src/app/(app)/news/[id]/page.tsx`: load `news/:id/related` with the same server helper the page uses for the other detail data, and load the candidates from the lists: `GET /news?status=PUBLISHED&limit=100`, then `UPDATED` and `CORRECTED` the same way (three calls, merged, titles from the list's English title, fall back to the item's `titles.en`). Render `<RelatedPicker>` in the same column as the tags and regions pickers, after them.

## Interfaces

- `PUT /news/:id/related` body `{ related: [{ newsId, position }] }`; response is the saved list.
- Candidates come from `GET /news?status=...&limit=100`. The list route has no text search, so the search covers the newest 100 items per status. This is a known limit. When any status list is full (100 items), the panel shows a line saying the search covers only the newest items. A text search on the list route is a later, critical change (Claude).

## What NOT to touch

- Any file in `apps/api`, `packages/contracts`, `apps/web`, `apps/worker`.
- The migration and the API endpoints (critical, Claude).
- Colours outside the CSS variables in `apps/newsroom/src/app/globals.css`.

## Acceptance criteria

- An editor can add, reorder, remove and save up to three picks, and the list survives a reload.
- A failed save keeps the typed search text and the unsaved order, and shows the API message.
- The add search never offers the item itself or an item already picked.
- The panel works with no items at all (the empty state is shown, not an error).
- No panel state is stored in the browser.

## Verification

```bash
pnpm --filter @fact-lens/newsroom typecheck
pnpm --filter @fact-lens/newsroom lint
pnpm --filter @fact-lens/newsroom test
pnpm --filter @fact-lens/newsroom build
```

## Docs

`docs/22-implementation-status.md` (the newsroom list of built screens, one line), and `docs/plans/product/read-next.md` (mark RN4 done when merged).
