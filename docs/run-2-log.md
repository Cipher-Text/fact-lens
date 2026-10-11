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
| R2-11 Grouped categories and rail (P-3) | 2026-10-11 | 2026-10-11 | Done | 1 | DOC-31; IMP-50; U-21, U-22, U-23, U-25 fixed, U-24 partly | pending | Visual QA found 3 faults, fixed (result fill edge, no layout shift on vote, feature summaries in mock); flag IMP-50 stays open for tajmin's review after the tickets; 28 chromium e2e red from before (`most-read`, R2-12) |
