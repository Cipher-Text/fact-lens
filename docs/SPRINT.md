# Fact Lens Production Sprint

Version 5.0 · 18 October 2026 · Run 5 (M2 stage F0, stabilize) · Approved 18 Oct 2026 (DR-368, DR-369)

The repository `tajmin/fact-lens-web` is the production frontend (DR-361). Run 5 is stage F0 of the Production build (DR-364, `plan/production-milestone.md`): it puts the run 4 review decisions in the code, brings the specs and docs up to date, and checks the homepage in real Safari. After run 5 the homepage is frozen.

## Past runs (summary)

| Run | Dates | Result |
| --- | --- | --- |
| Run 1 | to 6 Oct 2026 | First homepage build, FL-01 to FL-13. Record: `docs/milestone-1-report.md`. |
| Run 2 | 7 to 11 Oct 2026 | Rebuilt from the component sheets, R2-00 to R2-21. PR #1. |
| Run 3 | 16 Oct 2026 | Fix run, R3-00 to R3-09. PR #5 merged (`6edc410`). |
| Run 4 | 16 to 17 Oct 2026 | Fix run, R4-00 to R4-05. PR #6 merged (`7430d53`). Chromium e2e 660 pass. Real Safari checklist open (A11Y-24). |
| Run 4 review | 17 Oct 2026 | The blueprint decided the run 4 findings. Run 5 puts these decisions in the code. |

## How it works

- Run 5 has two tickets: R5-01 docs and all fixes and changes (four checkpoints), R5-02 Safari and merge.
- Claude does one ticket at a time: plan, build, test, verify. Claude asks tajmin before a command that needs permission.
- In R5-01, Claude stops at each checkpoint and gives tajmin the checks. tajmin replies with problems or OK; Claude starts the next checkpoint after OK. Checkpoints are not committed: the ticket gets one commit at `/accept` (AGENTS.md §9.7). Do not `/clear` inside a ticket (CLAUDE.md: one ticket per conversation).
- At the end of each ticket, tajmin tests it and types `/accept`. Claude starts the next ticket only after `/accept` and a new `/ticket`.

## Run 5

Run 5 adds no new feature and no new page. Mock data only. Each R5-01 checkpoint groups fixes that share one behavior and names the decisions (DR-) and the spec sections. The decision register is not in this repository: read the rule in the spec section. If the code and the spec do not agree, the spec is correct.

### Branch

- tajmin runs `git fetch --prune origin` and checks that `origin/main` is at `7430d53` or later. Then R5-01 checkpoint 1 makes the branch `production-run-5` from `origin/main`.
- `/accept` commits each ticket on `production-run-5` and pushes that branch. Do not commit to `main` or push to `main`.
- `main` changes only in R5-02, when the pull request merges with a merge commit, on tajmin's explicit go.

### Log and findings

- `docs/run-5-log.md`: one row per ticket (dates, result, rounds of fixes, spec findings, commit, and each test run with its checkpoint: command, spec count, passed, failed, time). `/accept` adds the row in the ticket commit. Old rows do not change; add a note row.
- At the end of each ticket and checkpoint, add new findings to `docs/prototype-findings.md` with the next free ID, and set the status of the items it fixed.

### Test scope (all tickets)

- Test only what each checkpoint changes. Each ticket or checkpoint lists its checks. Add or change a test only for those checks.
- Gate at the end of every ticket and checkpoint: `pnpm check` passes. Chromium e2e runs on the checkpoint's "Test files" and on each test file it adds or changes: `pnpm exec playwright test --project=chromium <files>`. If the checkpoint changes the token CSS (`src/styles/`), the layout parts (`src/components/layout/`) or the string tables (`src/i18n/`), run the full `pnpm test:e2e:chromium`. R5-02 runs the full suite. Record every run in the log.
- Do not weaken, skip or delete a test. A test that pins an old decision changes with the decision (the checkpoint names it).
- Matrix for each check, unless the check says less: Bangla (`/`) and English (`/en`); light and dark; widths 360, 600, 768, 1024, 1280, 1440; reduced motion on and off where the check has motion; keyboard pass; axe on the changed sections (no serious or critical violation).
- Run the checkpoint's spec files in WebKit too. Record each WebKit failure in `docs/webkit-failures.md` with an ID.
- Measure, do not judge by eye: sizes, gaps and positions from `getBoundingClientRect` and computed styles, tolerance 0.5px. Ink positions from a screenshot pixel scan.
- `design-reviewer` says `Verdict: pass` for every ticket and checkpoint.

### Rules for every ticket

- Read `AGENTS.md`, `docs/design-system/agent-contract.md` Sections 5 to 9, and only the spec sections that the ticket or checkpoint names.
- If no rule answers a question, or the only fix is a workaround, or two rules disagree: report `UNRESOLVED_DESIGN_SYSTEM` with the rule IDs and ask tajmin. Do not choose a value.

## Run 5 board

| Ticket | Title | Status |
| --- | --- | --- |
| R5-01 | Docs and run 4 review fixes (4 checkpoints) | Done |
| R5-02 | Real Safari pass, final check, pull request and merge | To do |

