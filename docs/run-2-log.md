# Prototype Run 2: Ticket Log

Claude adds one row when a ticket ends (`/accept`, or Rejected). Do not change old rows.

| Column | What to write |
| --- | --- |
| Ticket | Ticket ID and title, for example `R2-08 Hero` |
| Started | Date the ticket went "In progress" |
| Ended | Date of `/accept` or rejection |
| Result | Done or Rejected |
| Rounds | How many times tajmin sent problems before `/accept` (0 = accepted at first handover) |
| Spec findings | `UNRESOLVED_DESIGN_SYSTEM` and spec issues found, with rule IDs, or "none" |
| Commit | Short commit hash on `prototype-run-2` |
| Note | One line, or empty |

| Ticket | Started | Ended | Result | Rounds | Spec findings | Commit | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R2-00 Start the run 2 branch | 2026-10-11 | 2026-10-11 | Done | 0 | none | be6fb90 | Commit hash step (4b) added to accept skill |
| R2-01 Clean up from run 1 | 2026-10-11 | 2026-10-11 | Done | 0 | none | 1402a47 | WebKit added; sparse URL dev only |
| R2-02 Foundations CSS | 2026-10-11 | 2026-10-11 | Done | 0 | none new; KIT-05, IMP-31, IMP-32 decided | 12a1aef | Components on removed tokens fixed in R2-05 to R2-11 |
| R2-03 Mock content | 2026-10-11 | 2026-10-11 | Done | 0 | none new; IMP-33, IMP-34 added | fd30aed | Newsletter code removed in R2-11 |
| R2-04 Small parts | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-25, DOC-26; IMP-35 to IMP-38 | c6594e9 | 106 e2e tests red from before; fixed in R2-05, R2-06, R2-11, R2-12 |
| R2-05 Page chrome | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-27, DOC-28; U-31, U-32; IMP-39 to IMP-43 | 14d8235 | Flags IMP-39, IMP-40, IMP-41 stay open for tajmin's review after the tickets; 78 e2e tests red from before (R2-06, R2-11, R2-12) |
| R2-06 Ad slots and page frame | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-29; IMP-44 to IMP-46 | a0fe5d9 | 28 e2e tests red from before (`most-read`, R2-12) |
| R2-07 Story units | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-30; U-33; IMP-47, IMP-48 | dc1cc48 | Flags U-33 and IMP-48 stay open for tajmin's review after the tickets; 28 e2e tests red from before (`most-read`, R2-12) |
| R2-08 Hero (P-1) | 2026-10-11 | 2026-10-11 | Done | 2 | none new; U-33 decided by tajmin (image or placeholder) | 89c439a | Second hero top story now has an image (new mock story); placeholder in StoryImage; StoryStack, FeaturedRail, AnalysisList follow in R2-09, R2-10, R2-13; 28 e2e tests red from before (`most-read`, R2-12) |
| R2-09 Analysis and opinion (P-4) | 2026-10-11 | 2026-10-11 | Done | 1 | none new; U-34, U-35, IMP-49; U-15, U-17, IMP-21 fixed | 8d8bcd7 | Flags U-34 and U-35 stay open for tajmin's review after the tickets; mock set now 3 analysis and 5 opinion stories; 28 e2e tests red from before (`most-read`, R2-12) |
| R2-10 Featured categories (P-2) | 2026-10-11 | 2026-10-11 | Done | 2 | none new; U-18 to U-20, DOC-17, IMP-23 fixed | c570192 | Visual QA found image links taller than images: fixed with `self-start` in StoryCard; 1024 feature text column is 204px per the sheet (asked tajmin); 28 chromium e2e red from before (`most-read`, R2-12); WebKit project runs all specs and has 53 failures (keyboard, `most-read`) not compared with a baseline |
| R2-11 Grouped categories and rail (P-3) | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-31; IMP-50; U-21, U-22, U-23, U-25 fixed, U-24 partly | eec8b8d | Visual QA found 3 faults, fixed (result fill edge, no layout shift on vote, feature summaries in mock); flag IMP-50 stays open for tajmin's review after the tickets; 28 chromium e2e red from before (`most-read`, R2-12) |
| R2-12 Most read (P-5) | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-32; U-27 fixed | d554125 | MostRead rebuilt from C-07 (1/2/3/4 per row, 24px column gap, 20/24px row gap); all chromium e2e green (544); WebKit 40 failures from before (most-read layout from 1280, Safari keyboard) |
| R2-13 Regions (P-3b) | 2026-10-11 | 2026-10-11 | Done | 0 | U-36, IMP-51, IMP-52; DOC-21, U-28, U-29 fixed, IMP-27 decided | ffde232 | RegionSlider rebuilt from C-15 (2/3/4 in view, 450ms ease-slide via scrollLeft, hidden scrollbars, panel = image story + 2 stories, MoreLink to /regions); StoryStack deleted; visual QA found the phone tab strip scrollbar, fixed; flags U-36 and IMP-51 stay open for tajmin's review after the tickets; WebKit 5 regions failures from before |
| R2-14 Footer | 2026-10-11 | 2026-10-11 | Done | 0 | DOC-33; U-30 fixed | dc7d968 | SiteFooter rebuilt from C-21 (surface-elevated band with panel-inset, centered stack, ink icons, ink-secondary links, copyright line); old header button classes removed; all chromium e2e green (554); flag DOC-33 stays open for tajmin's review after the tickets (panel inset against the shell; links wrap to 3 lines at 320) |
| R2-15 200% text size | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-34; U-37 | 9c11f33 | New Chromium test with the real browser font size (32px) at 320, 768, 1024 in both languages; top bar now wraps (`min-h`); Most read stacks by the rem breakpoints; P-4 compact rows never stack (trigger open); flags DOC-34 and U-37 stay open for tajmin's review after the tickets; all chromium e2e green (560) |
| R2-16 Spacing check | 2026-10-11 | 2026-10-11 | Done | 0 | none | c25cb38 | No code. 12 screenshot pairs (bn/en at 1024, 1280, 1920; current tokens vs gutter 32, column gap 32, space-module 48 set at runtime) in `test-results/spacing/`, not committed; tajmin decides on any token change |
| R2-17 Final check | 2026-10-11 | 2026-10-11 | Done | 0 | DOC-35; DOC-23 unchanged | 3d0f137 | No code. Final check on run 2: 11 widths, bn/en, light/dark, long-headline, sparse, 200% text, axe, keyboard, first screen 1366x768; 560 chromium e2e green; design-reviewer pass; visual-qa 0 faults; dark logo contrast stays U-08; WebKit not run |
| R2-18 Branch preview | 2026-10-11 | 2026-10-11 | Done | 0 | none | af0c15e | Vercel Git integration; cookie redirect now `private, no-store` (IMP-03 done) |
