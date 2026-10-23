# Fact Lens: Progress

Version 5.0 · 18 October 2026 · Run 5 (M2 stage F0, stabilize)

Claude Code reads the "Now" section at the start of each session. `/ticket` and `/accept` keep this file current. The tickets are in `docs/SPRINT.md`, the ticket log is `docs/run-5-log.md`, and the findings are in `docs/prototype-findings.md`.

## Now

- Run: 5 (M2 stage F0, stabilize). Branch `production-run-5`, made from `origin/main` at `7430d53`.
- Ticket: none. R5-01 and R5-02 Done on 18 October 2026; run 5 has no "To do" ticket left.
- Specs in `docs/design-system/`: color 2.15, typography 2.16, layout 2.22, component-system 1.17.1, agent-contract 2.12.1.
- Tests: the run 5 test scope (`docs/SPRINT.md` "Test scope"): `pnpm check` at the end of every checkpoint; Chromium e2e on the checkpoint's "Test files" and on each test file it adds or changes; the full `pnpm test:e2e:chromium` when a checkpoint changes `src/styles/`, `src/components/layout/` or `src/i18n/`, and in R5-02. The checkpoint's spec files also run in WebKit (a report). Every run goes in the log.
- Next action: run 5 is merged (PR #7, merge commit `49ff455`, 18 October 2026); `pnpm check` and the full Chromium suite (686) pass on `main`. Next: plan the PR #7 review fixes (IMP-93 to IMP-96, DOC-51) and run 6 (`docs/SPRINT.md` "Notes for later"). Open: IMP-92; flag DOC-51, tajmin decides.

## Past runs

| Run | Dates | Result |
| --- | --- | --- |
| Run 1 | to 8 Oct 2026 | FL-01 to FL-13 Done, FL-14 (deploy) Rejected. Record: `docs/milestone-1-report.md` |
| Run 2 | 7 to 11 Oct 2026 | R2-00 to R2-21 Done (`docs/run-2-log.md`). PR #1 merged (`8863410`) |
| Run 2 audit | 12 to 13 Oct 2026 | `PROTOTYPE_RUN_2.md`, merged by PR #4 (`0225398`) |
| Run 3 | 16 Oct 2026 | R3-00 to R3-09 Done (`docs/run-3-log.md`, `docs/run-3-report.md`). PR #5 merged (`6edc410`); docs commit `0bebd07` |
| Run 3 review and design change | 16 Oct 2026 | The blueprint decided the run 3 findings and a masthead, list and divider change (DR-345 to DR-351) and updated the specs |
| Run 4 | 16 to 17 Oct 2026 | R4-00 to R4-05 Done (`docs/run-4-log.md`, `docs/run-4-report.md`). PR #6 merged (`7430d53`). Chromium e2e 660 pass; WebKit 48 failures. Real Safari checklist moves to R5-02 (A11Y-24) |
| Run 4 review | 17 Oct 2026 | The blueprint decided the run 4 findings (DR-354 to DR-359) and updated the specs |

The full run 1 and run 2 tables of this file are in git history at `0225398`; the run 3 table is at `0bebd07`; the run 4 table is at `7430d53`.

## Run 5 status

| Ticket | Status | Log row |
| --- | --- | --- |
| R5-01 | Done (18 Oct 2026) | `docs/run-5-log.md` |
| R5-02 | Done (18 Oct 2026) | `docs/run-5-log.md` |

`/accept` updates this table and the board in `docs/SPRINT.md`.

## Known state of the code at run 5 start

- `main` at `7430d53` (PR #6 merged). `pnpm check` and Chromium e2e (660 tests) passed at R4-05 (`docs/run-4-report.md`).
- WebKit has 48 failures (`docs/run-4-report.md`, `docs/webkit-failures.md`). R5-02 checks them in real Safari.
- The code still has the run 4 tokens and header: `--border` `#DDD2C4` / `#3A3D44`, the R4-03 ink tokens, `--grid-column-gap` in P-4, no `--duration-slide`, no Latest column rule, the NavBar item list wraps before hydration. R5-01 checkpoints 2 to 4 change them.

## Open items (Later)

These wait for a later phase. Run 5 keeps the current treatment. Full text: `docs/prototype-findings.md`, "Open items (Later)".

| ID | Item | Treatment until then |
| --- | --- | --- |
| U-01, U-07, IMP-41 | IA label table (category and region labels, nav labels) | Working labels in `src/i18n/`; 7 working regions |
| U-08 | Logo SVG (light and dark) | Text stand-in (C-17). The dark text logo fails axe contrast until the SVG exists |
| IMP-12, IMP-14, IMP-18, IMP-35 | Backend and section pages | Labels in `src/i18n/`; homepage anchors; URL patterns set, links go to 404 |
| IMP-45 | Ad booking | Every mock slot is booked |
| IMP-25, IMP-33 | Newsletter | Paused (DR-239); no newsletter code |

## Unresolved design-system items (run 5)

Add a row when a ticket reports `UNRESOLVED_DESIGN_SYSTEM`. Add the full entry to `docs/prototype-findings.md`.

| ID | Found | File and component | Treatment used | Status |
| --- | --- | --- | --- | --- |
| U-41 | R4-03 | `components.css` `--ink-*` tokens, `divider-item`, `list-ink-*` (C-22) | Divider.item space measured to the ink with per-language tokens | Fixed in R5-01 checkpoint 2: typography §3.1 tokens (DR-355) |
| IMP-84 | R4-02 | `ScrollOffset.tsx`, site header (C-17, LAY-15) | None: focus in the stuck bar scrolls the page to the top in Chromium | Fixed in R5-01 checkpoint 3: `scroll-margin-top` on header focusables (DR-357) |
| IMP-85 | R4-02 | `NavBar.tsx`, `components.css` `nav-row-slide` (C-18) | Full-width page-color band, items and rule in the shell | Fixed in R5-01 checkpoint 3: C-18 Surface is this treatment (DR-357) |
| DOC-51 | R5-01 | `NavBar.tsx`, `nav-row-slide` (C-18, COL-13) | None: C-18 as written; the NavBar.item focus ring is cut at its top and bottom | Open: flag, tajmin decides |
| DOC-54 | PR #9 hotfix | `reader.css` `.rd-dock` (C-35, DR-228, DR-386) | Layout §10 puts `--z-dock` (55) above `--z-overlay` (50), so the dock covered the drawer, search and share dialog. While an overlay is open the dock drops to `--z-bar` | Decided: keep the CSS rule, no spec change (tajmin, 24 Oct 2026) |
