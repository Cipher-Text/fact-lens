# T3: category, analysis and topic pages from the API

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Needs T1 (`9ef0e8d`) and T2 (`b80da5b`). Reads: `apps/web/AGENTS.md`, `apps/web/src/content/index.ts` (`getCategoryPage`, `getAnalysisPage`, the topic page function), `apps/web/src/content/types.ts` (`CategoryPage`, `AnalysisPage`, `TopicPage`, `Topic`), `apps/web/src/lib/api/adapters.ts`, `apps/web/src/lib/api/client.ts`, `packages/contracts/src/taxonomy.ts`, `packages/contracts/src/analytics.ts` (`mostReadSchema`).

## Goal

When `FACTLENS_API_URL` is set, the category, analysis and topic pages are built from the API. When it is unset, they keep the mock content exactly as now. Components do not change.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/lib/api/pages.ts`:
  - `categoryPageFromApi(category: CategoryId, lang: Lang): Promise<CategoryPage>`
  - `analysisPageFromApi(lang: Lang): Promise<AnalysisPage>`
  - `topicPageFromApi(slug: string, lang: Lang): Promise<TopicPage | null>`
  All calls go through `apiGet` from `client.ts`. Errors are not caught here: `ApiUnavailable` and `ApiNotFound` propagate (T7 decides what readers see).
- Create `apps/web/src/lib/api/pages.test.ts` with fixtures that pass the contracts schemas.
- Edit the three page files under `apps/web/src/app/[lang]/`: `category/[id]/page.tsx`, `analysis/page.tsx`, `topic/[slug]/page.tsx`. Each page becomes `async` (if it is not already) and chooses the source: `apiBase() ? await <fromApi>(...) : <mockFn>(...)`. Nothing else in these files changes.

## Source for each list (decided)

- **Category page.** Build `CategoryPage` as the mock does in `getCategoryPage`, with the same counts and rules, over these API lists:
  - news: `GET /public/news/:lang?category=<key>&format=news&limit=50`
  - analysis: `GET /public/news/:lang?category=<key>&format=analysis&limit=5`
  - opinion: `GET /public/news/:lang?category=<key>&format=opinion&limit=5`
  - most read: `GET /public/most-read/:lang?category=<key>&limit=5`, mapped with `rank`
  Use the mock's selection logic for `cover`, `latest`, `cards` and `more`. `more` holds only the first 10; paging is later.
- **Analysis page.** `AnalysisPage` from `GET /public/news/:lang?format=analysis&limit=50`: cover is the first item, `top` the next 4, `more` the next 10. Follow `getAnalysisPage`.
- **Topic page.** Decision 23: a topic is an existing tag. `GET /public/news/:lang?tag=<slug>&limit=50`. The topic's name and slug come from the tag reference in the response's `filter` (`type: 'tag'`), so the page shows the tag's name in the page's language. Return `null` when the filter says there is no such tag in that language (the page then answers 404).

Stories come from `storyFromListItem` (T2). A list item whose category is not a site category is dropped by the adapter.

## Do NOT touch

Components, `src/content/**` (the mock stays as it is), the article and homepage pages, `apiBase` and the client, Playwright tests, `apps/api/**`, `packages/**`.

## Acceptance

1. With `FACTLENS_API_URL` unset, the three pages render exactly as before (existing tests pass unchanged).
2. With it set (tests inject the fetch), each page's data comes from the lists above, with the mock's selection rules.
3. A topic that does not exist in the language gives `null`, and the page calls `notFound()`.
4. Tests cover: the category selection (cover, latest, cards, more), analysis counts, opinion never in `more`, most read carrying `rank`, and topic `null`.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output of all four. Do not start dev servers, do not run `./run.sh`, do not commit.
