# topic progress

Branch `page/topic` · Brief `docs/briefs/topic.md` · Issue IMP-18 (the `/topic/<slug>` part) · Started 29 October 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: Final checkpoint done and committed on `page/topic` (tajmin, 30 Oct 2026: "Yes, commit")
- Next step: push and the PR to `dev`; after the merge, `AGENTS.md` Section 9 step 6 on `dev` (full Chromium e2e, including the run deferred from docs-cleanup)
- Open questions to tajmin: confirm the 404 for an unknown topic slug (the brief default, never answered)
- Uncommitted: no

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 29 Oct 2026 | Before the branch: step 6 of docs-cleanup on `dev` (brief and progress file deleted, `STATUS.md`), `.claude/launch.json` in `.gitignore`; the full Chromium e2e on `dev` waits until topic is merged | tajmin, chat: "add it to gitignore", "update and remove the doc files as you suggested. skip the pending tetsing. will do once topic is merged", "Commit and push" |
| 29 Oct 2026 | Page order as the Latest page (layout 7D): header, `ad-top`, PageTitle, the list, footer | tajmin, chat: "similar to latest" |
| 29 Oct 2026 | News and analysis, no opinion | tajmin, chat: "no opinion" |
| 30 Oct 2026 | Eyebrow: the category on news rows, the format on the other rows (here analysis) | tajmin, chat: "show category for. news, format for non-news (in this case analysis" |
| 29 Oct 2026 | A small বিষয় / Topic label above the topic name in the PageTitle. Replaced on 30 Oct 2026: no label (next row) | tajmin, chat: "yes" (question 4) |
| 30 Oct 2026 | No new topics and no new mock stories: link existing stories to the existing topics, at least 3 per topic | tajmin, chat: "no more new topics or mock data. if we have 4 topics, links existing articles to those. if any of those dont have 3 articles then add and make it 3 per tag" |
| 30 Oct 2026 | Test cases on purpose within 4 topics: one with more than 10 (`regional-cooperation`, about 14) for load more, one with exactly 10 (no Button); `rivers` has the 10. The sparse case (3 each) is `archives`, `river-trade`, `foreign-reserves`; `monsoon` and `flood-forecasting` get their 3 from stories of `rivers` and `regional-cooperation`, so the links stay few | tajmin, chat: "one topic with more than 10 news and analysis stories (for example regional-cooperation, about 14), to test load more / one topic with exactly 10, so it shows no button - all within 4 topics"; "(archives, river-trade, foreign-reserves) - test sparse case here? dont need a load of mock data" |
| 30 Oct 2026 | No label: the PageTitle shows the topic name only, as on the category and Latest pages. The label variations (A to F) and "Topic ›" were dropped; U-52 removed | tajmin, chat: "Lets keep it simple. Only page title. no label" |
| 30 Oct 2026 | Brief approved | tajmin, chat: "Yes, build" |
| 30 Oct 2026 | Static pages for every topic in bn and en; an unknown slug is a 404 (proposal, not answered: taken as the default of the category and Latest pages) | Brief |

## Log

### Checkpoint 1: content (30 Oct 2026)

