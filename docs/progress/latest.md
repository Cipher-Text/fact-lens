# latest progress

Branch `page/latest` · Brief `docs/briefs/latest.md` · Issue IMP-18 (the `/latest` part) · Started 28 October 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: Final checkpoint done, waiting for tajmin's commit yes
- Next step: push `page/latest` and open the PR to `dev` when tajmin asks
- Open questions to tajmin: none (U-51 decided: rename)
- Uncommitted: no; the U-51 rename committed after e840f9c (not pushed)

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 28 Oct 2026 | STATUS on `dev` notes the dev-process merge (PR #17), commit `1c5bf4b` on local `dev`. Full Chromium e2e on `dev` skipped; it runs after `latest` merges | tajmin, chat: "no need run e2e test. once latest merged, full e2e will be conducted." |
| 28 Oct 2026 | `dev` pushed with the STATUS commit | tajmin, chat: "push to dev." |
| 28 Oct 2026 | Layout: PageTitle, then one dated list in the wrapper column; 20 stories first, then 10 per load | tajmin, chat: "(a) is ok. but display 20 stories first. then 10 stories per load." |
| 28 Oct 2026 | Rows: the More stories cards of the category page (StoryCard `dated`, 3 columns, the date column at a fixed width), reused. No day headings | tajmin, chat: "use the cards used in more stories section in category. 3-column setup with datetiem having fixed width. reuse it" |
| 28 Oct 2026 | Each row shows the category Eyebrow | tajmin, chat: "show eyebrow." |
| 28 Oct 2026 | `ad-top` only; the rail stays empty | tajmin, chat: "Ad-top. keep empty rail." |
| 28 Oct 2026 | Navigation stays as it is: no Latest nav item | tajmin, chat: "keep as it is." |
| 28 Oct 2026 | Content: news from all categories, newest first; no region-only news | tajmin, chat: "no region only news. all categories, latest top." |
| 28 Oct 2026 | Brief approved | tajmin, chat: "Yes, build" |
| 28 Oct 2026 | IMP-120 (homepage Latest rail not news only) stays out of this page | tajmin, chat: "yes. will change homepage later." |
| 28 Oct 2026 | Fix: rows added by load more get the reader story time at once (relative for 24 hours, the reader's time zone) | tajmin, chat: "got it. lets fix it." |
| 28 Oct 2026 | Load more motion: "fade + image fade": the added rows fade in (opacity only), and their story images fade in when they have loaded; no rise. Replaces option (a). Approved as the choice; the new motion rule goes to the spec log at `/checkpoint` | tajmin, chat: "lets go with fade + image fade." |
| 28 Oct 2026 | Latest shows 10 stories first, then 10 per load (was 20 first) | tajmin, chat: "I asked for 20 items first. cut it down to 10" |

## Proposed

Not approved. tajmin decides after a visual check of the built fade (tajmin, 28 Oct 2026: "keep this a,b, and c in a proposed section in progress.md and build the first animation plan. will decide after visual inspection first"). The purpose is a smooth experience for readers, not to hide faults (tajmin, 28 Oct 2026). Motion on list rows has no rule: whichever is chosen is a new rule in the spec log.

| Option | What | Notes |
| --- | --- | --- |
| First plan (built, replaced by (a), then chosen again with the image fade) | Each row a press adds fades in (opacity 0 to 1) over `--duration-slide` (450ms) with `ease-slide`; no stagger; the first rows never animate | Opacity only, as the phone region tab panels (DR-284). Reduced motion: no animation (globals.css base rule) |
| (a), built for the visual check, then replaced | The added rows fade in **and rise 1rem**, the `dialog-panel` motion from 600; `--duration-slide`, `ease-slide`; no stagger | Transform only: no layout shift. The rise gives the list a direction (it goes on downward) |
| (b) | (a), plus the story image fades in when it has loaded, on the added rows only | Hides the lazy image pop (the surface color, then the image snaps in). Agent's pick: smooth where the reader looks, the homepage stays untouched |
| (c) | (a), plus the image fade in `StoryImage` on every page | Touches the locked homepage (DR-370): needs tajmin's explicit exception |

| Fade + image fade (chosen, tajmin 28 Oct 2026) | The first-plan row fade, plus the story image of each added row fades in when it has loaded; nothing moves | Lazy loading kept. StoryImage and StoryCard get a prop, off by default |

Costs for every option: the focus ring on the first added title fades in with its row (under half a second). Tests wait for `document.getAnimations()` to end before axe, so the IMP-119 flake cannot come back.

## Log

### Checkpoint 1: Content (28 Oct 2026)

- Built: the Latest page content, news of every category, newest first.
- Code: `src/content/types.ts` (`LatestPage`, new): `lang`, `stories`.
- Code: `src/content/index.ts` (`getLatestPage`, new): every `format: "news"` story of `stories` (homepage, category and older category files), `toStory`, sorted by `newestFirst`. 92 news stories today.
- New tokens, components, strings, mock data: none.
- Tests: `src/content/content.test.ts` "latest page": news only, every news story once, newest first, every category present, more than 40 stories, same ids and order in bn and en. `vitest run src/content`: 86 passed; `pnpm typecheck` passed.
- Rules used: layout 7C.2 (news only).
- Tweaks from tajmin: none yet.
- Gaps and flags: none.

### Checkpoint 2: Route and page shell (28 Oct 2026)

- Built: `/latest` and `/en/latest` with the header, `ad-top`, PageTitle and footer; the `/latest` 404 is gone. `main` holds only the title band until checkpoint 3.
- Code: `src/app/[lang]/latest/page.tsx` (`LatestRoute`, `generateMetadata`, new): static for bn and en (the `[lang]` layout gives the params); title and hreflang alternates for `/latest` and `/en/latest`.
- Code: `src/components/latest/LatestPageView.tsx` (`LatestPageView`, new folder `src/components/latest/`): `SkipLink`, `SiteHeader` (path `/latest`, no current nav item), `AdSlot` top, `main` (`pb-(--space-section)`) with `PageTitle` (`mb-(--space-module)`), `Footer`. No ad band.
- Strings: the title reuses `hero.latest` (সর্বশেষ / Latest); no new keys (brief).
- New tokens or components: none (C-43, C-16, C-17, C-18, C-21 reused).
- Checked in the browser: bn and en render, `<html lang>`, document title "সর্বশেষ · ফ্যাক্ট লেন্স" / "Latest · Fact Lens", hreflang bn and en, the language switch to `/latest?lang=bn`, no console errors. `pnpm typecheck` passed.
- Tweaks from tajmin: none yet.
- Gaps and flags: none.

### Checkpoint 3: The list (28 Oct 2026)

- Built: the Latest list: the category page More stories section reused, 20 first, then 10 per press, the category Eyebrow on every row, titles as h2 under the page h1, focus to the first added title link.
- Code: `src/components/category/CategoryMoreStoriesSection.tsx` (`CategoryMoreStoriesSection`): new props `first` (default 10), `labelledBy` (a heading outside the section names it: no SectionHeading, `aria-labelledby` to it, `data-section="latest"`), `eyebrow`. The titles are h2 with `labelledBy`, else h3. The focus after load more now goes to `:is(h2, h3) > a` (was the first link not at tabindex -1, which is the Eyebrow link when it shows). The category page output is unchanged (10 then 10, h2 heading, h3 titles; checked in the browser on `/category/economy`).
- Code: `src/components/category/CategoryCards.tsx` (`CategoryMoreStoriesList`): new props `eyebrow` (default false) and `titleAs` (`h2` or `h3`, default `h3`).
- Code: `src/components/story/StoryCard.tsx` (`StoryCardProps.titleAs`): `h2` added to `h3 | h4`.
- Code: `src/components/layout/PageTitle.tsx` (`PageTitle`): new `id` prop on the h1.
- Code: `src/components/latest/LatestPageView.tsx`: `PageTitle` id `latest-title`; `CategoryMoreStoriesSection` with `first={LATEST_FIRST}` (20), `labelledBy="latest-title"`, `eyebrow`; not shown with no news (7.3).
- New tokens, components, strings, mock data: none. Reuse: C-24 `dated`, C-08 `category` mode, C-12, C-22, C-43.
- Checked in the browser: 20 rows, each with the Eyebrow; each press adds 10, focus on the h2 title link of the 21st story; 92 after 8 presses and the Button and Divider.rule go. No sideways scroll at 360, 768 and 1024. bn and en. No console errors. `pnpm test`: 320 passed; typecheck and lint pass.
- Rules used: `COL-13` (focus after load more), `LAY-07`, `LAY-14`, `TYP-03`, `N-05`. DR-153: the Eyebrow shows here because the page mixes categories (tajmin, 28 Oct 2026).
- Spec items for `/checkpoint`: Reuse of C-24 `dated` with the C-08 `category` Eyebrow (the More stories rows of 7B, with the Eyebrow) on a new page; the Latest page order (header, `ad-top`, PageTitle, list, footer; 20 then 10). C-43 gains an `id` for the h1.
- Tweaks from tajmin: none yet.
- Gaps and flags: none.

### Checkpoint 4: Tests (28 Oct 2026)

- Tests: `tests/e2e/latest.spec.ts` (new): bn and en; page order (title band, list; `ad-top`, no `ad-band`); one h1, the list named by it, 20 rows with h2 titles; one category Eyebrow per row, newest first, more than one category; layout at the 13 widths of layout 13 (no sideways scroll, no radius, C-24 dated columns from 600, the body column at one x on every row); load more 20 → 30 with focus on the 21st `h2 a`, then by 10 until the Button and Divider.rule go; focus ring on every link and button; axe light and dark at 360 and 1280; the homepage hero link to `/latest` and `/en/latest` returns 200.
- Tests: `tests/e2e/text-size.spec.ts` (changed): `/latest` and `/en/latest` added to "nothing scrolls sideways" at 200% text.
- Runs (Chromium): `latest.spec.ts`, `hero.spec.ts`, `text-size.spec.ts`: 114 passed. `category.spec.ts`, `story-units.spec.ts` (shared parts changed): 105 passed. Full Chromium e2e not run: tajmin runs it on `dev` after `latest` merges.
- Tweaks from tajmin: none.
- Gaps and flags: none.

### Tweak: story time after load more (28 Oct 2026)

- Found: rows added by load more kept the server text (Dhaka date and time, no relative form) until the inline script's next run (5 minutes or tab focus). Same on the category page More stories.
- Code: `src/lib/story-time.ts`: `storyTimeScript` keeps its run function on `window.flStoryTime` (`RUN_NAME`); new `refreshStoryTimes()` calls it. Script still under 1.5 KB (DR-348; `page.spec.ts` passes).
- Code: `src/components/category/CategoryMoreStoriesSection.tsx`: a `useLayoutEffect` on `count` calls `refreshStoryTimes()` after a press, before paint, so the server text never shows.
- Tests: `src/lib/story-time.test.ts`: the script sets `window.flStoryTime`. `tests/e2e/latest.spec.ts` "rows added by load more show the reader time at once (TYP-17)": the clock paused 3 hours after the 21st story; after one press the row reads ৩ ঘণ্টা আগে / 3 hours ago. It fails without the fix (shows "6 Oct, 14:30"). Chromium: `latest.spec.ts`, `category.spec.ts`, `page.spec.ts` 123 passed.
- Rules used: `TYP-17`, DR-274, DR-348.

### Tweak: load more fade (first plan, for visual check) (28 Oct 2026)

- tajmin: "build the first animation plan. will decide after visual inspection first"; "the old plan that you revised." Not approved yet: see "Proposed".
- Code: `src/styles/components.css`: `@keyframes story-added` (from opacity 0) and `@utility story-added` (`animation: story-added var(--duration-slide) var(--ease-slide) both`). No new token.
- Code: `src/components/category/CategoryCards.tsx` (`CategoryMoreStoriesList`): new prop `addedFrom`; rows from that index get `story-added` and `data-added`.
- Code: `src/components/category/CategoryMoreStoriesSection.tsx`: passes `addedFrom={first}`, so only rows a press adds fade (Latest from row 21, category from row 11).
- Tests: `tests/e2e/latest.spec.ts`: "load more: the added rows fade in, the first rows do not; axe after the fade" (10 rows `data-added`, `animation-name` `story-added`, 0.45s; waits for `document.getAnimations()` before axe) and "load more with reduced motion: the added rows show at once". Chromium: `latest.spec.ts` and `category.spec.ts` 98 passed, `motion.spec.ts` 14 passed; `pnpm test` 320 passed.
- Seen in the browser (`/en/latest`, dev server): row 21 at opacity 0.5 at 120ms (the ease-slide curve starts fast). The images of the added rows were still the empty surface 1s after the press: the pop that option (b) is about.
- Rules used: DR-346 (one motion), DR-284 (opacity only), DR-227 (reduced motion). New rule if kept: motion on list rows (spec log at `/checkpoint`).

### Tweak: load more option (a), fade and rise (28 Oct 2026)

- tajmin: "now build a". Not approved yet: see "Proposed". This replaces the first-plan fade (opacity only).
- Code: `src/styles/components.css` (`@keyframes story-added`): from `opacity: 0` and `transform: translateY(1rem)`, the `dialog-panel` rise from 600. Utility `story-added` unchanged (`--duration-slide`, `ease-slide`). No new token.
- Tests: `tests/e2e/latest.spec.ts` "load more: the added rows fade in and rise, the first rows do not; axe after the motion": the first keyframe is opacity 0 and `translateY(16px)` (the browser gives 1rem as 16px at the default text size); the Button stays at the same y from the first frame to the end (transform only, no layout move). Chromium: `latest.spec.ts`, `category.spec.ts`, `motion.spec.ts` 112 passed.
- Seen in the browser (`/en/latest`): 60ms after the press row 21 is at opacity 0, 16px down; the rows settle into place. No console errors.

### Tweak: fade + image fade, and 10 first (28 Oct 2026)

- tajmin: "lets go with fade + image fade." and "I asked for 20 items first. cut it down to 10". Option (a)'s rise is removed. The brief now says 10 first.
- Code: `src/styles/components.css`: `@keyframes story-added` back to opacity only; `@utility story-added` has no fill mode now (the end state is the row's own look, so a finished row lets the animation go). New `@utility story-image-fade`: `opacity: 0`, `transition: opacity var(--duration-slide) var(--ease-slide)`, `&[data-loaded]` opacity 1. No new token.
- Code: `src/components/story/StoryImage.tsx` (`StoryImage`): new prop `fadeIn` (default false). With it: `story-image-fade` on the img, `data-loaded` after `onLoad` (and on mount when the img is already `complete`, for cached images), and the `bg-surface-alt` slot fill on the link, since the transparent img would hide its own fill. Lazy loading unchanged. Off: the output is as before.
- Code: `src/components/story/StoryCard.tsx` (`StoryCardProps.imageFadeIn`, default false) passes `fadeIn` to StoryImage. `src/components/category/CategoryCards.tsx` (`CategoryMoreStoriesList`) sets it on the added rows.
- Code: `src/components/category/CategoryMoreStoriesSection.tsx`: the `first` prop is removed (Latest is 10 first now, the same as the category page); `PAGE_SIZE` again. `src/components/latest/LatestPageView.tsx`: `LATEST_FIRST` removed.
- Tests: `tests/e2e/latest.spec.ts`: 10 rows first, load more 10 → 20 with focus on the 11th title, the time check on the 11th row; the row motion test checks opacity only (no transform); new "a slow image of an added row fades in when it has loaded; the first rows' images do not fade" (images held back with `page.route`: the image stays at opacity 0 over the slot fill after the row is in, then gets `data-loaded`, a 0.45s transition and opacity 1). `src/content/content.test.ts`: the test name says 10 first.
- Runs (Chromium): `latest.spec.ts` 51 passed; `category`, `story-units`, `motion`, `hero`, `page`, `text-size`, `featured` 273 passed. `pnpm test` 320 passed; typecheck and lint pass.
- Seen in the browser (`/en/latest`): 10 rows first; after a press 10 rows added, 7 with images, each fading in when loaded. No console errors.
- Spec items for `/checkpoint`: new rule, the load more motion: the added rows fade in (opacity, `--duration-slide`, `ease-slide`) and their images fade in when loaded; reduced motion none (tajmin chose it, 28 Oct 2026). C-24 StoryCard and StoryImage gain the `imageFadeIn` / `fadeIn` option.

### Final checkpoint: /checkpoint (28 Oct 2026)

- Checks: `pnpm check` passed (lint, typecheck, 320 unit tests, build; `/bn/latest`, `/en/latest` static), no warnings. Chromium: `latest.spec.ts` 51 passed (3 runs); the motion and time tests 20 times each, 120 passed. Full `pnpm test:e2e:chromium` not run: tajmin runs it on `dev` after the merge.
- Fix: `tests/e2e/latest.spec.ts` time test used `clock.install` then `clock.pauseAt` at the same time, which failed about 1 run in 40 ("Cannot fast-forward to the past"); now `clock.setFixedTime`. The slow-image test waits on `document.getAnimations()` instead of a fixed 600ms.
- Visual QA (visual-qa agent): no layout fault on the Latest page at 320 to 1440, bn and en, light and dark; the date column is the same width on every row; load more adds 10, images at opacity 1 after the motion; focus rings show. Found: 15px sideways scroll at 320 with a classic scrollbar, from the shared `ad-top` slot (IMP-122). Its "no nav row at 1280" was a screenshot artefact: the nav row is 45px with 9 items (checked). Image-less rows show the flat DR-338 placeholder, as specified.
- Design review: 0 blockers. LT-01, LT-03, LT-04, LT-05 green; LT-02 red (flag U-51). Minor fixes done: `types.ts` comment, "7C.2 Paths, News hub row" citations (code, brief, tests, `AGENTS.md`), the load more utilities moved above the "One motion" comment in `components.css`, `AGENTS.md` Section 5 lists `latest/`.
- Spec log: `docs/spec-log/latest.md` LT-01 to LT-05 (LT-01 split into the page rule and LT-05, the new component).
- Specs written (green items): layout 2.29 (new 7D; 7B.2 Load more motion and story time), typography 2.21 (TYP-17 story time after load more), component-system 1.25 (Section 3 Latest table, Section 6 motion CSS, C-24 `imageFadeIn`, Section 8 `/latest` built), agent-contract 2.19 (Section 1 versions, Section 3 Latest row).
- STATUS and ISSUES: IMP-18 `/latest` part fixed; new U-51 (flag), IMP-122, DOC-59.

### U-51: rename the More stories parts (28 Oct 2026)

- Decision: tajmin, chat, 28 Oct 2026: "Rename it." (LT-02 flag, U-51).
- Code: `src/components/category/CategoryMoreStoriesSection.tsx` moved (git mv) to `src/components/more-stories/MoreStoriesSection.tsx`, `CategoryMoreStoriesSection` renamed `MoreStoriesSection`. `CategoryMoreStoriesList` moved out of `src/components/category/CategoryCards.tsx` to `src/components/more-stories/MoreStoriesList.tsx` as `MoreStoriesList` (its props type is `Props`; `CategoryCards.tsx` keeps `CategoryCardList` only and no longer imports `cn`).
- Code: imports in `CategoryPageView.tsx`, `LatestPageView.tsx`; comments in `CategoryFormatsSection.tsx`, `CategoryCards.tsx`.
- Not changed: the DOM hooks (`id="category-more-title"`, `data-section="category-more"`, `data-category-more-wrapper`), so the page output and the tests stay as they were.
- Specs: component-system 1.25 Section 3 (category row and Latest row name `MoreStoriesSection`, `MoreStoriesList`; "never opinion" is the category page rule), layout 2.29 7B.1, 7D and changelog, agent-contract 2.19 Section 3 Latest row. Spec log LT-02 decided. `AGENTS.md` Section 5 lists `more-stories/`. ISSUES U-51 Fixed; STATUS updated.

### PR #18 review fixes (28 Oct 2026)

- Decision: tajmin, chat, 28 Oct 2026: "Fix both" (the spec log cells and the brief names; the focus note and IMP-122 stay as they are).
- Docs: `docs/spec-log/latest.md` LT-01 to LT-05: the `||` between Source and Reviewer is now one `|` (7 cells, as the header).
- Docs: `docs/briefs/latest.md` names `MoreStoriesList` and `MoreStoriesSection`, with the old names noted (U-51).
