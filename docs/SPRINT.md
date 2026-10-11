# Homepage Prototype Sprint

This is a small sprint for a simple prototype: one homepage, mock data, Bangla and English. It is not a full website.

## How it works

- Claude does one ticket at a time: plan, build, test, verify.
- Claude asks tajmin before a command that needs permission.
- At the end of a ticket, Claude stops and gives tajmin the test steps.
- tajmin tests the ticket. tajmin replies with problems, or types `/accept`.
- Claude starts the next ticket only after `/accept` and a new `/ticket`. tajmin runs `/clear` between tickets.

| Command | Who | Does |
| --- | --- | --- |
| `/ticket` | tajmin | Claude starts the next ticket that is "To do" |
| `/accept` | tajmin | Claude marks the ticket "Done", commits and pushes the current branch |

## Run 1 board (record)

Prototype run 1 finished on 8 October 2026. tajmin rejected FL-14. The report is `docs/milestone-1-report.md` and the handover note is `docs/HANDOVER.md`.

| Ticket | Title | Status |
| --- | --- | --- |
| FL-01 | Project setup | Done |
| FL-02 | Design foundations | Done |
| FL-03 | Layout parts | Done |
| FL-04 | Mock content | Done |
| FL-05 | Header | Done |
| FL-06 | Hero | Done |
| FL-07 | বিশ্লেষণ ও মতামত | Done |
| FL-08 | Featured categories | Done |
| FL-09 | Grouped categories | Done |
| FL-10 | Most read | Done |
| FL-11 | Regions | Done |
| FL-12 | Footer | Done |
| FL-13 | Final check | Done |
| FL-14 | Preview deploy (optional) | Rejected |

## Run 2

Run 2 builds the homepage again from the component sheets in `docs/design-system/component-system.md` and the current specs. It uses the run 1 code: change a file in place, or write it again when its sheet is very different. Mock data only.

### Branch

- All run 2 work happens on the branch `prototype-run-2`, made from `main` in R2-00.
- `/accept` commits each ticket on `prototype-run-2` and pushes that branch. Do not commit to `main` or push to `main` during run 2.
- `main` changes only in R2-21, when the pull request merges.

### Log

- `docs/run-2-log.md` has one row per ticket: dates, result, rounds of fixes, spec findings and commit.
- `/accept` adds the row in the same commit as the ticket. A rejected ticket also gets a row.

### Rules for every ticket

- Read `AGENTS.md`, `docs/design-system/agent-contract.md` Sections 5 to 9, and only the spec sections that the ticket names. The specs are the only source.
- If no rule answers a question, or the only fix is a workaround, or two rules disagree: report `UNRESOLVED_DESIGN_SYSTEM` with the rule IDs and ask tajmin. Do not choose a value.
- Test each section in Bangla (`/`) and English (`/en`), light and dark, at the widths in `spacing-layout-system.md` §13. Run axe and a keyboard pass.
- The "Done" lines of a ticket are its acceptance criteria. For every ticket also: `pnpm check` passes, the section tests pass, and `design-reviewer` says `Verdict: pass`.

### Run 2 board

Status values: To do, In progress, In review, Done, Rejected. A ticket starts only when its "Needs" tickets are Done.

| Ticket | Title | Needs | Status |
| --- | --- | --- | --- |
| R2-00 | Start the run 2 branch | – | Done |
| R2-01 | Clean up from run 1 | R2-00 | Done |
| R2-02 | Foundations CSS | R2-00 | Done |
| R2-03 | Mock content | R2-02 | Done |
| R2-04 | Small parts | R2-02 | Done |
| R2-05 | Page chrome | R2-04 | Done |
| R2-06 | Ad slots and page frame | R2-03 | Done |
| R2-07 | Story units | R2-04 | To do |
| R2-08 | Hero (P-1) | R2-07 | To do |
| R2-09 | Analysis and opinion (P-4) | R2-07 | To do |
| R2-10 | Featured categories (P-2) | R2-07 | To do |
| R2-11 | Grouped categories and rail (P-3) | R2-06, R2-07 | To do |
| R2-12 | Most read (P-5) | R2-07 | To do |
| R2-13 | Regions (P-3b) | R2-07 | To do |
| R2-14 | Footer | R2-04 | To do |
| R2-15 | 200% text size | R2-08 to R2-14 | To do |
| R2-16 | Spacing check | R2-15 | To do |
| R2-17 | Final check | R2-16 | To do |
| R2-18 | Branch preview | R2-17 | To do |
| R2-19 | Pull request | R2-18 | To do |
| R2-20 | Code review | R2-19 | To do |
| R2-21 | Merge into main | R2-20 | To do |