## R5-01 Docs and run 4 review fixes

- Goal: the repo docs and specs are current, and the code follows the run 4 review decisions (DR-355 to DR-359). One ticket, four checkpoints.

### Checkpoint 1: setup, specs and repo docs

- Goal: the repo docs say production and are current; the specs are the blueprint copies before the code work (DR-354 D, DOC-42; DR-361; DR-359 DOC-50).
- Done before the run by the blueprint setup (the `protect-files` hook blocks agent writes to `docs/design-system/`): the five specs (color 2.15, typography 2.16, layout 2.22, component-system 1.17.1, agent-contract 2.12.1) and this sprint as `docs/SPRINT.md` are in the working tree, not committed.
- Do: first, before any other change, make the branch: `git switch -c production-run-5 origin/main`. The uncommitted spec copies and `docs/SPRINT.md` move with it. Check with `git branch --show-current` (prints `production-run-5`). `docs/PROGRESS.md` still shows run 4 until this checkpoint updates it; follow this sprint. Create `docs/run-5-log.md`. Fix the text below. Change only the words named. Record files keep their old text and rows: `PROTOTYPE_RUN_2.md`, `docs/run-2-log.md`, `docs/run-3-*.md`, `docs/milestone-1-report.md`, `docs/webkit-failures.md` rows. File names with "prototype" (`prototype-findings.md`) stay, so links do not break.

