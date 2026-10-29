# Brief: Topic page

Branch `page/topic` (from `dev` after PR #19) · Issue IMP-18 (the `/topic/<slug>` part) · Drafted 30 October 2026

## Goal and URL

The topic page `/topic/<slug>` and `/en/topic/<slug>` (layout 7C.2 Paths, Topic row: flat, one Latin slug, a bn and an en label, never the word "tag", DR-410). One list of the news and analysis stories of one topic, newest first, no opinion. It replaces today's 404 page, so the C-34 Topics links on the article page open a page. The page follows the Latest page (layout 7D). The NavBar and the Drawer do not change.

## Page order

| Row | Component | Notes |
| --- | --- | --- |
| Site header | C-17 TopBar, C-18 NavBar | As on the Latest page. No current item |
| `ad-top` | AdSlot | As on the homepage (layout 9). No `ad-band` on the page |
| Page title | C-43 PageTitle | The topic label, the page `h1`, in the `surface` band, as on the Latest page. No label above it (tajmin, 30 Oct 2026) |
| Topic list | Reuse: `MoreStoriesSection`, `MoreStoriesList` in `Shell`, `WithRail` (the rail stays empty) | StoryCard `dated` rows (C-24), `h2` titles, Divider.item between them, 10 first and load more by 10, as on Latest. Eyebrow: a news row shows the C-08 `category` Eyebrow; an analysis row shows the C-08 `format` Eyebrow |
| Footer | C-21 Footer | As on the homepage |

## Content and mock data

- No new topics and no new stories (tajmin, 30 Oct 2026). The 7 topics of `src/content/topics.ts` stay as they are.
- Link existing stories to those topics: an optional `topics` field (topic keys) on the story data. Opinion stories may keep topics (the article page shows them) but the page leaves them out.
- Each test case on purpose (news and analysis stories counted). A story can carry more than one topic, so the links stay few:

  | Topic | Stories | Tests |
  | --- | --- | --- |
  | `regional-cooperation` | about 14 | 10 first, load more adds the rest, the Button goes |
  | `rivers` | exactly 10 | No Button |
  | `archives`, `river-trade`, `foreign-reserves` | 3 each | Sparse: a short list, no Button |
  | `monsoon`, `flood-forecasting` | 3 each | No own test: their 3 stories are among those of `rivers` and `regional-cooperation` |
- New `getTopicPage(lang, slug)` in `src/content/index.ts`: the topic label and its news and analysis stories, newest first, no duplicates. An unknown slug gives `undefined`.
- Strings: none new. The button reuses `categoryPage.loadMore`.

## Reuse and what is new

- New: the route `src/app/[lang]/topic/[slug]/page.tsx`, static for every topic in `bn` and `en` (`generateStaticParams`); an unknown slug and a bare `/topic` give the 404 page. New `TopicPageView`.
- New: a third Eyebrow choice in `MoreStoriesList` and `MoreStoriesSection`: category on news, format on analysis. Today the list has only off (category page) and category on every row (Latest).
- Sparse (layout 7.3, 7D.3): with no news or analysis the list is not shown; with 10 or fewer stories there is no Button.

## Rules that apply

Layout 7C.1, 7C.2 (Topic row), 7D (as the pattern), 7.3, 9, 13; C-08, C-12, C-22, C-24, C-34, C-43; `LAY-05`, `LAY-07`, `LAY-09`, `LAY-14`, `LAY-17`, `COL-13`, `TYP-03`, `TYP-08`, `TYP-14`, `N-05`, `T-27`. Decisions: DR-153 (the Eyebrow shows: the page mixes categories), DR-370, DR-410, DR-414.

## Checkpoints

1. Content: topic links on existing stories (about 14 and 10 in the load more topics, 3 in each other topic), `getTopicPage` and its unit tests.
2. Route and shell: `/topic/<slug>` and `/en/topic/<slug>` with the header, `ad-top`, PageTitle, and the footer; unknown slugs give a 404.
3. The list: dated StoryCard rows, category Eyebrow on news, format Eyebrow on analysis, no opinion.
4. Final: e2e, visual check at the test widths, `/checkpoint`.

## Test files

- `src/content/content.test.ts` (changed): every topic has 3 or more news or analysis stories, the counts of the test topics, every story topic key exists, `getTopicPage`.
- `tests/e2e/topic.spec.ts` (new): both languages, the `h1`, order and no opinion, the Eyebrow per format, load more on `regional-cooperation` (10 then the rest, focus on the first added story, the Button goes), no Button on `rivers`, the sparse case on `archives`, `river-trade` and `foreign-reserves`, 404 for an unknown slug and a bare `/topic`, keyboard, axe, no sideways scroll at the test widths.
- `tests/e2e/article.spec.ts` (run, not changed): the C-34 Topics links now open a page.
- `tests/e2e/latest.spec.ts`, `tests/e2e/category.spec.ts` (run, not changed): the shared list keeps its two Eyebrow modes.
