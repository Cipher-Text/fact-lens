# Fact Lens: Status

Version 1.3 · 28 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `dev`, no page or task in progress. New pages start on `page/<name>`, other changes on `task/<name>`, both from `dev` (`AGENTS.md` Section 9).
- Pages done: homepage (locked, DR-370, except P-5 most read: PR #14), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10), category page `/[lang]/category/[id]` (PR #11), url-format (PR #15) and category-formats (PR #16).
- Specs in `docs/design-system/`: color 2.17, typography 2.20, layout 2.28, component-system 1.24, agent-contract 2.18.
- url-format (IMP-97, run 1 of 2) merged (PR #15, 28 Oct 2026): `/story/<slug>-<id>` with 301 and 404s, formats, South Asia, 8 regions, topics, C-08 `format` and `two-part`, missing translation (DR-401). Full Chromium e2e on `dev`: 806 passed.
- category-formats (IMP-118, DR-415, run 2 of 2) merged (PR #16, 28 Oct 2026): news-only main stream, the analysis and opinion row above Most read (P-3 blocks, Opinion as P-4 quote rows), More stories without opinion and repeats with the `format` Eyebrow on analysis rows, and the C-43 PageTitle `surface` band (block inset `--space-page-title-band` 24 / 32 / 40px). Full Chromium e2e on `dev`: 813 passed.
- dev-process (task) merged (PR #17, 28 Oct 2026): the progress file `docs/progress/<name>.md` as the work memory, `/task` for changes that are not a page on `task/<name>`, the spec log made from the progress file at the final checkpoint (agent-contract 2.18 Sections 3 and 11). Full Chromium e2e on `dev`: not run, by tajmin's choice; it runs after the next page (`latest`) merges.
- Open items: `docs/ISSUES.md` (article page: IMP-100 to IMP-114, U-08; most read: U-47, DOC-56, IMP-115; url-format: U-48, U-49, IMP-119; category-formats: IMP-120, IMP-121, DOC-57, DOC-58). The spec logs keep only open spec items.

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
