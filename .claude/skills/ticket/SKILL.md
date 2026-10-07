---
name: ticket
description: Start the next Fact Lens sprint ticket from docs/SPRINT.md and take it through plan, build, test and verify, then stop for tajmin's acceptance test.
argument-hint: "[ticket id, e.g. FL-03; default: the next To do ticket]"
disable-model-invocation: true
---

# Run one sprint ticket

The sprint is in `docs/SPRINT.md`. You do one ticket per turn of work. tajmin is the acceptance tester.

## 0. Pick the ticket

1. Read the board in `docs/SPRINT.md` and `docs/PROGRESS.md`.
2. If a ticket is "In review", do not start a new one. Tell tajmin that ticket waits for their test, and stop.
3. Take the ticket `$ARGUMENTS`. If it is empty, take the first ticket that is "To do".
4. Set it to "In progress" on the board and in "Now" in `docs/PROGRESS.md`.

## 1. Plan

1. Read the ticket: goal, acceptance criteria and original prompt. The original prompt tells you what to build.
2. Read only the spec sections that the ticket names. For a homepage section, also read its rows in `spacing-layout-system.md` Sections 7.1 to 7.4 and its role mapping in `typography-system.md` Section 7.
3. Show a short plan: the files you will make, the tests you will add, and the rule IDs that apply. Keep it to about 15 lines.
4. Continue without waiting, unless the plan needs a decision from tajmin (a spec gap or a choice the spec does not make). Then ask one clear question and wait.

## 2. Build

1. Follow `AGENTS.md`. Use the layout parts in `src/components/layout/` once they exist.
2. When a command needs permission, say in one line why you need it.
3. When a raw-value hook message comes back, fix the line before you continue.
4. Keep the work inside the ticket. Write ideas for later in `docs/PROGRESS.md` under "Later".

## 3. Test

1. Add or update the tests that the ticket needs: Playwright for each section (both languages, the test widths, axe, keyboard), Vitest for logic.
2. Do not skip, delete or loosen a test.

## 4. Verify

1. Run the `/verify` steps: `pnpm check`, `pnpm test:e2e`, and the `visual-qa` subagent when the dev server runs.
2. Ask the `design-reviewer` subagent to review the changes. Fix every blocker.
3. Check each acceptance criterion. If one is not met, fix it, or say why it cannot be met.

## 5. Hand over and stop

1. Set the ticket to "In review" on the board and in `docs/PROGRESS.md`.
2. Write a short handover:
   - What you built (3 to 5 lines)
   - Each acceptance criterion with ✅ or ❌
   - Test steps for tajmin, as a numbered list with the URLs and widths
   - Any `UNRESOLVED_DESIGN_SYSTEM` item or `DOC-` issue
3. End with: "Test the ticket, then reply with problems or type `/accept`."
4. Stop. Do not commit. Do not start the next ticket.

## When tajmin reports a problem

Fix it in the same ticket, run step 4 again, and give a new short handover. Keep the ticket "In review".
