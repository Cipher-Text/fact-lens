# 23 — Read next (the related news under an article)

**Status: APPROVED on 17 November 2026 (decisions in [19](./19-open-questions.md), questions 22 to 28). Built (RN1 to RN5; [ADR-043](./17-architecture-decisions.md)). A manual check in English passed on 18 November 2026; the Bangla article check passed on 18 November 2026.** ADR-030 recorded the initial decision to specify this feature; the implementation and its final rules are recorded by ADR-043. The rules below describe the built behavior.

## 1. What it is

After an article, the public site shows a row called **Read next**: other news a reader may want after this one. This is what the site's own design fixes (`apps/web`, `spacing-layout-system.md` 7A):

- It is the last block of the article page, after the tags and the ad band, and before the footer.
- A heading, then story cards (the same `StoryCard` as on the other pages): a 16:9 image, an eyebrow (the section, or Analysis / Opinion for those formats), the title, the summary and the time.
- **3 cards in a row** from 1024 px, 2 from 600 px, 1 on a phone. It is hidden when there are none. It is not printed.
- Today the site's mockup hard-codes 3 slugs (a news story, an analysis and an opinion piece). The design says nothing about how the stories are chosen. That is what this document proposes.

## 2. What the backend has today

The picks table, endpoints, newsroom panel, and public site section are built (RN1 to RN5). The public list (`GET /public/news/:locale`) can filter by section, region, tag and format. Its items carry the lead image ([25](./25-most-read-and-performance.md)). Topics remain unbuilt; tags are used as the related subject signal ([gap list](./22-implementation-status.md)).

## 3. Selection rules

The row is 3 stories. Fill it in this order and stop when it has 3:

1. **Editor's picks.** Up to 3 news items an editor pinned on this article. Always first, in the editor's order.
2. **Related by what they share,** best first. Score every other live news item (score by overlap with this one):

   | Shared with this article | Weight |
   | --- | --- |
   | each topic or tag | 3 |
   | each region | 2 |
   | each menu section | 1 |

   plus a recency boost that fades over time (a story from last week beats an equal one from last year). Ties go to the newest.
3. **Fallback.** If fewer than 3 are found, the newest news in the same primary section. Then the newest news of the site, so the row is not empty when the site has at least 4 live news items.

Always excluded, at every step:

- the article itself;
- anything not live (draft, unpublished, archived);
- anything with no version in **the page's language** (a Bangla page never shows an English-only story; languages are never mixed, [ADR-020](./17-architecture-decisions.md));
- anything already in the pinned list (no repeats).

Mix and variety:

- News and analysis are allowed. **At most one opinion piece**, and only one that shares a tag with this article.
- No more than 2 from the same author, so the row does not look like a byline page.

## 4. API (built)

`GET /public/news/:locale/:ref/related?limit=3` — public, read only, cached.

- `:ref` is the article's address (`<slug>-<id>`, [ADR-027](./17-architecture-decisions.md)); the id decides which article.
- The answer is a list of the same items as the public list (`id`, `shortId`, `format`, `slug`, `title`, `dek`, `publishedAt`, `category`), **plus the lead image** (`image`: width, height, alt, and the derivative URLs) and the reading time ([24](./24-reading-time.md)). The image on the list items is a prerequisite and is needed by the hub pages too; the public lists now return it ([25](./25-most-read-and-performance.md)).
- A pinned item whose language version is missing, or that is no longer live, is skipped, not shown broken.
- Cache: `public, max-age=60, stale-while-revalidate=300`, like the other public reads.

## 5. Editor control (built)

- A **Related news** field on the news item's details in the newsroom: choose up to 3 other news items, order them, remove them. Stored per news item (`news_related(news_id, related_news_id, position)`, unique per pair, the item cannot relate to itself), like tags: it belongs to the news item, not to a revision.
- Setting it needs `news.edit`, and writes an audit event with what was added and removed.
- Nothing is required: with no picks the row is filled by rule 2 and 3.

## 6. Scale

- **First:** one query over the link tables (`news_tag`, `news_region`, `news_category`), which carry `news_id` in their indexes ([ADR-028](./17-architecture-decisions.md)). Fine while the library is modest. Cached per article.
- **Later (measured):** the worker computes the related list for an article when it is published or changed (it already reads the outbox), and stores it; or a search index's "more like this" provides the candidates ([09](./09-search-and-discovery.md)). Either replaces the query without changing the API.
- Per-reader personalisation, "most read" and ads are **not** part of this feature.

## 7. Decision and build order

**Decision:** ADR-030 specified the feature before implementation; ADR-043 records the built Read next behavior and selection rules.

Build order:

1. Decide topics: tags, or a separate table (question 23).
2. The lead image on the public list items (done, [25](./25-most-read-and-performance.md)), and the reading time ([24](./24-reading-time.md), which can be built on its own first).
3. Multilingual authors (needed for "no more than 2 from the same author" and for the cards).
4. The related endpoint (rules 2 and 3), tested with fixtures.
5. Editor's picks: the table, the endpoint rule 1 and the newsroom field.
6. The site calls the endpoint instead of its hard-coded slugs.

Tests to write with it: the page's language only; no repeats and not itself; pinned first and in order; a pinned item that is not live is skipped; at most one opinion piece; the fallback fills the row; scores order the rest; the empty case returns `[]`.

## 8. Open questions (need an answer before step 4)

These are numbers 22 to 24 in [19](./19-open-questions.md):

- **22.** Are the rules and weights in section 3 acceptable as the first version, to be tuned on real content?
- **23.** Are topics tags, or their own table? The strongest signal depends on it.
- **24.** May opinion appear in Read next at all? The mockup shows one; the site's spec keeps opinion out of the news lists.
