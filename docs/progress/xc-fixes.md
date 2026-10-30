# xc-fixes progress

Branch `task/xc-fixes` · Brief `docs/briefs/xc-fixes.md` · Issue: 30 Oct 2026 cross-check (XC flags) · Started 30 October 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: final checkpoint done, waiting for tajmin's commit yes
- Next step: checkpoint 5: commit on tajmin's yes, then push and the PR to `dev` on yes
- Open questions to tajmin: none. U-53 (P-4 halves) is an open flag to decide later
- Uncommitted: yes, checkpoints 1 to 3, the brief and this file

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 30 Oct 2026 | The fix plan for the cross-check flags (checkpoints 1 to 5 of the brief) is approved | tajmin, via the project thread |
| 30 Oct 2026 | XC-17: the homepage lock (DR-370) is lifted; the homepage changes like any page | DR-434 |
| 30 Oct 2026 | XC-02: sitemaps wait for the backend stage; topic pages below 3 stories are noindex, follow | DR-432 |
| 30 Oct 2026 | XC-04: region columns show the C-08 `format` Eyebrow on every story: the category on news, বিশ্লেষণ / Analysis on analysis, as the hero (DR-417). Amends the news part of DR-433 ("news stories show no Eyebrow"); a DR row comes after the merge. Confirmed 17:01: "DR-433 needs amend. in the region column, news too show eyebrow." | DR-433; tajmin, 16:20: "Hero and region columns - analysis will be there. But label format will be: category name for news, format for analysis." |
| 30 Oct 2026 | Dropped: "no analysis eyebrow in anywhere on home" (09:57); tajmin: "My mistake. I have kept a Section in homepage for analysis." No code was changed for it | tajmin |
| 30 Oct 2026 | XC-06: a variable that only computes from named tokens is a helper with a code comment, not a spec row | DR-437 |
| 30 Oct 2026 | XC-11: the formats row keeps fixed halves, Analysis start, Opinion end; an empty block leaves its half empty | DR-436 |
| 30 Oct 2026 | XC-16: `--color-page-title-band` points to `surface` | DR-425, DR-424 |
| 30 Oct 2026 | XC-18: the Eyebrow separator is the CPT-10 square | DR-435 |
| 30 Oct 2026 | XC-15: delete `page/category-v2` (local and remote, with its unmerged commit caf1e9f): "delete the branch. thats not needed anyore". Done 30 Oct 2026 | tajmin, confirmed by the coordinator |
| 30 Oct 2026 | The PageTitle band class stays `bg-(--color-page-title-band)`, no `@theme` utility; at checkpoint 4 the C-43 sheet and component-system Section 6 write that form, the spec log notes it as the wording of DR-425 | tajmin: "ok" |
| 30 Oct 2026 | Category More stories stays as built (CF-07): news rows no Eyebrow, analysis rows the format Eyebrow. No change | tajmin, 17:04: "Category > More Stories: if news then no eyebrow. if analysis then show eyebrow." |
| 30 Oct 2026 | Homepage P-4 (analysis spans the shell with no opinion, unlike DR-436): new open flag U-53 | tajmin, 17:09: "keep this as open flag to decide later"; 17:12: "P-4 issue is open flag." |
| 30 Oct 2026 | U-52 closed with no change (the audit is in the log below) | tajmin, 17:16: "close u-52. next" |
| 30 Oct 2026 | Out of scope: the opinion two-part Eyebrow structure (only the separator changes); XC-10 withdrawn | coordinator brief |

## Log

### Checkpoint 1: docs and rules (30 Oct 2026)

- Built: no code. The homepage lock text is removed, the contract names the current spec versions, the spec logs are full again, the ISSUES rows are current.
- `AGENTS.md`: version 1.11; Section 1 Pages row: the homepage changes like any page (DR-434) (XC-17).
- `docs/design-system/agent-contract.md`: version 2.22; Section 3 note under the scope table: the homepage changes like any page (DR-434) (XC-17); Section 5 headings: typography v2.21, layout v2.31, component-system v1.27 (XC-07). They change again at the final checkpoint with the spec versions.
- `docs/STATUS.md` "Now": Branch bullet; Pages done drops "locked, DR-370"; DOC-57 out of the open items list.
- `.claude/skills/task/SKILL.md` step 3: names the homepage sections in the brief, no lock (XC-17).
- `docs/ISSUES.md`: version 1.6; DOC-57 removed (XC-07); U-51 removed (fixed on `page/latest`, XC-08); U-48 says the note sits in the PageTitle band, above the Divider (XC-09); new IMP-123 Backend: sitemaps at the M2 backend stage (XC-02, DR-432); IMP-120 status: a homepage branch, the lock is lifted (DR-434); next free IMP is 124.
- `docs/spec-log/article.md` and `category.md`: restored in full from commit adb2fe9 (no rows were added after it; later commits only removed rows) (XC-14). `home-most-read.md`: "Open items" renamed "Items", new "Flags" section (HM-04, open as U-47).
- U-49 stays open until checkpoint 3 (XC-04).
- New tokens or components: none.
- Gaps and flags: none.

