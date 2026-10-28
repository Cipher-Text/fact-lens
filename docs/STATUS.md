# Fact Lens: Status

Version 1.2 · 28 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `page/category-formats` from `dev`. New pages start on `page/<name>` from `dev` (`AGENTS.md` Section 9).
- Pages done: homepage (locked, DR-370, except P-5 most read: PR #14), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10), category page `/[lang]/category/[id]` (PR #11) and url-format (PR #15).
- Specs in `docs/design-system/`: color 2.16, typography 2.20, layout 2.27, component-system 1.23, agent-contract 2.16 (the category-formats versions, layout 2.28, component-system 1.24 and agent-contract 2.17, are on `page/category-formats` until it merges).
- url-format (IMP-97, run 1 of 2) merged (PR #15, 28 Oct 2026): `/story/<slug>-<id>` with 301 and 404s, formats, South Asia, 8 regions, topics, C-08 `format` and `two-part`, missing translation (DR-401). Full Chromium e2e on `dev`: 806 passed.
- category-formats (IMP-118, DR-415, run 2 of 2) built on `page/category-formats`, final checkpoint 28 Oct 2026: news-only main stream, the analysis and opinion row above Most read (P-3 blocks, Opinion as P-4 quote rows), More stories without opinion and repeats with the `format` Eyebrow on analysis rows, and the PageTitle `surface` band (U-50 approved), block inset `--space-page-title-band` 24 / 32 / 40px. PR #16 open; review fixes not committed yet.
- Open items: `docs/ISSUES.md` (article page: IMP-100 to IMP-114, U-08; most read: U-47, DOC-56, IMP-115; url-format: U-48, U-49, IMP-119; category-formats: IMP-118, IMP-120, IMP-121, DOC-57, DOC-58). The spec logs keep only open spec items.

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
