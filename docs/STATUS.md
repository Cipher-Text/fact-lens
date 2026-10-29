# Fact Lens: Status

Version 1.5 · 29 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `dev`, no page or task in progress.
- Pages done: homepage (locked, DR-370, except P-5 most read: PR #14), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10), category page `/[lang]/category/[id]` (PR #11), url-format (PR #15), category-formats (PR #16) and the Latest page `/[lang]/latest` (PR #18).
- Specs in `docs/design-system/`: color 2.17, typography 2.21, layout 2.30, component-system 1.26, agent-contract 2.20.
- url-format (IMP-97, run 1 of 2) merged (PR #15, 28 Oct 2026): `/story/<slug>-<id>` with 301 and 404s, formats, South Asia, 8 regions, topics, C-08 `format` and `two-part`, missing translation (DR-401). Full Chromium e2e on `dev`: 806 passed.
- category-formats (IMP-118, DR-415, run 2 of 2) merged (PR #16, 28 Oct 2026): news-only main stream, the analysis and opinion row above Most read (P-3 blocks, Opinion as P-4 quote rows), More stories without opinion and repeats with the `format` Eyebrow on analysis rows, and the C-43 PageTitle `surface` band (block inset `--space-page-title-band` 24 / 32 / 40px). Full Chromium e2e on `dev`: 813 passed.
- dev-process (task) merged (PR #17, 28 Oct 2026): the progress file `docs/progress/<name>.md` as the work memory, `/task` for changes that are not a page on `task/<name>`, the spec log made from the progress file at the final checkpoint (agent-contract 2.18 Sections 3 and 11). Full Chromium e2e on `dev`: covered by the run after PR #18.
- latest (page) merged (PR #18, 29 Oct 2026): the Latest page `/latest` and `/en/latest` (layout 7D): news of every category, newest first, 10 then 10, the category Eyebrow; load more rows and their images fade in; story time after load more. U-51 fixed: the reused parts are `MoreStoriesSection`, `MoreStoriesList` in `components/more-stories`. Full Chromium e2e on `dev` (29 Oct 2026): 870 passed.
- docs-cleanup (task) merged (PR #19, 28 Oct 2026): the briefs, progress files and task files of merged work deleted; the spec logs are kept in `docs/spec-log/` as the record of what each work changed in the specs (AGENTS.md Section 9 step 6, agent-contract 2.20 Section 11). Full Chromium e2e on `dev`: not run yet, deferred by tajmin to after the topic page merge.
- Open items: `docs/ISSUES.md` (article page: IMP-100 to IMP-114, U-08; most read: U-47, DOC-56, IMP-115; url-format: U-48, U-49, IMP-119; category-formats: IMP-120, IMP-121, DOC-57, DOC-58; latest: IMP-122, DOC-59). Open spec items are rows there too; the spec logs in `docs/spec-log/` are the record of what each page or task changed in the specs.

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
