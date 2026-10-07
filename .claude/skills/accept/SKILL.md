---
name: accept
description: tajmin accepts the Fact Lens ticket that is In review - mark it Done, commit, push, and get ready for the next ticket.
disable-model-invocation: true
---

# Accept the ticket in review

1. Find the ticket that is "In review" in `docs/SPRINT.md`. If there is none, say so and stop.
2. Set it to "Done" on the board.
3. Update `docs/PROGRESS.md`: add a row to "Done" with today's date, set "Now" to the next "To do" ticket, and keep the unresolved and DOC- tables current.
4. Commit all changes with the message `<ticket id>: <title>`, plus the main rule IDs on a second line.
5. Push to `origin main`. The push asks tajmin for permission.
6. Say in two lines: what was committed, and the next ticket. Then tell tajmin to run `/clear` and then `/ticket`.

Do not start the next ticket in this turn.
