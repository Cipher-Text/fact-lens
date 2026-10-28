# Fact Lens: Status

Version 1.1 · 27 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `dev`. New pages start on `page/<name>` from `dev` (`AGENTS.md` Section 9).
- Pages done: homepage (locked, DR-370, except P-5 most read: PR #14), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10) and category page `/[lang]/category/[id]` (PR #11).
- Specs in `docs/design-system/`: color 2.16, typography 2.19, layout 2.26, component-system 1.21, agent-contract 2.16.
- Homepage most read merged (PR #14, 27 Oct 2026, IMP-99): RankedList has one layout on the homepage and the category page. Full Chromium e2e on `dev`: 776 passed.
- Next page: url-format, in progress (branch page/url-format)
- Open items: `docs/ISSUES.md` (article page: IMP-100 to IMP-114, U-08; most read: U-47, DOC-56, IMP-115). The spec logs keep only open spec items.

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
