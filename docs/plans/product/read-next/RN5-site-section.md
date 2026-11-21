# RN5: the Read next section on the site (Codex)

Status: built (commit 7ddbfff). Parent: [read-next](../read-next.md). Runs in parallel with RN4. Depends on RN3 (built, `a8b1493`).

## Goal

The article page shows up to three related items from the API under the article, as doc 23 section 1 describes. The section is hidden when there are none. In API mode the page never shows mock content.

## Workspace

`fact-lens-web` (filter name `fact-lens-web`). `apps/web` is maintained in this repo. Do not change `fact-lens-web`'s design source or `apps/web/docs/design-system/`.

## Read first

- `apps/web/AGENTS.md` and `apps/web/CLAUDE.md`. Design-system rule IDs apply to all `apps/web` work. The orchestration note in `apps/web/CLAUDE.md` is superseded: this is Codex work.
- `docs/23-read-next.md` section 1 (layout: three cards in a row from 1024 px, two from 600 px, one below) and sections 3 to 5 (rules).
- `docs/plans/product/read-next.md` (RN5).
- `apps/web/src/app/[lang]/story/[slug]/page.tsx`: the API branch renders `<ReaderPage ... readNext={[]} />`. This is the line to change.
- `apps/web/src/components/reader/ArticleParts.tsx`, `ReadNext` (line ~224): already hides on empty and already uses `StoryCard`. Keep it; change only the grid breakpoints.
- `apps/web/src/lib/api/client.ts` (`apiGet`, `ApiNotFound`, `ApiUnavailable`) and `apps/web/src/lib/api/adapters.ts` (`storyFromListItem`).
- `apps/web/src/lib/api/article.ts` (`articleFromApi`) for how the page reads the API.
- API: `GET /public/news/:locale/:ref/related?limit=3` (built in RN3). Response `{ items: PublicNewsListItem[] }`. `:ref` is the story page's `slug` param unchanged.

## Files

Create:
- `apps/web/src/lib/api/related.ts`:
  - `export async function readNextFromApi(ref: string, lang: Lang): Promise<ReadNextItem[]>` calls `apiGet` on `/public/news/${lang}/${encodeURIComponent(ref)}/related`, validates with `publicRelatedListSchema` from `@fact-lens/contracts`, maps each item with `storyFromListItem`, and drops nulls. Returns `[]` for `ApiNotFound`.
  - On `ApiUnavailable` or a bad response, it returns `[]` and records the failure with `console.warn` (no user-visible error): the article must still render.
- `apps/web/src/lib/api/related.test.ts`: tests with a stubbed `fetch`: maps items, drops items `storyFromListItem` cannot map, returns `[]` on 404, `[]` on 503 (unavailable), `[]` on a malformed body, and sends the right URL (locale and encoded ref).

Edit:
- `apps/web/src/app/[lang]/story/[slug]/page.tsx`: in the API branch, `const readNext = await readNextFromApi(slug, lang);` (in parallel with `articleFromApi` where possible), and pass `readNext={readNext}` instead of `[]`.
- `apps/web/src/components/reader/ArticleParts.tsx`: the `ReadNext` grid classes become one column, two from 600 px, three from 1024 px. Use arbitrary breakpoints (`min-[600px]:grid-cols-2 min-[1024px]:grid-cols-3`) so the sizes match doc 23, not Tailwind's `sm`/`lg`. Keep `data-read-next` and the heading.
- `apps/web/src/i18n/en.ts` and `bn.ts`: no new strings are needed (the heading `t.readNext` exists). Do not add Bangla copy.

Do NOT change the mock path: `getReadNext(lang)` stays for mock mode (no `FACTLENS_API_URL`).

## Interfaces

- `ReadNextItem` (existing, `apps/web/src/content/reader.ts`): `{ story: Story }`. Reuse it.
- `storyFromListItem(item, lang): Story | null` (existing).

## What NOT to touch

- `apps/api`, `packages/contracts`, the worker and the newsroom (RN4 is in the newsroom).
- The mock content (`reader-articles.ts`, `getReadNext`) except as a read.
- `apps/web/docs/design-system/`.
- Any `fact-lens-web` source.

## Acceptance criteria

- With items, the section renders after the tags and the ad band, with a card per item showing image, title, category and reading time from the API.
- With no items (empty list, 404, or the API unavailable), the section is absent and the article still renders (no error page).
- In API mode no mock story ever appears in the section.
- The grid is one column below 600 px, two from 600 px, three from 1024 px (check at 375 px, 768 px and 1280 px in the browser when the API is running).
- Mock mode (`FACTLENS_API_URL` unset) is unchanged: `getReadNext` still feeds the section there.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Browser check in mock mode is the regression check. The section is hidden there only if no mock items remain; state what you saw. A manual check against a running API is listed as a separate open item (see the implementation status), not done by Codex.

## Docs

`docs/22-implementation-status.md` (the site line for Read next: now built in API mode), and `docs/plans/product/read-next.md` (mark RN5 done when merged).
