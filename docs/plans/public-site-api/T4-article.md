# T4: the article page from the API

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Needs T1 to T3 and the lead image change (`9aa7ae1`). Reads: `apps/web/AGENTS.md`, `docs/24-reading-time.md` (section 3, approved in ADR-039), `apps/web/src/content/reader.ts` (`Article`, `ReaderAuthor`), `apps/web/src/content/reader-articles.ts` (`Block`, `ArticleText`), `apps/web/src/content/types.ts` (`Topic`, `ImageRef`, `ImageFile`), `apps/web/src/proxy.ts`, `apps/web/src/app/[lang]/story/[slug]/page.tsx`, `packages/contracts/src/news.ts` (`publicNewsSchema`), `packages/contracts/src/body.ts`.

## Goal

With `FACTLENS_API_URL` set, the article page shows a published news item from `GET /public/news/:lang/:ref`. Without it, the page keeps the mock article exactly as now.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/lib/api/article.ts`:
  - `blocksFromBody(body: PublicNews["body"], media: PublicNews["media"], lang: Lang): { blocks: Block[]; dropped: string[] }`. Pure.
  - `readingMinutesFrom(body, lang): number`. Pure, per doc 24 section 3.
  - `articleFromNews(item: PublicNews, lang: Lang): Article | null`. Returns `null` when no lead image and no body image exist (see the decision below).
  - `articleFromApi(ref: string, lang: Lang): Promise<{ article: Article } | { redirectTo: string }>` calls `GET /public/news/<lang>/<ref>` through `apiGet`. It does not let fetch follow a redirect: it reads the 301 or 308 `Location` and returns `{ redirectTo }`. Errors propagate (`ApiNotFound`, `ApiUnavailable`).
- Create `apps/web/src/lib/api/article.test.ts` with fixtures that pass `publicNewsSchema`.
- Edit `apps/web/src/app/[lang]/story/[slug]/page.tsx` (and its `generateStaticParams`, `generateMetadata`):
  - In API mode, `dynamicParams` is `true` (any address is allowed); in mock mode it stays `false`.
  - In API mode the page calls `articleFromApi`. A `redirectTo` becomes a Next `redirect()` to `/story/<redirectTo>` in the same language. `ApiNotFound` becomes `notFound()`.
  - In API mode `getReadNext` is not called, and the Read next section is omitted. Its mock items are never shown in API mode (Read next is a later step).
- Edit `apps/web/src/proxy.ts`: in API mode it does not redirect article addresses (the page decides, from the API). Mock mode is unchanged.

## Field mapping (decided)

- `story` = `storyFromNews(item, lang)` (T2), with `image` from `leadImage` (or the first body image when there is no lead image, see the decision below).
- `summary` = `dek ?? ""`.
- `updatedAt` = `updatedAt`.
- `author` = the first contributor with role `author`: `{ name: displayName, role, bio: bio ?? "", initials }`. `initials` is the first letter of up to two words of the name, in capitals. `authorRole` = that contributor's role label; `authorBio` = `bio ?? ""`.
- `topics` = the item's tags, each `{ id: slug, slug, label: name }`.
- `updates` = corrections, each `{ at: approvedAt, text: notice }`.
- `caption` = the lead image's `alt ?? ""`. `credit` = its `attribution ?? license ?? ""`. Both empty when there is no lead image.
- `readingMinutes` = `readingMinutesFrom(body, lang)`.
- `context`, `keyPoints`, `dateline` are omitted: the API has no source for them yet.

## Body mapping (decided)

Walk `doc.content` in order:
- `paragraph` becomes `{ type: "p", text }`, the text of its text nodes joined. Marks (bold, italic, links) are dropped. Empty paragraphs are skipped.
- `heading` becomes `{ type: "h2", id, text }`. `id` is a slug of the text, made unique in the article. The level is ignored.
- `bulletList` and `orderedList` become `{ type: "list", items }`, one string per `listItem`.
- `blockquote` becomes `{ type: "p", text }` with its text flattened.
- `horizontalRule` is dropped.
- `image` becomes `{ type: "figure", image, caption, credit, alt }` from the media item with that id: `image` is `{ src: urls.card, width, height }`, `caption` is its `alt ?? ""`, `credit` is its `attribution ?? ""`, `alt` is its `alt`. An image id that is not in `media` (rights lapsed) is dropped.
- Any other node is dropped and its type is added to `dropped`. The page logs `dropped` once per request in development. Nothing is dropped silently.

## Reading time (decided, doc 24)

- Words are counted with `Intl.Segmenter(lang, { granularity: "word" })`, counting only segments where `isWordLike`. Headings, paragraphs, list items and quotes count. Captions and credits do not.
- Words per minute: `en` 230, `bn-BD` 170, taken from the constants in the file. A language with no rate uses the English one. These are constants for now, because the runtime configuration row is not read yet.
- Result: `Math.max(1, Math.round(words / rate))`.

## Decision: an article with no lead image

Rule: a body image stands in as the lead image. If there is neither a lead image nor a body image, `articleFromNews` returns `null` and the page answers 404, with a log line. The newsroom should require a lead image before publishing; that rule is not in the API yet and is out of scope here.

## Do NOT touch

`apps/api/**`, `packages/**`, the components, `src/content/**` (the mock stays as it is), the homepage, category, analysis and topic pages, Playwright tests, design-system files.

## Acceptance

1. Mock mode (`FACTLENS_API_URL` unset): the article page renders exactly as before, and the existing tests pass unchanged.
2. API mode, with the fetch injected in tests: a published item renders its title, summary, body blocks, author, topics, corrections as updates, lead image caption and credit, and the reading time.
3. An old slug answers `redirectTo` and the page issues a redirect; an unknown item answers 404.
4. In API mode, no mock article or Read next item is ever shown.
5. The body mapping tests cover: paragraphs with marks dropped, headings with unique ids, both list types, a blockquote, a horizontal rule dropped, an image with a known and an unknown media id, and an unknown node type reported in `dropped`.
6. Reading time tests cover the English and Bangla rates, the minimum of one minute, and that captions are not counted.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output of all four. Do not start dev servers, do not run `./run.sh`, do not commit.