- Built: topic keys on 26 existing stories (no new stories, no new topics), `getTopicPage` and `getTopicSlugs`, unit tests
- Code: `src/content/stories.ts` (`StoryDef.topics?: TopicId[]`, after `regions`): the topics belong to the story. Tagged in `stories.ts` (15), `category-stories.ts` (8), `category-stories-older.ts` (3)
- Code: `src/content/reader-articles.ts`: `ArticleDef.topics` removed with its 3 entries; `src/content/reader.ts` (`topicsBySlug`, `getArticle`) reads the topics from the story, so the article Topics badges and the topic page share one source. The 3 articles keep the same topics in the same order
- Code: `src/content/types.ts` (`TopicPage`: `lang`, `topic: Topic`, `stories`); `src/content/index.ts` (`getTopicSlugs()`, `getTopicPage(lang, slug)`: news and analysis with the topic, newest first; `undefined` for an unknown slug)
- Mock data, news and analysis per topic:
  - `regional-cooperation` 14 (load more: 10, then 4): river-data-framework, foreign-secretary-kathmandu, bay-trilateral-dialogue, regional-power-grid, visa-joint-committee, india-land-port-clearance, southeast-asia-trade-talks, regional-security-pact, south-asian-connectivity-corridor (analysis), transit-facility-expansion, cross-border-water-project, regional-economic-integration-prospects (analysis), reserve-indicators (analysis), intra-asia-transport-corridor
  - `rivers` 10 (no Button): river-data-framework, myanmar-river-trade, cross-border-water-project, char-satellite-internet, ancient-port-cities, ancient-civilization-study (analysis), south-asian-connectivity-corridor (analysis), disaster-response-drills, disaster-preparedness-annual-review, southern-silk-route (analysis)
  - Sparse, 3 each: `archives` (old-dhaka-trade-ledgers, liberation-war-press-archive, colonial-era-records), `river-trade` (old-dhaka-trade-ledgers, myanmar-river-trade, southern-silk-route), `foreign-reserves` (reserve-indicators, exports-september, remittance-digital-channel)
  - 3 each from `rivers` and `regional-cooperation` stories: `monsoon` (river-data-framework, disaster-response-drills, disaster-preparedness-annual-review), `flood-forecasting` (river-data-framework, cross-border-water-project, disaster-preparedness-annual-review)
- Tests: `src/content/content.test.ts`: the topic key test now checks the story topics and that each article story has topics; new `describe` "topic page (layout 7C.2 Paths, Topic row; DR-410)": the counts per topic, label, no opinion, newest first, no repeats, news and analysis mixed on `regional-cooperation`, same order in both languages, unknown slug. `pnpm test` 326 passed; `pnpm typecheck` and `pnpm lint` clean
- New tokens, components: none
- Rules used: DR-410, DR-414, DR-01, mock-content skill
- Gaps and flags: none

### Checkpoint 2: route and shell (30 Oct 2026)

- Built: `/topic/<slug>` and `/en/topic/<slug>` for the 7 topics, static (`generateStaticParams`, `dynamicParams = false`); an unknown slug, `/topic` and `/en/topic` give the 404 page
- Code: `src/app/[lang]/topic/[slug]/page.tsx` (`TopicRoute`, `generateMetadata`: the title is the topic label, hreflang bn and en); `src/components/topic/TopicPageView.tsx` (`TopicPageView`): SkipLink, `SiteHeader` (path `/topic/<slug>`, so the language switch keeps the topic), `AdSlot` top, `PageTitle` (`id="topic-title"`, the topic label as `h1`, no label (tweak), `mb-(--space-module)`), `MoreStoriesSection` (`labelledBy="topic-title"`), `Footer`. No ad band. With no stories the list is not shown
- For now the list uses `eyebrow` (category on every row, as Latest); checkpoint 3 changes analysis rows to the format Eyebrow
- Tweak from tajmin: "Lets keep it simple. Only page title. no label" → the `PageTitle` `label` prop, the `topicPage.label` strings and the U-52 row are removed; `PageTitle.tsx`, `bn.ts`, `en.ts` and `ISSUES.md` are unchanged from `dev`
- New tokens: none. New components: `TopicPageView`. C-43 PageTitle is used as it is
- Checked in the browser: bn `/topic/archives` (3 rows, no Button), en `/en/topic/regional-cooperation` (10 rows, Load more), phone 375 `/topic/foreign-reserves` (no sideways scroll); the article page Topics links open the pages; 404s as above. `pnpm typecheck`, `pnpm lint` clean
- Rules used: layout 7C.1, 7C.2, 7D; C-43, `TYP-14`, DR-216, DR-410
- Gaps and flags: none

### Checkpoint 3: the list and its Eyebrows (30 Oct 2026)

