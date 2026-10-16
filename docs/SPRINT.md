# Homepage Prototype Sprint

Version 4.0 · 16 October 2026 · Run 4 (short fix run)

This sprint builds a simple prototype: one homepage, mock data, Bangla and English. It is not a full website.

## Past runs (summary)

| Run | Dates | Result |
| --- | --- | --- |
| Run 1 | to 6 Oct 2026 | First homepage build, FL-01 to FL-13. Record: `docs/milestone-1-report.md`. |
| Run 2 | 7 to 11 Oct 2026 | Rebuilt from the component sheets, R2-00 to R2-21. PR #1. |
| Run 3 | 16 Oct 2026 | Fix run, R3-00 to R3-09. PR #5 merged (`6edc410`); docs commit `0bebd07`. Chromium e2e 591 pass; WebKit 42 failures. |
| Run 3 review and design change | 16 Oct 2026 | The blueprint decided the run 3 findings and a masthead, list and divider change. Run 4 puts these decisions in the code. |

## How it works

- Claude does one ticket at a time: plan, build, test, verify.
- Claude asks tajmin before a command that needs permission.
- At the end of a ticket, Claude stops and gives tajmin the test steps.
- tajmin tests the ticket and replies with problems, or types `/accept`.
- Claude starts the next ticket only after `/accept` and a new `/ticket`. tajmin runs `/clear` between tickets.

## Run 4

Run 4 is a short fix run. It adds no new feature and no new page. Mock data only. Each ticket groups fixes that share one behavior. A ticket names the decisions (DR-) and the spec sections. The decision register is not in this repository: read the rule in the spec section. If the code and the spec do not agree, the spec is correct.

### Branch

- tajmin runs `git fetch origin` and checks that `origin/main` is at `0bebd07` or later. Then R4-00 makes the branch `prototype-run-4` from `origin/main`.
- `/accept` commits each ticket on `prototype-run-4` and pushes that branch. Do not commit to `main` or push to `main`. Post-merge notes also go on a branch (DR-346 B7).
- `main` changes only in R4-05, when the pull request merges with a merge commit, on tajmin's explicit go.

### Log and findings

- `docs/run-4-log.md`: one row per ticket (dates, result, rounds of fixes, spec findings, commit). `/accept` adds the row in the ticket commit. Old rows do not change; add a note row.
- At the end of each ticket, add new findings to `docs/prototype-findings.md` with the next free ID, and set the status of the items the ticket fixed.

### Test scope (all tickets)

- Test only what the ticket changes. Each ticket lists its checks. Add or change a test only for those checks.
- Regression gate (from R4-03): `pnpm check` passes at the end of every ticket. Chromium e2e runs only on the ticket's "Test files" and on any test file the ticket adds or changes: `pnpm exec playwright test --project=chromium <files>`. If the ticket changes the token CSS (`src/styles/`), the layout parts (`src/components/layout/`) or the string tables (`src/i18n/`), run the full `pnpm test:e2e:chromium`. R4-05 runs the full suite. Do not weaken, skip or delete a test. A test that pins an old decision changes with the decision (the ticket names it).
- Matrix for each check, unless the check says less: Bangla (`/`) and English (`/en`); light and dark; widths 360, 600, 768, 1024, 1280, 1440; reduced motion on and off where the check has motion; keyboard pass; axe on the changed sections (no serious or critical violation).
- Run the ticket's spec files in WebKit too (`pnpm exec playwright test --project=webkit <files>`). Record each WebKit failure in `docs/webkit-failures.md` with an ID. R4-05 checks them in real Safari.
- Measure, do not judge by eye: sizes, gaps and positions are read from `getBoundingClientRect` and computed styles, with a tolerance of 0.5px. Ink positions are read from a screenshot pixel scan.
- `design-reviewer` says `Verdict: pass` for every ticket.

### Rules for every ticket

- Read `AGENTS.md`, `docs/design-system/agent-contract.md` Sections 5 to 9, and only the spec sections that the ticket names.
- If no rule answers a question, or the only fix is a workaround, or two rules disagree: report `UNRESOLVED_DESIGN_SYSTEM` with the rule IDs and ask tajmin. Do not choose a value.

