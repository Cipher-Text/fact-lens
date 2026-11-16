# T5: homepage, regions and region pages from the API

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Needs T1 to T4 (merged). Approved defaults (17 November 2026): hero and sections from the newest items; featured sections are the Geopolitics category and the Asia region; every category block shows its newest three news items; a section with no items is left out. Reads: `apps/web/AGENTS.md`, `apps/web/src/content/types.ts` (`Homepage`, `HeroContent`, `FeaturedSection`, `CategoryBlock`, `AnalysisOpinionSection`, `RegionBlock`, `RegionsPage`, `RegionPage`), `apps/web/src/content/index.ts` (`getHomepage`, `getRegionsPage`, `getRegionPage`), `apps/web/src/app/[lang]/page.tsx`, `apps/web/src/app/[lang]/regions/page.tsx`, `apps/web/src/app/[lang]/regions/[slug]/page.tsx`, `apps/web/src/lib/api/pages.ts` (T3, the pattern to follow), `apps/web/src/lib/api/adapters.ts` (T2).

## Goal

With `FACTLENS_API_URL` set, the homepage, the regions page and the region page are built from the API's lists. Without it they keep the mock content. Components do not change.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/lib/api/home.ts`:
  - `homepageFromApi(lang: Lang): Promise<Homepage>`
  - `regionsPageFromApi(lang: Lang): Promise<RegionsPage>`
  - `regionPageFromApi(lang: Lang, slug: string): Promise<RegionPage | undefined>`
  All calls go through `apiGet` (`client.ts`). Errors propagate.
- Create `apps/web/src/lib/api/home.test.ts` with fixtures that pass the contracts schemas.
- Edit `apps/web/src/app/[lang]/page.tsx`: in API mode it awaits `homepageFromApi(lang)`; otherwise it calls `getHomepage` exactly as now. The poll and social-link calls are not changed.
- Edit `apps/web/src/app/[lang]/regions/page.tsx` and `apps/web/src/app/[lang]/regions/[slug]/page.tsx` the same way. `regionPageFromApi` returning `undefined` gives `notFound()`.

## Rules (approved)

- **Hero.** From `GET /public/news/:lang?format=news&limit=50`: the lead is the newest item with an image, then `top` is the next two items and `latest` the next five. No lead means `hero: null`.
- **Analysis and opinion.** `analysis` from `?format=analysis&limit=3`, `opinion` from `?format=opinion&limit=3`. The section is `null` when both are empty.
- **Featured.** `southAsia` is the Asia region (`?region=asia&excludeFormat=opinion&limit=4`): the first item is the feature, the next three the rail. `geopolitics` is the Geopolitics category, the same way. A source with no items is `null`.
- **Grouped categories.** For each of the five site categories, `?category=<key>&format=news&limit=3`. Categories with no items are left out. `poll` is not built here: the route keeps its current poll source.
- **Most read.** `GET /public/most-read/:lang?limit=5`, with `rank`. `null` when empty.
- **Regions.** For each region listed by `GET /public/regions/:lang` that is one of the site's regions, `?region=<key>&excludeFormat=opinion&limit=3`. Regions with no items are left out. `RegionsPage.cover` is the newest item with an image, `latest` the next five newest items with any region.
- **Region page.** `?region=<slug>&excludeFormat=opinion&limit=20`, the first 10 kept. A slug that is not a site region gives `undefined`.
- **Variant.** In API mode the homepage variant is ignored: the sparse plan is a mock arrangement. The `full` plan is what the API drives.
- **Stories** come from `storyFromListItem` (T2). Items whose category is not a site category are dropped by the adapter.

## Do NOT touch

Components, `src/content/**` (the mock stays as it is), the poll and social-link calls, the ads (they stay mock until ad serving exists; this is a known exception, recorded in the plan), the article, category, analysis and topic pages, Playwright tests, `apps/api/**`, `packages/**`.

## Acceptance

1. Mock mode: the three pages render exactly as before (existing tests pass unchanged).
2. API mode, with fetch injected in tests: the hero, featured, grouped, most read, analysis and regions come from the lists by the rules above.
3. A section with no items is `null` or left out, never filled with mock content.
4. A region slug that is not a site region gives `undefined` and a 404.
5. Tests cover: hero selection (first with an image), featured sources, grouped categories left out when empty, regions left out when empty, the region page filter and the 404 case.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output of all four. Do not start dev servers, do not run `./run.sh`, do not commit.
