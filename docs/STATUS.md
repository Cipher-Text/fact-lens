# Fact Lens: Status

Version 1.0 · 24 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `dev`. New pages start on `page/<name>` from `dev` (`AGENTS.md` Section 9).
- Pages done: homepage (locked, DR-370), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10) and category page `/[lang]/category/[id]` (PR #11).
- Specs in `docs/design-system/`: color 2.16, typography 2.18, layout 2.25, component-system 1.20, agent-contract 2.15 (layout, components and contract on `page/category-review` until the merge).
- Category review (`page/category-review`, 27 Oct 2026): specs, code and the decision register cross-checked; tajmin decided every flag. Specs updated (C-02 `feature`, Section 3.1 and 6, LAY-07 and 7B amend DR-44, DR-398 amended). Report: `docs/reviews/category-review.md`. New DRs to add to the register: drafts DR-402 to DR-409 in the report. Waits for tajmin: the commit and the PR to `dev`.
- Next: `page/home-most-read` after the merge, task file `docs/tasks/home-most-read.md` (IMP-99).
- Article page open items: `docs/spec-log/article.md`, "Later".

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
