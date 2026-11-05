# <name> progress

Branch `<page|task>/<name>` · Brief `docs/briefs/<name>.md` · Issue <ID or none> · Started <date>

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: <e.g. checkpoint 2 of 4 done, waiting for "next">
- Next step: <what the next session does first>
- Open questions to tajmin: <none>
- Uncommitted: <yes/no, what>

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| | | |

## Log

### Checkpoint 1: <title> (<date>)

- Built: <one to three lines>
- Code: `<file>` (`<Symbol>`): <what changed>
- New tokens: `<name>` = <value>, scale <scale> (`CPT-07`)
- New components or parts: `<Name>` in `<file>`, sheet <C- ID or none>
- Rules used: <IDs>
- Rules that need a change: <IDs and what> (flag)
- Strings, mock data, tests: <what>
- Tweaks from tajmin: "<words>" → <what changed>
- Gaps and flags: <U- or flag, or none>
