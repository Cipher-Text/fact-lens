---
name: accept
description: tajmin accepts the Fact Lens ticket that is In review - mark it Done, commit, push, and get ready for the next ticket.
disable-model-invocation: true
---

# Accept the ticket in review

1. Find the ticket that is "In review" in `docs/SPRINT.md`. If there is none, say so and stop.
2. Set it to "Done" on the board.
3. Update `docs/PROGRESS.md`: set the ticket in "Run 3 status" to "Done" with today's date, set "Now" to the next "To do" ticket, and keep the unresolved table current.
3a. Check `docs/prototype-findings.md`: every new finding of the ticket has an entry and a Summary row, and the items it fixed say "Fixed in <ticket id>". Add what is missing.
3b. Add the ticket's row to `docs/run-3-log.md` (ticket, dates, result, rounds, spec findings, note). Leave the Commit column as `pending`; step 4b fills it.
4. Commit all changes with the message `<ticket id>: <title>`, plus the main rule IDs on a second line (`AGENTS.md` §9.7: no `Co-Authored-By` trailer).
4b. Write the short hash of that commit into the Commit column of the row, and commit only `docs/run-3-log.md` as `<ticket id>: log commit hash`. Do not amend (an amend changes the hash).
5. Run `git branch --show-current`. If it prints `main`, stop and tell tajmin: never commit or push to `main` during run 3. Otherwise run `git push -u origin <branch>` for the current branch (`prototype-run-3`). The push asks tajmin for permission.
6. Say in two lines: what was committed, and the next ticket. Then tell tajmin to run `/clear` and then `/ticket`.

Do not start the next ticket in this turn.
