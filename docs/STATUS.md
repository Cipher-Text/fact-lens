# Fact Lens: Status

Version 1.0 · 24 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `dev`. New pages start on `page/<name>` from `dev` (`AGENTS.md` Section 9).
- Pages done: homepage (locked, DR-370) and article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10).
- Specs in `docs/design-system/`: color 2.16, typography 2.17, layout 2.24, component-system 1.19, agent-contract 2.14 (the category changes are on `page/category` until the merge).
- Category page: final checkpoint run 27 Oct 2026 on `page/category`, not committed. Spec log `docs/spec-log/category.md`: 10 green and 6 decided by tajmin (RankedList `columns`), written into layout 2.24 Section 7B, components 1.19, contract 2.14. DOC-55 closed (nudge back to dev). Part names decided (U-43); U-44 fixed; U-45 decided (Divider.rule, C-43 PageTitle; other rules move in IMP-100). U-46 closed, not fixing (tajmin). More stories is StoryCard `dated` (CL-16, CL-17 decided). Every spec-log item is green or decided. Waits for tajmin: those flags, then the commit and the PR to `dev`.
- Next: `page/home-most-read` after the merge, task file `docs/tasks/home-most-read.md` (IMP-99).
- Article page open items: `docs/spec-log/article.md`, "Later".

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