- Built: the topic list shows the C-08 Eyebrow on every row: the category on news, বিশ্লেষণ / Analysis on analysis (the existing Eyebrow `format` mode, DR-417). No opinion (checkpoint 1)
- Code: `src/components/more-stories/MoreStoriesSection.tsx` and `MoreStoriesList.tsx`: new optional prop `eyebrowMode` (`EyebrowMode`), passed to `StoryCard`. Latest passes none (category on every row, unchanged); the category page has `eyebrow` off (unchanged)
- Code: `src/components/story/StoryCard.tsx` (`analysisLabel`): the extra format label of a dated analysis row shows only when `eyebrow` is off, so a topic analysis row has one Eyebrow, not two. The category page (eyebrow off) is unchanged
- Code: `src/components/topic/TopicPageView.tsx`: `MoreStoriesSection` with `eyebrow` and `eyebrowMode="format"`
- Checked in the browser: `/en/topic/regional-cooperation`: one Eyebrow per row, Analysis on the 3 analysis rows, load more 10 then 14, the Button goes, focus on the first added title. `pnpm test` 326 passed; typecheck and lint clean; `category.spec.ts` and `latest.spec.ts` in Chromium: 100 passed
- New tokens, components: none
- Rules used: C-08 (DR-417 `format` mode), C-24, DR-153 (the page mixes categories), DR-414
- Gaps and flags: none

### Checkpoint 4: tests (30 Oct 2026)

- Code: `src/components/more-stories/MoreStoriesSection.tsx`: new optional prop `section` ("latest" default, or "topic"): the `data-section` name when `labelledBy` is set, so the topic list is not named "latest". `TopicPageView` passes `section="topic"`
- Tests: new `tests/e2e/topic.spec.ts` (bn and en on `regional-cooperation`): page order (`header`, `topic`, no ad band), one `h1` with the topic name and no label, 10 rows with `h2` titles, no Fact Check and no "tag"; one Eyebrow per row (category on news, `/analysis` on the 3 analysis rows, no opinion), newest first; layout at the 13 widths of Section 13 (no sideways scroll, no radius, C-24 dated columns); load more by keyboard 10 → 14, focus on the first added title, the Button and rule go; `rivers` 10 and the 3 sparse topics show no Button; the TopBar language link keeps the topic; focus ring on every link and button; axe light and dark at 360 and 1280. Outside the languages: unknown slugs, `/topic`, `/en/topic` and `/topic/Rivers` are 404; the 4 Topics links of the river data article open the pages (200)
- Run: `pnpm exec playwright test --project=chromium tests/e2e/topic.spec.ts article.spec.ts latest.spec.ts category.spec.ts`: 194 passed
- Gaps and flags: none

### Final checkpoint (30 Oct 2026)

- Checks: `pnpm check` passed (lint, typecheck, 326 unit tests, build with the 14 topic pages). Chromium e2e on topic, article, latest, category, story-units, url-format: 278 passed. The full `pnpm test:e2e:chromium` was not run: the work does not change `src/styles/`, `src/components/layout/` or `src/i18n/`
- Spec log `docs/spec-log/topic.md`: TP-01 to TP-05, all green (design-reviewer: pass, no blockers)
- Specs written: `spacing-layout-system.md` 2.31 (new Section 7E, 7C.2 Topic row, 14.2, changelog); `component-system.md` 1.27 (Section 3 topic page sections and `TopicPageView`, the `MoreStoriesSection` row names the topic page, C-24 `dated`, C-34 `Topics.item`, Section 8 row); `agent-contract.md` 2.21 (Section 1 versions, Section 3 topic page row)
- `docs/STATUS.md` Now and spec versions; `docs/ISSUES.md` 1.5: IMP-18 `/topic/<slug>` part fixed
- Visual check (visual-qa): no layout faults at 320 to 1440 in bn and en, light and dark; the list and band line up with `/latest`
- Reviewer notes kept here: `rivers` has exactly 10 only with `south-asian-connectivity-corridor` and `southern-silk-route` tagged; the unit test fails if a later edit changes the counts (on purpose)
