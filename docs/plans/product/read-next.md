# Read next (product backlog item 3)

Status: built and committed (RN1 to RN5, pushed). The English manual check passed on 18 November 2026; the Bangla article check passed on 18 November 2026. Approved rules: ADR-039; doc 23. Reads: `docs/23-read-next.md` (sections 3 to 5), `docs/24-reading-time.md` (the reading time it shows), `docs/25-most-read-and-performance.md` (the public read cache), `apps/web/src/content/reader.ts` (`ReadNextItem`, `getReadNext`).

## Goal

Every article shows three related news items at its foot, chosen by editors first, then by what the articles share, then by the newest items. The site hides the section when there is nothing to show.

## Steps

### RN1: the picks table (Claude, critical: migration)

- Create `apps/api/migrations/1761000000030_news-related.sql` with Up and Down sections:
  - `news_related(news_id uuid NOT NULL REFERENCES news(id) ON DELETE CASCADE, related_news_id uuid NOT NULL REFERENCES news(id) ON DELETE CASCADE, position smallint NOT NULL CHECK (position BETWEEN 1 AND 3), PRIMARY KEY (news_id, related_news_id), UNIQUE (news_id, position), CHECK (news_id <> related_news_id))`.
  - Down: `DROP TABLE news_related`.
- Verified on a scratch database (Up, then Down), and the API suite passes.

### RN2: writing the picks (Claude, critical: authorisation and audit)

- `PUT /news/:id/related` with `news.edit`. Body: up to 3 items `{ newsId, position }`, positions 1 to 3, no duplicates, no self-reference. The whole list is replaced in one transaction, with an audit event listing what was added and removed.
- A pick must be a live news item (not archived, not a draft) in some language; a pick with no live version is refused.
- Tests: replace, clear (empty list), duplicate refused, self refused, audit row written.

### RN3: the public read (Claude)

- `GET /public/news/:locale/:ref/related?limit=3` (public, cached `public, max-age=60, stale-while-revalidate=300`). `:ref` is the article's address (`<slug>-<shortId>`); the id decides the article.
- Selection, in this order, stopping at 3:
  1. The editor's picks, in their order (skipping any no longer live or without a version in the locale).
  2. Related items by score: each shared tag 3, each shared region 2, each shared category 1, plus a recency boost that fades over time; ties go to the newest.
  3. Fallback: the newest live news in the same primary category, then the newest live news of the site.
- Always excluded: the article itself; anything not live; anything without a version in the requested locale; anything already chosen. At most one opinion piece, and only one that shares a tag with the article. At most two from the same author.
- Each item carries the public list fields, `image` (the lead image, as the lists do) and `readingMinutes`.
- Tests: each rule, the exclusions, the fallback, the opinion rule, the author rule, a Bangla article never shows an English-only item.

### RN4: the newsroom field (Codex)

- On the news item page, a "Related news" panel: up to three picks, each with a search field over the newsroom's list of items, an order control, and a remove button. Saves through `PUT /news/:id/related`. Forms use `onSubmit` (`src/lib/form.ts`); a failed save keeps what was typed; colours from CSS variables.
- Tests for the pure helpers (the ordering and the three-item limit).

### RN5: the site section (Codex)

- The article page shows the section under the tags and the ad band, as doc 23 section 1 describes: three cards in a row from 1024 px, two from 600 px, one below. Hidden when there are no items.
- In API mode the page fetches the related items from RN3. The mock `getReadNext` is not used in API mode, so no mock article is ever shown.
- Tests: the section appears with items, is hidden without them, and the cards show the image, title, category and reading time from the API.

## Task specs

- [RN4: newsroom panel](./read-next/RN4-newsroom-panel.md) (Codex)
- [RN5: site section](./read-next/RN5-site-section.md) (Codex)

## Order

RN1, then RN2 and RN3 (RN3 needs the table and can be written against an empty table), then RN4 and RN5 in parallel.

## Verification

- RN1 to RN3: the API suite and typecheck, lint for `@fact-lens/api` and `@fact-lens/contracts`.
- RN4 and RN5: the web and newsroom typecheck, lint, test and build.
- After RN5: the browser suite in mock mode (the section is hidden there), and a manual check against a running API.