## Run 2 tickets

### R2-00 Start the run 2 branch

- Goal: run 2 starts from a clean `main` that has the final sync, on its own branch.
- Check: `git status` is clean on `main`, and `main` is level with `origin/main`. The spec headers show `color-system.md` v2.7, `typography-system.md` v2.8, `spacing-layout-system.md` v2.11, `component-system.md` v1.2, `agent-contract.md` v2.4. There is no `.claude-sync.patch` and no `.claude/rules/.probe`. If one check fails, stop and tell tajmin.
- Do: `git switch -c prototype-run-2`, then `git push -u origin prototype-run-2` (asks tajmin). Change `.claude/skills/accept/SKILL.md` step 5: push the current branch (`git push`), and stop if the current branch is `main`. Add step 3b to the accept skill: add the ticket's row to `docs/run-2-log.md`. Set "Now" in `docs/PROGRESS.md` to run 2.
- Done: `git branch --show-current` prints `prototype-run-2`; the branch is on GitHub; the accept skill no longer pushes to `main` and adds the log row; R2-00 is the first row in `docs/run-2-log.md`.

### R2-01 Clean up from run 1

- Goal: remove run 1 leftovers so tests and the repo stay small.
- Read: `docs/HANDOVER.md` §5 only.
- Touch: `playwright.config.ts`, the `?content=sparse` code in `src/`, `docs/fl-13/`, `tests/final-check/`.
- Do: delete `docs/fl-13/` and `tests/final-check/` if they still exist (tajmin approves the delete). Keep `?content=sparse` only in development (`NODE_ENV !== 'production'`). Add a WebKit project to Playwright for Bangla shaping on Safari.
- Done: the sparse URL shows full content in `pnpm build && pnpm start`; `pnpm test:e2e --project=webkit -g header` runs.

### R2-02 Foundations CSS

- Goal: the token CSS is the spec CSS.
- Read: `color-system.md` §5; `typography-system.md` §8; `spacing-layout-system.md` §12.
- Touch: `src/styles/colors.css`, `typography.css`, `layout.css`; delete `src/styles/ads.css` and its import.
- Do: replace each file with its spec block, unchanged. Do not change components in this ticket.
- Done: no token in `src/` is undefined (`pnpm build` has no CSS warnings); a list of components that use a removed token goes in the report for the later tickets.

### R2-03 Mock content

- Goal: the content set that run 2 needs.
- Read: `component-system.md` C-26 DailyPoll, C-16 AdSlot; `spacing-layout-system.md` §7.3, §9.
- Touch: `src/content/`.
- Do: remove newsletter content. Add a poll (question, 2 to 4 answers) per language. Add the mock ad for each slot: `ad-top`, the bands, `ad-inset`, `ad-rail`. Keep the long-headline, no-image and sparse cases.
- Done: types compile; a Vitest test checks that each language has the same story IDs.

### R2-04 Small parts

- Goal: the shared parts match their sheets.
- Read: `component-system.md` §4 (CPT, N rules), §6, and the sheets C-22 Divider, C-13 SectionHeading, C-10 MoreLink, C-08 Eyebrow, C-09 MetaLine, C-11 Chip, C-12 Button.
- Touch: the matching files in `src/components/`. Use the names in `component-system.md` §3.
- Do: no rounded corners, no card borders, no shadows. Links have no underline. MoreLink sits at the end edge. Button: one 48px size, 20px icons.
- Done: a Vitest or Playwright test per part for its states (hover, focus, disabled where the sheet has one).

### R2-05 Page chrome

