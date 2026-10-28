# Fact Lens: Status

Version 1.1 · 27 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `dev`. New pages start on `page/<name>` from `dev` (`AGENTS.md` Section 9).
- Pages done: homepage (locked, DR-370, except P-5 most read: PR #14), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10) and category page `/[lang]/category/[id]` (PR #11).
- Specs in `docs/design-system/`: color 2.16, typography 2.20, layout 2.27, component-system 1.23, agent-contract 2.16 (the url-format versions are on `page/url-format` until it merges).
- Homepage most read merged (PR #14, 27 Oct 2026, IMP-99): RankedList has one layout on the homepage and the category page. Full Chromium e2e on `dev`: 776 passed.
- url-format (IMP-97, run 1 of 2) built on `page/url-format`, final checkpoint 28 Oct 2026: `/story/<slug>-<id>` with 301 and 404s, formats, South Asia, 8 regions, topics, C-08 `format` and `two-part`, missing translation (DR-401). `pnpm check` passes; full Chromium e2e 806 passed. Not committed: waits for tajmin's yes, then the PR to `dev`.
- Next: run 2, `page/category-formats` (IMP-118, DR-415), after url-format merges.
- Open items: `docs/ISSUES.md` (article page: IMP-100 to IMP-114, U-08; most read: U-47, DOC-56, IMP-115; url-format: U-48, U-49, IMP-119, IMP-118 run 2). The spec logs keep only open spec items.

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