tajmin, 30 Oct 2026, after checkpoint 1: "everything looks good. go ahead" (starts checkpoint 2).

### Checkpoint 2: tokens and the Eyebrow separator (30 Oct 2026)

- Built: the PageTitle band takes its own token; the two-part Eyebrow separator is the CPT-10 square; helper variables name their sources. No visible change except the separator.
- `src/styles/components.css`: new `--color-page-title-band: var(--surface)` next to `--color-bar`, in `:root` and `.dark` (XC-16, DR-424, DR-425). `--space-eyebrow-separator` removed (XC-18, DR-435). Helper comments (XC-06, DR-437): `--list-ink-start` (at `list-ink-title-meta`: `--type-story-title-sm-ink-start` or 0), `--divider-item-start` (at `opinion-rule-start`: `--quote-mark-width` + `--grid-column-gap`), `--logo-stuck-scale` (`--type-logo-size` per tier and the 24px stuck logo of C-17).
- `src/components/layout/PageTitle.tsx` (`PageTitle`): `bg-(--color-page-title-band)` replaces `bg-surface`; the doc comment names the token. Written as `bg-(--token)` like `--color-bar`, not a `bg-page-title-band` theme utility: the component color tokens are not in `@theme`.
- `src/components/story/Eyebrow.tsx` (`Eyebrow`, `two-part`): the separator is an empty `span` (`data-eyebrow-separator`, aria-hidden), `mx-2.5 size-1 shrink-0 bg-interactive`, the MetaLine CPT-10 pattern in the Eyebrow color; outside the links, so it keeps its color on hover and press. The row and the first part are `items-center`. Was a muted middle dot with `--space-eyebrow-separator`.
- New tokens: `--color-page-title-band` = `surface` (light and dark), color (`CPT-07`). Removed: `--space-eyebrow-separator`.
- Tests: `src/components/story/small-parts.test.tsx` (the separator is empty, `bg-interactive`, outside the links); `tests/e2e/url-format.spec.ts` (drawn 4 x 4px, 10px each side, no radius, the link color, centered, same color on hover); `tests/e2e/category.spec.ts` comment names the band token.
- Checks: unit `src/components/story` 50 passed; typecheck and lint clean; Chromium e2e url-format, category, topic, latest: 176 passed.
- Gaps and flags: none.

tajmin, 30 Oct 2026: "ok" (keeps the class form, starts checkpoint 3).

### Checkpoint 3: page code (30 Oct 2026)