## Run 4 board

| Ticket | Title | Status |
| --- | --- | --- |
| R4-00 | Setup, specs and repo docs | Done (16 Oct 2026, blueprint setup) |
| R4-01 | Masthead controls and theme | Done (17 Oct 2026) |
| R4-02 | Motion and sticky header | Done (17 Oct 2026) |
| R4-03 | Lists and dividers | To do |
| R4-04 | Words, focus and source order | To do |
| R4-05 | Safari pass, final check, pull request and merge | To do |

## Run 4 tickets

### R4-00 Setup, specs and repo docs

- Goal: the repo docs are current and the specs are the blueprint copies before the code work.
- Decisions: DR-347; DR-345 A5; the wording that DR-345, DR-348, DR-349 and DR-351 changed.
- Done on 16 Oct 2026 by the blueprint setup (DR-352); the next ticket is R4-01. tajmin runs the checks below once after `git fetch`.
- Do: make the branch. Copy the five specs from the blueprint (color 2.14, typography 2.15, layout 2.21, component-system 1.16, agent-contract 2.11). Copy this sprint to `docs/SPRINT.md` (run 3 stays as a row in "Past runs"). Create `docs/run-4-log.md`. Then fix the stale text below. Change only the words named; keep the record files (`run-3-report.md`, `run-2-log.md`, `PROTOTYPE_RUN_2.md`) as they are.

