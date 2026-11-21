# T2: adapters from API news to the site's Story

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Needs T1 (merged, `9ef0e8d`). Reads: `apps/web/AGENTS.md`, `apps/web/src/content/types.ts` (`Story`, `ImageRef`, `CategoryId`, `RegionId`), `packages/contracts/src/taxonomy.ts` (`publicNewsListItemSchema`), `packages/contracts/src/news.ts` (`publicNewsSchema`), `packages/contracts/src/media.ts` (`publicMediaSchema`).

## Goal

Pure functions that turn API responses into the site's `Story` type. Nothing calls the API yet, and no page changes. T3 to T5 use these functions.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/lib/api/adapters.ts` with:
  - `storyFromListItem(item: PublicNewsListItem, lang: Lang): Story | null`
  - `storyFromNews(item: PublicNews, lang: Lang): Story | null`
  - `imageFromMedia(media: PublicMedia | null, lang: Lang): ImageRef | undefined`
  - `siteCategory(ref: { key: string } | null): CategoryId | null`
  - `siteRegions(refs: Array<{ key: string }>): RegionId[]`
  Types come from `@fact-lens/contracts` (the schemas' inferred types) and from `src/content/types`.
- Create `apps/web/src/lib/api/adapters.test.ts` with fixtures that pass the contracts schemas (`safeParse` in the test).

## Rules (decided)

1. **Story id.** For API stories `Story.id` is the item's `shortId`, not its UUID. The site's article URL is `<slug>-<id>`, and the API's public address is `<slug>-<shortId>`, so existing URL code works unchanged.
2. **Category.** `siteCategory` returns the `CategoryId` when the ref's `key` is one of the five site categories (`categoryIds`), otherwise `null`. A story with no site category is dropped by `storyFromListItem` and `storyFromNews` (they return `null`), and the adapter does not throw.
3. **Regions.** `siteRegions` keeps only keys that are in `regionIds`, in the order given. Items with no site region get `[]`.
4. **Image.** `imageFromMedia` returns `undefined` for `null`. Otherwise `src` is `media.urls.card` (the same-origin rewrite is T6, not this task), `alt` is `media.alt ?? ""`, `width` and `height` are `media.width` and `media.height`, falling back to `800` and `600` when null.
5. **Title and summary.** `title` is the item's title. `summary` is `dek` (omitted when null).
6. **Dates.** `publishedAt` is the item's `publishedAt` unchanged (ISO string).
7. **Author.** `storyFromNews` sets `author` from the first contributor whose role is `author`, as `{ name: displayName, slug: id }` (the contributor's id). `storyFromListItem` leaves `author` unset; the list does not carry contributors.
8. **Reading time.** This plan step originally left it unset; reading time was subsequently built in steps 1 to 5 (doc 24, ADR-031).
9. **Rank.** Left unset. Most-read adds it later.

## Do NOT touch

Pages, components, `src/content/**`, the API client (`src/lib/api/client.ts`), Playwright tests, anything in `apps/api` or `packages/**`.

## Acceptance

1. Each function is pure: no `fetch`, no `process.env`.
2. A list item with a non-site category returns `null` from `storyFromListItem`, and a test checks it.
3. `storyFromNews` gives the same `Story.id` as the list item for the same news item.
4. `imageFromMedia(null)` is `undefined`; the fallback size is used when width or height is null (tested).
5. Tests cover: site category mapping, region filtering and order, author selection, and the image fallbacks.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
```

Report the output of all three. Do not start dev servers, do not run `./run.sh`, do not commit.
