# Latest page spec log

Branch `page/latest` · Brief `docs/briefs/latest.md` · Progress `docs/progress/latest.md` · Issue IMP-18 (the `/latest` part) · Started 28 October 2026

This log keeps what the work changes in the specs. Open code items are rows in `docs/ISSUES.md`.

## Kinds

| Kind | Use when |
| --- | --- |
| Reuse | An existing rule, token or component is used in a new place. Name it |
| New token | A tweak has no token step. Give the name, the value and the scale it joins (`CPT-07`) |
| New component | A part that no sheet in `component-system.md` §7 covers. Give the name per `N-01` to `N-05` |
| New rule | A behavior that no rule covers |
| Changed rule | The page needs an existing rule to change. Always a flag |

## Items

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| LT-01 | New rule | The Latest page order and content. 7C.2 Paths has only the News hub row (`/latest`, news only); no section defines the page, so this is a new layout section (7D). Order: site header (no current nav item), `ad-top`, C-43 PageTitle সর্বশেষ / Latest (the h1, `surface` band, `space-module` below), one list in the wrapper column of `Shell`, `WithRail` with the rail empty, footer. No `ad-band`. Content: every news story of every category, newest first; no analysis or opinion; no region-only news. 10 stories first, then 10 per load more press, as 7B.2 Load more. Sparse: with no news the list is not shown (7.3) | `src/app/[lang]/latest/page.tsx:27`; `src/components/latest/LatestPageView.tsx:37`, `:46`; `src/content/index.ts:267` | layout 7C.2 Paths (News hub row), 7B.2, 7.3, C-43, `LAY-07`, `LAY-09`, `LAY-14`, DR-370 | brief answers and "cut it down to 10" (tajmin, 28 Oct 2026) || green: page order and content match the diff; 7C.2 Paths cited correctly (design reviewer, re-check) |
| LT-05 | New component | `LatestPageView`: the Latest page template (`src/components/latest/`), named as `CategoryPageView` (`N-05`). Proposed for `component-system.md` Section 3: page Latest, component `LatestPageView`, label সর্বশেষ / Latest, the list is the reused More stories list (LT-02) | `src/components/latest/LatestPageView.tsx:19` | `N-01` to `N-05`, C-43 | build (28 Oct 2026) || green: named as `CategoryPageView` (N-05); add to component-system Section 3 (design reviewer, re-check) |
| LT-02 | Reuse | The list is `MoreStoriesSection` and `MoreStoriesList` (`src/components/more-stories/`; were `CategoryMoreStoriesSection` and `CategoryMoreStoriesList` in `src/components/category/`) (StoryCard C-24 `dated`, Divider.item, Divider.rule, C-12 Button). New options: `labelledBy` (the page h1 names the section, so no SectionHeading; the titles are h2), `eyebrow` (the C-08 `category` Eyebrow on every row). The category page keeps its output | `src/components/more-stories/MoreStoriesSection.tsx:25`, `:85`, `:91`, `:102`; `src/components/more-stories/MoreStoriesList.tsx:26`; `src/components/layout/PageTitle.tsx:37` | C-24, C-08, C-12, C-22, C-43, `N-05`, DR-153 (the page mixes categories, so the Eyebrow shows) | brief answers (tajmin, 28 Oct 2026: "use the cards used in more stories section in category", "show eyebrow.") ; rename: tajmin, chat, 28 Oct 2026: "Rename it." || red: the `Category` names on a non-category page and the Section 3 row text (N-05); flag for tajmin. Decided: renamed to `MoreStoriesSection`, `MoreStoriesList`, moved to `src/components/more-stories/`; Section 3 and 7B.1, 7D rows updated |
| LT-03 | New rule | Load more motion, on Latest and on the category More stories: each row a press adds fades in (opacity 0 to 1, `--duration-slide`, `ease-slide`, no fill mode, no stagger); nothing moves. The story image of an added row stays transparent over the `surface-alt` slot fill until it has loaded, then fades in (opacity, `--duration-slide`, `ease-slide`); lazy loading stays. The first rows and every other StoryCard do not animate (StoryCard `imageFadeIn`, StoryImage `fadeIn`, off by default). Reduced motion: none (DR-227 base rule). No new token | `src/styles/components.css:379`, `:385`, `:392`; `src/components/more-stories/MoreStoriesList.tsx:40`, `:41`, `:52`; `src/components/story/StoryCard.tsx:47`, `:117`; `src/components/story/StoryImage.tsx:43`, `:53`, `:64`, `:78` | DR-346, DR-284, DR-227, DR-325, DR-338, C-24 | tajmin, chat, 28 Oct 2026: "lets go with fade + image fade." Options weighed in the progress file, "Proposed" || green: opacity only, one duration, reduced motion covered; the image fade is the same fade (DR-346, DR-284, DR-227); new rule chosen by tajmin |
| LT-04 | New rule | Story time after load more: the inline script keeps its run function on `window` (`flStoryTime`); a list that adds stories in the browser calls `refreshStoryTimes()` before paint, so the added rows show the reader text (relative for 24 hours, the reader's time zone) at once, not the Dhaka server text until the next run. The script stays under 1.5 KB | `src/lib/story-time.ts:58`, `:91`; `src/components/more-stories/MoreStoriesSection.tsx:62` | `TYP-17`, DR-274, DR-348 | tajmin, chat, 28 Oct 2026: "got it. lets fix it." || green: covered by TYP-17, DR-274, DR-348; the script stays under 1.5 KB |

## Flags

- LT-02 (red, design reviewer): the More stories section and list kept the `Category` prefix on `/latest`. Decided (tajmin, 28 Oct 2026: "Rename it."): `MoreStoriesSection`, `MoreStoriesList` in `src/components/more-stories/`; the Section 3 row names both pages, and "never opinion" is the category page rule (DR-415).