| File | Fix |
| --- | --- |
| `AGENTS.md` (to 1.6) | Header and "Current work": run 4, DR-345 to DR-351. §5 header folder: remove ThemeToggle. §6.13: the site header (TopBar and NavBar) is sticky; the NavBar hides past its row (`LAY-15`). §6.16: চীন is a region under অঞ্চলসমূহ. §6.18: remove the ThemeToggle radius exception (no exception, `CPT-05`). §8: remove the column divider gap (C-22 now places it). §9.7: commit example `R4-03: ...` |
| `CLAUDE.md` | "Run 3 is a fix run" to run 4 |
| `README.md` | Status: run 4, the fix run for DR-345 to DR-351; run 3 merged 16 Oct (PR #5). Findings "from runs 1 and 2" to "runs 1 to 3" |
| `docs/PROGRESS.md` (to 4.0) | Now: run 4, branch `prototype-run-4`. Run 3 to "Past runs" (PR #5 merged, `6edc410`). "Run 4 status" table R4-00 to R4-05. Known state at run 4 start: main `0bebd07`, Chromium e2e 591 pass, WebKit 42 failures. Unresolved table: U-39 closed (DR-349: ThemeToggle and the token removed), U-40 closed (DR-351: places set) |
| `docs/HANDOVER.md` | Run 3: done and merged (PR #5), WebKit 42. Run 4: board in `docs/SPRINT.md`, log `docs/run-4-log.md`. §4 "Before R4-00" with the run 4 spec versions. Remove "R3-00 adds this script" |
| `docs/run-3-log.md` | Add a note row: PR #5 merged (`6edc410`) on tajmin's go; docs commit `0bebd07` on `main` (DR-346 B7) |
| `docs/milestone-1-report.md` | Banner: runs 3 and 4 put the review decisions in the code |
| `docs/prototype-findings.md` | Next free IDs DOC-44, U-41, IMP-84, KIT-11. Summary rows IMP-78, IMP-79. Template heading without a real ID (not IMP-80). Change log rows R3-00 (IMP-38, IMP-59, KIT-10) and R3-08 (IMP-01, IMP-20, IMP-29, IMP-43, IMP-66, IMP-67, IMP-70). Statuses: U-24 Closed (DR-305); U-35 Fixed in R4-00; IMP-58 Fixed (DR-285 applied in run 3); IMP-65 Later (M2, DR-345); KIT-06, KIT-08, KIT-09 (kit patch applied), IMP-74 (Open, M2, no ticket); U-39 and IMP-73 Closed by DR-349; U-40 decided by DR-351 (code R4-03); each run 3 review item with its R4 ticket |
| `src/i18n/bn.ts`, `QuoteMark.tsx` | Remove the U-26 and U-35 comments |
| `.claude/rules/components.md` | Remove "The ThemeToggle switch is the one exception". DR-239 line: run 4, not run 2 |
| `.claude/rules/content.md` | চীন is a region under অঞ্চলসমূহ. Newsletter line: run 4 |
| `.claude/agents/design-reviewer.md` | Remove "(except the ThemeToggle switch)". "sticky elements other than the top bar" to "other than the site header (TopBar and NavBar)". Newsletter: run 4 |
| `.claude/agents/visual-qa.md` | Sticky check: the top ad is below the header (DR-295); the header sticks; past the NavBar row the NavBar hides and shows again at the page top |
| `.claude/skills/accept/SKILL.md` | "Run 3 status", `docs/run-3-log.md`, "during run 3", `prototype-run-3` to run 4 names |
| `.claude/skills/ticket/SKILL.md` | Example `R4-03` |
| `.claude/skills/check-rules/SKILL.md` | Description: (COL, TYP, LAY, CPT, N) |
| `.claude/skills/mock-content/SKILL.md` | Remove `breaking?: boolean` from the shape (no Breaking label, DR-279; `types.ts` has no such field). Regions are under অঞ্চলসমূহ. Newsletter line: run 4 |

- Checks: each spec copy is byte-identical to the blueprint file (`cmp`). A grep of every tracked `.md` file outside the record files finds no `ThemeToggle`, no "run 3" as the current run, no `prototype-run-3` as the current branch, no `breaking?`, and অঞ্চল only where the spec uses it. `grep` finds no `U-35` and no `U-26` comment in `src/`. The findings "next free" line matches the highest ID + 1 in each series. `pnpm check` passes.
- tajmin, outside the ticket: delete the remote branches `r2-21-run-2-finished`, `add-claude-github-actions-1791724540471`, `docs/run-2-audit` (also the local copies).

### R4-01 Masthead controls and theme

- Goal: the TopBar, NavBar and Drawer controls follow C-12, C-17, C-18 and C-19.
- Decisions: DR-349 (controls, ThemeButton, tokens, language link, NavBar row, Drawer search), DR-346 B2 and B5, DR-345 A1 (nav item).
- Read: `component-system.md` C-12, C-17 to C-19, §5 tokens; `spacing-layout-system.md` §6; `typography-system.md` §7.4 (`type-nav`); `color-system.md` theme control.
- Do: ghost IconButton for menu, search, theme and the Drawer and SearchDialog close. Remove ThemeToggle; ThemeButton at every width (MoonStar light, Sun dark). Remove `--color-theme-icon`, `--color-theme-control`, `--switch-radius`, `--switch-thumb-inset`. Language link states and height. NavBar row 44px and `type-nav` by `:lang`; remove the `lang-bn` variant. TopBar is the header landmark; SiteHeader is a fragment; NavBar is a sibling nav. Nav and Drawer item অঞ্চলসমূহ. Drawer.search icon at the field end.
- Checks:
  - Ghost buttons: 32 x 32 at 360 and 600, 36 x 36 from 768; icon 20 x 20; background transparent at rest, hover and pressed; icon color ink at rest, `interactive-hover` on hover, `interactive-pressed` when pressed; focus ring on Tab. Both themes.
  - Edge icons: the menu icon start edge and the theme icon end edge sit on the page gutter at every width (`--top-bar-inset` 16px from 768).
  - Filled slider buttons, the Drawer accordion caret and the social links stay 44 x 44.
  - ThemeButton: one button at every width; no switch track or thumb in the DOM; MoonStar in light, Sun in dark; role switch with `aria-checked` true in dark; name ডার্ক থিম on Bangla pages and the English name on `/en`; the choice stays after reload (`fl-theme`).
  - The four removed tokens and `lang-bn` do not occur in `src/` (grep test). No `border-radius` other than 0 in `src/` (CPT-05, no exception).
  - Language link: height 32 under 768, 36 from 768; ink, hover and pressed colors; end group items share one center line.
  - NavBar (1280, 1440): row 44px, 45px with the rule (the header test changes from 49 to 45); item 16px weight 600 on `/`, 14px weight 600 on `/en`.
  - Landmarks: one `header` (TopBar); NavBar is a `nav` outside it; axe landmark rules pass.
  - Nav item and Drawer item read অঞ্চলসমূহ on `/`.
  - Drawer.search (360, 600): the icon is at the field end; the placeholder and the typed text start at the start edge.

### R4-02 Motion and sticky header

- Goal: all motion is 450ms `ease-slide`; the header sticks and hides the NavBar as LAY-15 says.
- Decisions: DR-346 B1, DR-349 (sticky header, logo scale, accordion), DR-348 IMP-75.
- Read: `spacing-layout-system.md` §6, LAY-15, §12 motion tokens; C-17, C-18, C-19, C-20, C-15.
- Do: one motion (450ms `ease-slide`) for the menu Sheet, the search Drawer, the region slider and the region tab fade. Sticky TopBar and NavBar; past the nav row the NavBar slides up under the TopBar and hides, and the logo scales down; the NavBar shows again only at the page top. Drawer accordion with the shadcn Collapsible, panel height and caret animated. Button colors stay 200ms.
- Checks:
  - Computed `transition-duration` (or animation duration) 450ms and timing `cubic-bezier(0.22, 1, 0.36, 1)` on the Sheet, the Drawer, the slider track, the region tab panel, the NavBar, the logo and the accordion panel and caret. Button color transitions stay 200ms.
  - Reduced motion: each of the above has duration 0 and the end state shows at once.
  - Sticky (1280, 1440): at scroll 0 the NavBar shows and `html` has no `data-bar-stuck`. Scroll to 46px or more: `data-bar-stuck` is set, the NavBar is off screen, `inert`, and not in the Tab order; the TopBar shows its 1px bottom rule; the logo is 24px. Scroll back to 10px: the NavBar stays hidden. Scroll to 0: it shows again.
  - Under 1280: `data-bar-stuck` is set once the page scrolls; the rule shows; the logo is 24px (20px on phones).
  - No layout shift: the bar height and the top of `main` are the same before and after the hide (CLS 0 in a scripted scroll).
  - Anchors: `#hash` links stop below the bar with the NavBar hidden (`--scroll-offset`).
  - Accordion: `aria-expanded` changes; the panel height animates from 0 to its content height; keyboard Enter and Space open and close it.
  - Panels: open, close, Escape and focus trap still work with the keyboard after the motion change.

### R4-03 Lists and dividers

- Goal: list rules, column rules and the Latest link follow C-22, C-03, C-06 and P-4.
- Decisions: DR-350, DR-351.
- Read: C-22 Divider, C-03 StoryList, C-06 OpinionList, C-10 MoreLink, `HeroSection.latest`; `spacing-layout-system.md` P-3, P-4 and the column gap.
- Do: Divider.item space measured to the text ink (trim the line box). Dots 1px with a 2px gap. Divider.column-inset in P-4 from 768 and between the P-3 wrapper and rail from 1024, centered in the existing gap. OpinionList rule under the text column only; chip to list `space-section-title-after`. Latest MoreLink আরও দেখুন / See more to `/latest` (`/en/latest`).
- Test files: `hero`, `analysis-opinion`, `featured`, `grouped`, `most-read`, `story-units`, `small-parts`, `page` (`tests/e2e/<name>.spec.ts`).
- Checks:
  - Item rule space: on every list with Divider.item, the distance from the last ink row of the item above to the rule, and from the rule to the first ink row of the item below, is `space-list-item` (16px) ±1px. Screenshot pixel scan, Bangla and English, at 360, 768 and 1280.
  - Dots: rule 1px tall; computed `background-image` is `repeating-linear-gradient(to right, var(--color-border) 0 1px, transparent 1px 3px)`; both themes.
  - Column rules: present in P-4 from 768 and in P-3 from 1024; absent below those widths and between category blocks. Width 1px, border color, centered in the gap ±0.5px, 16px from the top and the bottom. The computed column gap is the same as before the change.
  - OpinionList: the rule start edge equals the text column start edge, not the quote mark; chip to the first item is 20px under 600 and 24px from 600.
  - Latest MoreLink: text আরও দেখুন on `/`, See more on `/en`; `href` `/latest` and `/en/latest`; at the end edge below the list, also in the two-column Latest at 768 to 1023. (The page is M2; a 404 is expected.)

### R4-04 Words, focus and source order

- Goal: the copy, the focus moves and the markup order follow the decided sheets.
- Decisions: DR-345 A1, A2, A6; DR-346 B3, B4; DR-348 DOC-38, DOC-39, DOC-40, IMP-78.
- Read: §3.1 and §3.3 names; C-01, C-20, C-21, C-24, C-26; P-2 and P-3b in the layout spec.
- Do: hero hidden h2 শীর্ষ খবর / Top stories; P-3b heading অঞ্চলসমূহ (own string); Footer logo `type-logo-sm`; footer year in Dhaka time; English poll heading Daily poll everywhere; after a vote focus moves to the poll h2 (`tabindex -1`); a vote with no choice does nothing; search focus to the panel, one Tab to the field, close button after the field in source; P-2 image first in the markup.
- Test files: `hero`, `regions`, `grouped`, `header`, `footer`, `featured`, `story-units`, `site`, `page` (`tests/e2e/<name>.spec.ts`).
- Checks:
  - Hero h2 text শীর্ষ খবর / Top stories, visually hidden, in the heading outline. P-3b h2 reads অঞ্চলসমূহ; `regions.spec.ts` expects it (the test that pinned অঞ্চল changes).
  - Footer logo computed font size 24px and class `type-logo-sm`.
  - Footer year: unit test with the clock at 2026-12-31T18:30Z shows 2027, and at 2026-12-31T17:59Z shows 2026.
  - "Today's poll" occurs nowhere in `src/` or the specs copy; `/en` poll h2 is Daily poll.
  - Vote with the keyboard: after the vote `document.activeElement` is the poll h2; the results are in `role=status`. Vote button with no choice: no state change, focus stays on the button, no console error.
  - Search: open it from the keyboard; focus is on the panel; one Tab reaches the field; the close button comes after the field in DOM order; Escape returns focus to the search button.
  - P-2: the image element comes before the text in DOM order; the visual order is unchanged (bounding boxes as before).
  - Story time script is 1.5 KB or less (bytes of the inline script in the built HTML).

### R4-05 Safari pass, final check, pull request and merge

- Goal: the run 4 changes work in real Safari, run 4 is reviewed and in `main`. The merge needs tajmin's explicit go.
- Decisions: DR-345 A4, DR-346 B6 and B9, DR-341.
- Do: run the full suite in WebKit and compare with the run 3 list (42). Give each new failure an ID. Check in real Safari on macOS and on iOS (device or Simulator): a failure that shows in Safari is a code fix; one that does not is a test fix. Record each result in `docs/webkit-failures.md`. Write the run 4 report. `git fetch origin main`; merge `origin/main` into the branch if it moved. Open one PR from `prototype-run-4` into `main` (asks tajmin). Merge with `gh pr merge --merge --delete-branch` on tajmin's go.
- Real Safari checks (macOS and iOS, light and dark, Bangla and English):
  - Poll vote with the keyboard and with VoiceOver: the vote works, focus goes to the h2, the result is read once (IMP-53, B3).
  - VoiceOver reads the poll legend as the group name (IMP-80).
  - `#hash` scroll in a production build (`pnpm build && pnpm start`): the target stops below the bar (IMP-76).
  - Sticky header: the NavBar hide and logo scale run once, with no flicker on the overscroll bounce at the page top; reduced motion turns them off.
  - Menu Sheet, search Drawer, region slider and accordion move at 450ms; keyboard and focus trap work.
  - Dotted rules and column rules show at 1px; item rule space looks the same as in Chromium.
  - The run 3 new WebKit failures (regions axe at 360, theme storage event across tabs, drawer and search keyboard) each have an ID and a result.
- Done: `pnpm check` and `pnpm test:e2e:chromium` pass on the branch and on `main` after the merge; the WebKit and Safari results are in the report; the board is Done.

## Notes for later

- Do not deploy. The preview (https://fact-lens-web-ashy.vercel.app/) is for compare only.
- `/latest` and story links go to 404 until M2.
- The canvas redraw (CMP-34, CMP-35), the 200% text report (A11Y-18), the newsletter and the other MVP pages come after run 4.