- Goal: the header and its overlays match the sheets.
- Read: `spacing-layout-system.md` §6; `component-system.md` C-17 TopBar, C-18 NavBar, C-19 Drawer, C-20 SearchDialog.
- Touch: `src/components/header/`.
- Do: the same top bar at every width; menu left, logo center; on phones the theme switch and En at the right and search first in the Drawer; from 768 the search dialog. Only the top bar is sticky. The nav row shows from 1280 and shows only the items that fit. Logo: keep the text placeholder.
- Done: keyboard test: focus moves into the Drawer and the dialog and comes back; Escape closes them. The Bangla nav row at 1280 does not overflow.

### R2-06 Ad slots and page frame

- Goal: every ad slot has its reserved space.
- Read: `spacing-layout-system.md` §7.1, §9, LAY-09 to LAY-13, LAY-19; `component-system.md` C-16 AdSlot.
- Touch: `src/components/ads/`, the homepage file in `src/app/`.
- Do: the page order in §7.1. The top ad above the header. Full-width bands after each category section and after Most read. `ad-inset` 300x250 below 1280, 728x90 from 1280. No sticky ads.
- Done: a Playwright test checks the reserved height of each slot at 360, 1024 and 1280, with the ad and without it.

### R2-07 Story units

- Goal: the story cards and lists match their sheets.
- Read: `component-system.md` C-01 LeadStory, C-02 OverlapCard, C-03 StoryList, C-24 StoryCard, C-25 StoryListItem; `typography-system.md` §7.1.
- Touch: `src/components/story/`.
- Do: rebuild LeadStory from its sheet. Do not cut a title (CPT-08). Use the missing-image look from the sheet.
- Done: tests with the long-headline and no-image content at 360, 1024 and 1280.

### R2-08 Hero (P-1)

- Read: `spacing-layout-system.md` §7.2, §7.4 (P-1); `typography-system.md` §7.1 (hero rows).
- Touch: `src/components/home/` hero files and the hero test.
- Do: the two top stories use the story title role from typography §7.1.
- Done: hero tests pass; screenshot at 1024 and 1280 in both languages.

### R2-09 Analysis and opinion (P-4)

- Read: `component-system.md` P-4 AnalysisSection, C-06 OpinionList; `spacing-layout-system.md` §7.4 (P-4).
- Touch: the analysis section files.
- Done: tests at the §13 widths; the section background stays inside the shell.

### R2-10 Featured categories (P-2)

- Read: `component-system.md` P-2 FeaturedCategorySection; `spacing-layout-system.md` §7.2, LAY-05.
- Touch: the featured section files.
- Do: build both rows (বাংলাদেশ, ভূরাজনীতি) from one component.
- Done: tests at the §13 widths, with full and sparse content.

### R2-11 Grouped categories and rail (P-3)

- Read: `component-system.md` C-23 CategoryBlock, C-26 DailyPoll; `spacing-layout-system.md` §7.2, §7.4 (P-3 rail), §9 (ad-rail).
- Touch: the grouped section files, a new DailyPoll component.
- Do: the rail holds DailyPoll, then `ad-rail` below it from 1280 only (300x600 or 300x250, reserve 600). Do not build NewsletterSignup.
- Done: tests: the rail ad is absent below 1280; its reserved height is 600 from 1280; the poll works with the keyboard.

### R2-12 Most read (P-5)

- Read: `component-system.md` C-07 RankedList; `spacing-layout-system.md` §7.2 (P-5 cards per row).
- Touch: the Most read files.
- Done: items per row at 360, 600, 1024 and 1280 match §7.2.

### R2-13 Regions (P-3b)

- Read: `component-system.md` C-15 RegionSlider; `spacing-layout-system.md` §7.4 (P-3b).
- Touch: the regions files.
- Do: a slider from 600, tabs below 600 (§7.4).
- Done: the slider and the tabs work with the keyboard and with touch; no sideways page scroll at 320.

### R2-14 Footer

- Read: `component-system.md` C-21 Footer.
- Touch: `src/components/footer/`.
- Do: build the sheet as it is. The footer gets a design extension after run 2, so do not add to it.
- Done: footer tests in both languages.

### R2-15 200% text size

