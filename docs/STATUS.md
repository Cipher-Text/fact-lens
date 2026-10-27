# Fact Lens: Status

Version 1.1 · 27 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `dev`. New pages start on `page/<name>` from `dev` (`AGENTS.md` Section 9).
- Pages done: homepage (locked, DR-370), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10) and category page `/[lang]/category/[id]` (PR #11).
- Specs in `docs/design-system/`: color 2.16, typography 2.18, layout 2.25, component-system 1.20, agent-contract 2.15.
- Category review merged (PR #12, 27 Oct 2026): specs layout 2.25, components 1.20, contract 2.15; decisions DR-402 to DR-409. Full Chromium e2e on `dev`: 776 passed.
- Next page: home-most-read, final checkpoint done (branch page/home-most-read, IMP-99): the homepage most read uses the RankedList layout of the category page. Specs on the branch: typography 2.19, layout 2.26, component-system 1.21, agent-contract 2.16. Open flag U-47 (200% text size). Waiting for tajmin's commit and PR.
- Open items: `docs/ISSUES.md` (article page: IMP-100 to IMP-114, U-08). The spec logs keep only open spec items.

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