| File | Fix |
| --- | --- |
| `AGENTS.md` (to 1.7) | Line 3: "For the production frontend, run 5 (M2 stage F0)". "Current work": run 5, M2 stage F0 (Production build), put the run 4 review decisions (DR-355 to DR-359) in the code. §9 intro: "The goal is a simple prototype, not a full website" to "The repo is the production frontend (DR-361); each run is a small sprint". §9.7 example `R5-01: Docs and run 4 review fixes` |
| `CLAUDE.md` | Line 9: "Run 4 is a fix run" to "Run 5 is a fix run (M2 stage F0)" |
| `README.md` | Status: production frontend, run 5 (M2 stage F0) for DR-355 to DR-359; run 4 merged 17 Oct 2026 (PR #6, `7430d53`). Preview line: "test and review only; not the final hosting" (not "a prototype, not the production site"). Findings "runs 1 to 3" to "runs 1 to 4" |
| `docs/PROGRESS.md` (to 5.0) | Title "Fact Lens: Progress". Now: run 5, branch `production-run-5`, ticket R5-01. Specs: the run 5 versions. Tests: the run 5 test scope. Run 4 to "Past runs" (PR #6 merged, `7430d53`). "Run 5 status" table R5-01, R5-02. Known state at run 5 start: main `7430d53`, Chromium e2e 660 pass. Unresolved table: U-41, IMP-84, IMP-85 decided (DR-355, DR-357), code in R5-01 |
| `docs/HANDOVER.md` | Date line: start of run 5. Run 4: done and merged (PR #6, `7430d53`). Run 5: board in `docs/SPRINT.md`, log `docs/run-5-log.md`. §4 "Before R5-01" with the run 5 spec versions. "The run 4 pull request merges in R4-05" to run 5 and R5-02 |
| `docs/run-4-report.md`, `docs/run-4-log.md` | Dated note (old text stays): PR #6 merged 17 Oct 2026 (`7430d53`) on tajmin's go; the real Safari checklist moves to run 5 (A11Y-24); DOC-50: the run 4 check "24 from 600" was wrong, the spec and code are right |
| `docs/prototype-findings.md` | Next-free line (line 35): "New findings in run 5", IDs unchanged unless used. Statuses: U-41, DOC-44 to DOC-49, IMP-84, IMP-85, IMP-87, IMP-89 decided (DR-355 to DR-359) with "Code in R5-01"; DOC-50 Closed (no change); IMP-86, IMP-90 to R5-01; IMP-88 to R5-02. Change log row R5-01 |
| `.claude/skills/accept/SKILL.md` | "Run 4 status", `docs/run-4-log.md` (twice), "during run 4" to run 5 names |
| `.claude/skills/ticket/SKILL.md` | Example `R5-01` |
| `.claude/rules/components.md`, `.claude/rules/content.md`, `.claude/skills/mock-content/SKILL.md`, `.claude/agents/design-reviewer.md` | Newsletter line: "in run 5" (not "prototype run 4") |

- Checks: the version line of each spec copy matches the list above, and `sha256sum docs/design-system/*.md` matches: agent-contract `9ba718c0…`, color-system `edea4803…`, component-system `6ef7e621…`, spacing-layout-system `efaa1f42…`, typography-system `082a7f07…`. A grep of tracked `.md` files outside the record files finds no "run 4" as the current run, no `prototype-run-4`, no `R4-` example, and no "prototype" for the current repo. `pnpm check` passes. Claude gives tajmin the results; no e2e run (no file in `src/` or `tests/` changes).

### Checkpoint 2: tokens from the specs

- Read: `color-system.md` border token; `spacing-layout-system.md` §12 and P-4; `typography-system.md` §3.1; C-22.
- Do: `--border` to `#CEC7BD` light, `#494D55` dark (DR-358). Add `--duration-slide: 450ms` and use it for every slide, fade and height change (DR-357 C2). P-4 gap is `--space-analysis-gap` 32 / 48 / 64px at 768 / 1024 / 1280; the column rule stays centered (DR-356). Replace the R4-03 ink tokens in `components.css` with the typography §3.1 tokens and values (DR-355 B1).
- Tests: full Chromium run (token CSS changes).
- Checks:
  - Computed `--border` is `#CEC7BD` light and `#494D55` dark.
  - `450ms` occurs in `src/` only in the token definition (grep test); durations stay 450ms; reduced motion 0.
  - P-4 computed gap 32px at 768, 48px at 1024, 64px at 1280 and 1440; column rule centered ±0.5px.
  - Old ink token names do not occur in `src/`. Item rule space per C-22: per list median 16px ±1, each rule 16px ±3 (pixel scan; bn, en; 360, 768, 1280).

### Checkpoint 3: site header

- Read: C-17, C-18 Surface, layout §6, LAY-15, LAY-17, typography §3 logo row and §7.
- Do: header focusables get `scroll-margin-top: calc(-1 * var(--scroll-offset))` (DR-357 C1). NavBar band full width in the page color; items and rule in the shell (C4). Item list one row tall from the server HTML: `max-height: var(--nav-row-height)`, `overflow: hidden` (DR-359 IMP-90). Confirm the stuck logo uses only the transform and `typography.css` has no stuck font-size rule (DR-355 B4). Language link `type-ui-sm` 600 (DOC-44).
- Test files: `header`, `site`, `page`.
- Checks:
  - Scroll to 600px, Shift+Tab into the header with a real key press (no `preventScroll`): `scrollY` does not change; the control is visible (360, 1280, 1440).
  - NavBar (1280, 1440): band spans the viewport; first item and rule edges equal the shell edges ±0.5px.
  - Hydration (1280, 1440; `/`, `/en`): NavBar height and the top of `main` are equal with JavaScript off and after hydration; CLS 0 at load; wrapped items are not visible and not in the Tab order.
  - Stuck logo: font size unchanged; the transform gives 24px (20px on phones). Language link font matches `type-ui-sm` 600 for its `lang`.

### Checkpoint 4: Latest columns and the theme test

- Read: C-03 `HeroSection.latest`, C-22 column-inset, C-10.
- Do: Latest at 768 to 1023 stays CSS columns with a column break; add Divider.column-inset between the two columns, centered in the gap (DR-355 B3). Theme storage-event test waits until the second tab's theme button responds, then changes the theme; expected values stay (IMP-86).
- Test files: `hero`, `small-parts`, the spec with the storage-event test.
- Checks:
  - Latest column rule present at 768 and 1000, absent at 767 and 1024; 1px, border color, centered ±0.5px, 16px from the top and the bottom. Column order 1 to 3, then 4 and 5 (LAY-14). MoreLink stays at the end edge below the list.
  - Storage-event test passes with `--repeat-each=10` in Chromium.

## R5-02 Real Safari pass, final check, pull request and merge

- Goal: the homepage works in real Safari, run 5 is in `main`, and the homepage is frozen. The merge needs tajmin's explicit go.
- Decisions: DR-354 C3 (A11Y-24), DR-359 IMP-88.

### Step 1: real Safari pass

- Do: full suite in WebKit; compare with the run 4 list. Real Safari on macOS and iOS (device or Simulator), light and dark, bn and en: the R4-05 checklist (11 items, `docs/run-4-report.md`) plus the R5-01 changes. A failure that shows in Safari is a code fix; one that does not is a test fix. IMP-88: if the second Latest column starts 1 to 3px low, round the item padding to whole pixels with CSS `round()` on the ink calc, in the `divider-item` utility only. Record results in `docs/webkit-failures.md`.
- Checks: each Safari item has a result; A11Y-24 is closed or each open item has an ID.

### Step 2: final check, pull request and merge

- Do: full `pnpm test:e2e:chromium` and `pnpm check`. Write `docs/run-5-report.md`. `git fetch origin main`; merge `origin/main` into the branch if it moved. Open one PR from `production-run-5` into `main` (asks tajmin). Merge with `gh pr merge --merge --delete-branch` on tajmin's go.
- Done: `pnpm check` and the full Chromium suite pass on the branch and on `main` after the merge (both runs in the log); Safari results in the report; board Done.

## Notes for later

- Do not deploy. The preview (https://fact-lens-web-ashy.vercel.app/) is for test and review only.
- Run 6: test strategy TS-01 to TS-09 (DR-360), including the CI gate. Then F1 content contract (needs the IA phase 1 decisions).
- `/latest` and story links go to 404 until F2 and F3.
- Found in R5-01 checkpoint 1 (outside its scope, tajmin decides): "prototype" for the current repo in `AGENTS.md:47` ("Not in the prototype runs", DR-88), in `.github/workflows/claude-code-review.yml:44` ("homepage prototype (run 3, fix run)"), and in `src/` comments and strings, one shown to readers: `src/i18n/en.ts:32` "This prototype does not show search results."