- Goal: no row scrolls sideways at 200% browser text size.
- Read: `spacing-layout-system.md` §13 (last case); `component-system.md` P-4, C-07, C-17; agent contract §9.
- Do: test the homepage at 200% text size at 320, 768 and 1024. Most read and the analysis rows stack, the top bar can wrap. Keep the fix small. The specs give no trigger for the analysis-row stack: do not choose one. Report what makes it stack now as `UNRESOLVED_DESIGN_SYSTEM`.
- Done: a Playwright test at 200% text size checks `scrollWidth` at each width; the report lists the open trigger question.

### R2-16 Spacing check (visual-qa only, no code)

- Goal: help tajmin judge if the gutter, column gap and section space are too tight.
- Do: full-page screenshots at 1024, 1280 and 1920 with the current tokens, then with one step up (gutter 24 to 32, column gap 24 to 32, space-module 40 to 48) set in a local CSS override that is not committed.
- Done: the screenshot pairs are in `test-results/spacing/`. tajmin decides. A token change needs tajmin's yes and a spec change first.

### R2-17 Final check

- Goal: run the run 1 final check (FL-13) again on run 2.
- Read: `spacing-layout-system.md` §13; `agent-contract.md` §10.
- Do: every §13 width and content case, both languages, both themes, axe, keyboard, the first screen at 1366x768.
- Done: a table of results in `docs/PROGRESS.md`, with each problem as a ticket fix or an `UNRESOLVED_DESIGN_SYSTEM` item.

### R2-18 Branch preview

- Goal: a preview URL of the branch for tajmin, before the pull request. Needs tajmin's go before any deploy command.
- Do: deploy `prototype-run-2` as a preview, not production. Test `/` with and without the language cookie; send `Cache-Control: private, no-store` on the redirect if needed. Links to pages that do not exist yet stay 404, or go to one "coming later" page, as tajmin chooses.
- Done: the preview URL works in both languages; tajmin opens it. If tajmin skips the preview, set this ticket to Rejected and go on.

### R2-19 Pull request

- Goal: one pull request from `prototype-run-2` into `main`.
- Do: `git fetch origin main`. If `main` moved, merge `origin/main` into the branch, fix conflicts, and run the checks again. Run `pnpm check` and the full `pnpm test:e2e`. Push. Then `gh pr create --base main --head prototype-run-2 --title "Prototype run 2: homepage"` (asks tajmin).
- PR body: what changed per ticket (one line each), the open `UNRESOLVED_DESIGN_SYSTEM` items, the R2-17 result table link, the preview URL, and test steps.
- Done: the PR URL is in `docs/PROGRESS.md`; all checks pass on the branch.

### R2-20 Code review

- Goal: Claude on GitHub reviews the whole pull request once, before the merge. It needs the Claude GitHub app on the repo (`/install-github-app` in Claude Code, once).
- Review goals:
  1. Specs: the code follows the rule IDs (COL, TYP, LAY, CPT, N). No raw values, rounded corners, card borders or shadows.
  2. Readers: both languages work, the keyboard reaches every control, and no row scrolls sideways.
  3. Bugs: no logic errors, broken imports or links, or dead code left from run 1.
  4. Tests: no test is skipped or weakened, and each section has its tests.
- Guideline: comment only with a rule ID or a clear bug. Mark each comment blocker, fix or note. No style opinions. Do not push code. A spec gap is a note marked `UNRESOLVED_DESIGN_SYSTEM` for tajmin.
- Do: tajmin comments on the PR: `@claude review this PR with the R2-20 goals and guideline in docs/SPRINT.md.`
- Done: inline comments plus one summary comment with the count per severity. tajmin can add own comments. The review does not lead to code fixes: run 2 tests the specs, so each finding goes to `docs/prototype-findings.md` as a spec gap, a spec conflict or a code issue, for the blueprint to resolve.

### R2-21 Merge into main

- Goal: run 2 is in `main`. Needs tajmin's explicit go.
- Do: `gh pr merge --merge --delete-branch` (a merge commit keeps one commit per ticket). Then `git switch main`, `git pull origin main`, and `pnpm check` on `main`. Set "Now" in `docs/PROGRESS.md` to "run 2 finished" and set the run 2 board to Done, in one commit on a short branch with its own PR, or as tajmin says.
- Done: the PR shows Merged; `main` builds and its tests pass; the branch `prototype-run-2` is deleted.
