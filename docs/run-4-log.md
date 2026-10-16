# Prototype Run 4: Ticket Log

Claude adds one row when a ticket ends (`/accept`, or Rejected). Do not change old rows.

| Column | What to write |
| --- | --- |
| Ticket | Ticket ID and title, for example `R4-01 Masthead controls and theme` |
| Started | Date the ticket went "In progress" |
| Ended | Date of `/accept` or rejection |
| Result | Done or Rejected |
| Rounds | How many times tajmin sent problems before `/accept` (0 = accepted at first handover) |
| Spec findings | `UNRESOLVED_DESIGN_SYSTEM` and spec issues found, with IDs in `docs/prototype-findings.md`, or "none" |
| Commit | Short commit hash on `prototype-run-4` |
| Note | One line, or empty |

| Ticket | Started | Ended | Result | Rounds | Spec findings | Commit | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R4-00 Setup, specs and repo docs | 2026-10-16 | 2026-10-16 | Done | 0 | none | 63ca584 | Done by the blueprint setup (DR-352): specs, sprint, docs and kit; no code change except two stale comments |
| R4-01 Masthead controls and theme | 2026-10-17 | 2026-10-17 | Done | 0 | DOC-44 | d0d35db | Ghost buttons, ThemeButton at every width, ThemeToggle and its tokens removed, type-nav, 44px NavBar row; WebKit W4-01 to W4-04 (Tab order) |
| R4-02 Motion and sticky header | 2026-10-17 | 2026-10-17 | Done | 0 | DOC-45, DOC-46, IMP-84 (flag), IMP-85 (UNRESOLVED_DESIGN_SYSTEM), IMP-86 | 076e85b | One motion 450ms ease-slide; TopBar and NavBar sticky, NavBar hides past its row (clip-path slide), logo transform; WebKit W4-05, W4-06 flaky |
| R4-03 Lists and dividers | 2026-10-17 | 2026-10-17 | Done | 0 | U-41 (UNRESOLVED_DESIGN_SYSTEM, F-1), DOC-47 (F-2), DOC-48, DOC-49, DOC-50, IMP-87 (F-3), IMP-88, IMP-89 | 0288eba | Divider.item space to the ink (per-language tokens), 1px/2px dots, column-inset in P-4 and P-3, OpinionList rule on the text column, Latest MoreLink, Latest CSS columns; WebKit W4-07 to W4-09 |