- Built (the region part changed by the tweak below: every story has the Eyebrow, `formatLabel` became `eyebrowMode`): region columns show the `format` Eyebrow on analysis stories; the category formats row keeps fixed halves; topic pages below 3 stories are noindex, follow.
- `src/components/home/regions/RegionsSection.tsx` (`RegionsSection`): the lead `StoryCard` takes `eyebrow={lead.format === "analysis"}` with `eyebrowMode="format"`; the text rows pass `formatLabel` to `StoryListItem` (XC-04, DR-433). Closes U-49 (removed from ISSUES) and UF-02.
- `src/components/story/StoryListItem.tsx` (`StoryListItem`): new prop `formatLabel`: on an analysis story the C-08 `format` Eyebrow above the title, `mb-(--space-lead-eyebrow-title)` as in `StoryCard`; `strings` adds `analysisOpinion`. `src/components/story/StoryList.tsx`: `strings` adds `analysisOpinion` (type only).
- `src/components/category/CategoryFormatsSection.tsx` (`CategoryFormatsSection`): both halves always render, Analysis start, Opinion end; an empty block is an empty `div` (`data-empty-half`, `hidden sm:block`, so on phones it takes no row); both empty: no row (XC-11, DR-436).
- Homepage P-3 check (XC-11): `GroupedCategoriesSection` already keeps fixed halves: rows of two in order, an odd last category keeps its size at the start and the end half stays empty (layout 7.3). No change. Note: P-4 (the homepage analysis and opinion section) is different: with no opinion, analysis spans the shell (the `sparse` mock data); not in this pass.
- `src/lib/seo.ts` (new): `topicRobots(count)` = `{ index: false, follow: true }` below `TOPIC_INDEX_MIN_STORIES` (3), else nothing. `src/app/[lang]/topic/[slug]/page.tsx` `generateMetadata` sets `robots` (XC-02, DR-432).
- Tests: `src/lib/seo.test.ts` (new); `story-units.test.tsx` (`formatLabel`); `tests/e2e/regions.spec.ts` (Eyebrow on the analysis stories of china, americas, asia; none in europe; before the title); `tests/e2e/category.spec.ts` (fixed halves, the empty opinion half at the end; hidden on phones); `tests/e2e/topic.spec.ts` (no robots meta at 3 and 14 stories). Every mock topic has 3 stories or more, so the noindex case is unit-tested only.
- Checks: unit 332 passed; typecheck, lint clean; Chromium e2e regions, category, topic, grouped, story-units, hero, featured: 403 passed (after a fix to the new regions test).
- New tokens or components: none.
- Gaps and flags: U-52 (flag): the rule-to-ink space above an analysis text row is about 1px off (the list ink is the title's; no Eyebrow ink token). Proposal: accept, or add an Eyebrow ink token.

### Checkpoint 3 tweak: category Eyebrow on news in the region columns (30 Oct 2026)

- tajmin, 16:20: "Hero and region columns - analysis will be there. But label format will be: category name for news, format for analysis."
- Hero (lead and top stories): already `format` mode (DR-417): category on news, Analysis on analysis; `url-format.spec.ts` tests it. No change.
- `src/components/home/regions/RegionsSection.tsx`: the lead `StoryCard` always shows the Eyebrow (`eyebrowMode="format"`, the `eyebrow={lead.format === "analysis"}` line removed); the text rows pass `eyebrowMode="format"`.
- `src/components/story/StoryListItem.tsx`: the checkpoint 3 prop `formatLabel` is replaced by `eyebrowMode?: EyebrowMode`: the Eyebrow in that mode above the title, none when unset (every other list).
- Not changed (not decided): category More stories (CF-07) news rows show no Eyebrow; analysis rows show the format.
- Tests: `story-units.test.tsx` (`eyebrowMode` format: category on news, Analysis on analysis, none unset); `tests/e2e/regions.spec.ts`: three Eyebrows per region, category hrefs on news, `/analysis` on analysis; the keyboard test keys each link by panel, index and href, because two Eyebrows in one region can link to the same category (it counted 31 of 36 before).
- U-52 measured at 1280 (rule to the Eyebrow ink, target 16px): English 16.19px; Bangla 15.74px (category), 16.08px (বিশ্লেষণ). Under 0.3px, not the 1px first estimated. ISSUES row updated; proposal: close.
- Checks: unit 332 passed; typecheck, lint clean; Chromium e2e regions, hero, url-format, story-units: 208 passed, the 2 keyboard failures fixed in the test key; regions, text-size, page: 124 passed.

### U-52 audit (30 Oct 2026), no code changes; U-52 closed

- tajmin, 17:12: "i asked clarification for U-52 because there are other instances where dotted line divide two items". Also: "P-4 issue is open flag" (now U-53). Then 17:16: "close u-52. next".
- Measured at 1280 in bn and en with a headless Chromium script (canvas font metrics, about ±0.3px): every `li.divider-item` after the first, rule bottom to the first ink, target 16px (space-list-item).
- Results (corrected): title-first lists (hero Latest, featured, grouped, category feature, category formats Analysis) 15.7 to 16.3; region columns, every row Eyebrow-first, 15.7 to 16.0; image and no-image placeholder rows (Latest, topic, More stories, analysis section) 16.0. Bangla More stories rows whose title sits beside the image (dated layout from 600): the title ink is up to 2.3px above the image top (13.7 to 15.9), the vowel signs above the Bangla line. Opinion quote rows measure the quote mark box, not its ink (15.4 bn, 12.0 en).
- Correction: the first report said rows with no image in image lists were 4 to 5px off in English. That was a fault in the script: it missed the no-image placeholder (a `surface-alt` block, `data-placeholder`, DR-338). Counted as the first ink, those rows measure 16.0. Every story slot shows an image or the placeholder, so the case does not occur.
- Closed with no change: the Eyebrow-first rows are within the measuring noise. Most read and the article page have no dotted rule.

### Checkpoint 4: final checkpoint (30 Oct 2026)

- Spec log `docs/spec-log/xc-fixes.md`: XF-01 to XF-10, from this file.
- Specs: color 2.18 (2.1, 2.9), layout 2.32 (7.1, 7B.1, 7B.2, 7B.3, 7C, 7E.2, Section 10, changelog), component-system 1.28 (Section 6 rows and CSS block, CPT-07 helper line, C-08, C-15, C-25, C-43; DR-133 and DR-135 off C-12 and C-23, they stay on C-14), agent-contract 2.22 (Sections 1 and 5 versions).
- Code: the Divider comment in `components.css` names the Section 6 tokens.
- DR-418 to DR-420 and DR-393 cited at section level (the DR texts are not in the repo); DR-421 not placed (flag in the spec log).
- Checks: `pnpm check` passed (unit 332, lint, typecheck, build, no warnings); full `pnpm test:e2e:chromium` 927 passed.
- design-reviewer: no code blockers; XF-01, XF-03 to XF-10 green; XF-02 red (CPT-10 said the metadata color). Fixed in the spec: CPT-10 names the `two-part` Eyebrow separator in the Eyebrow color (DR-435). Notes kept as is: the `two-part` example in C-08 and the ArticleHeader row write "·" in prose; old changelog lines name `--space-eyebrow-separator` (history).
- After the report (tajmin, 17:28: "1. ok 2. whats 421? 3. yes", via the project assistant): CPT-10 is one general sentence, "The separator takes the text color of its line" (the Eyebrow special case removed; XF-02 green); the spec log lists the DR-417 amendment (More stories) next to DR-433; DR-421 waits for tajmin. Not committed.
- DR-421: no citation (tajmin, 17:29: "no issues. keep as it is now."). Not committed.
