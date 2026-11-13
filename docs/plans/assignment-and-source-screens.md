# Plan: assignment and source screens in the newsroom

Status: **done** (T1, T2 and T3 merged). The root check on main still fails on a worker database test timeout (flaky under parallel runs, not yet fixed).

## Goal

The API already creates, completes and cancels assignments, and creates, validates, attaches and detaches sources. The newsroom news item page shows both lists read-only. This plan adds the screens that let an editor do those things from the news item page.

## Current state (checked in the code)

- `apps/api/src/news/collab.controller.ts`: all collab routes are under a class-level `@RequireAnyCapability(...editorialCapabilities)`. Attach and detach also require `news.edit`. Source creation requires `news.edit`.
- `apps/newsroom/src/app/(app)/news/[id]/page.tsx`: the "Sources" and "Assignments" panels (around lines 203 to 220) are read-only lists.
- No newsroom component calls `/news/:id/assignments`, `/news/:id/sources`, `/sources`, or `/sources/:id/validation` to write.
- Source inbox "use" flow exists (`apps/newsroom/src/components/NewsCreate.tsx`), but it is separate and not changed here.
- Pattern to follow: `apps/newsroom/src/components/InboxParts.tsx` (`useCommand`, `bff`, `submitWith`, `ui.tsx` primitives).

## Scope

In:
1. Assignment panel: list open assignments with complete and cancel buttons, and a form to create one (assignee, role, due date).
2. Source panel: attach an existing source or create a new one, detach, and validate (valid or rejected, with a reason).
3. Tests for the new components' pure logic, and `typecheck`, `lint` and `test` for the newsroom.

Out:
- Any API change, unless the decision in "Open decisions" changes it.
- Migrations. None are needed.
- Desk-queue columns for assignee and due (listed as not built in `docs/07`; separate plan).
- Source inbox changes.
- Public web (`apps/web`).

## Open decisions (need your answer before Wave 1)

1. **How to choose an assignee.** The API takes a sign-in `subject` string. No endpoint maps subjects to names, and contributors have no subject link.
   - Option A (recommended for now): a text field for the subject, with a hint. Smallest change, no API work. Poor for editors.
   - Option B: a new read-only endpoint listing people who have signed in (needs a users table or a sync from the sign-in provider). Larger, and a new API surface, so Claude owns it as a critical task.
2. **Who may assign and validate.** Resolved: no change needed. `docs/06-editorial-workflow.md` says assignments are created and cancelled by `news.review`, and sources are accepted or rejected by `news.review` or `news.fact_check`. The services enforce exactly that: `AssignmentsService.create` and `close` (for cancel, or for completing someone else's) call `requireAll(['news.review'])`, and `SourcesService.validate` calls `requireAny(['news.review', 'news.fact_check'])`. The class-level editorial guard in `collab.controller.ts` is only the outer check. (An earlier draft of this plan said otherwise; that was a misreading and is corrected here.)

The tasks below assume Option A and no API change. If you choose B, a task is added for it, owned by Claude.

## Ordering

- Wave 1: T1 (assignments). Runs alone.
- Wave 2: T2 (sources). Starts after T1 merges, because both edit the news item page.
- Wave 3: T3 (Claude, docs). After T2 merges.

Each wave is one worktree at a time, so there are no conflicting edits to `page.tsx`.

## Tasks

| ID | Task | Owner | Status |
| --- | --- | --- | --- |
| T1 | Assignment panel (create, complete, cancel) | Codex | merged (3c89a8c) |
| T2 | Source panel (attach, create, detach, validate) | Codex | merged (51a639e) |
| T3 | Update `docs/07` and `docs/22` for the new screens | Claude | merged (d4ab76c) |

Specs: [`assignment-and-source-screens/T1-assignment-panel.md`](./assignment-and-source-screens/T1-assignment-panel.md), [`T2-source-panel.md`](./assignment-and-source-screens/T2-source-panel.md).

## Verification

- Per task: `pnpm --filter @fact-lens/newsroom typecheck`, `pnpm --filter @fact-lens/newsroom lint`, `pnpm --filter @fact-lens/newsroom test`.
- Before merge: `pnpm check` at the repo root.
- No database or queue tests are needed (no API change).
- The newsroom has no browser tests (`docs/07`). After merge, Claude checks the screens by hand with `./run.sh` in the main repo, not in a worktree.

## References

- `docs/07-newsroom-application.md` (newsroom screens, "Not built" list)
- `docs/06-editorial-workflow.md` (assignments and sources in the workflow)
- `docs/22-implementation-status.md` (what is built)
- `apps/newsroom/AGENTS.md` does not exist; the root `AGENTS.md` newsroom rules apply (CSS variables, `onSubmit` forms, the API decides what a person may do).
