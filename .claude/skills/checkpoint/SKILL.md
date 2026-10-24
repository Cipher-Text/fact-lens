---
name: checkpoint
description: Close a Fact Lens page or a step of it. Run the checks, update the spec log, run the reviewer, write the green items into the specs, update STATUS.md and ISSUES.md and give tajmin a report. Commit only after tajmin's yes. Use at the final checkpoint or when tajmin asks.
disable-model-invocation: true
---

# Checkpoint

Run this at the final checkpoint of the brief, or when tajmin asks. Do not run it after each checkpoint.

## 1. Checks

Run the `/verify` steps. The test files are in the brief.

## 2. Spec log

Update `docs/spec-log/<page>.md`: each reused rule, new token, new component, new rule and changed rule, with `file:line`. A changed rule is always a flag.

## 3. Review

1. Ask the `design-reviewer` subagent to review the diff against the rule IDs and to check each spec-log item (matches the diff, naming and scale, no clash, one pattern per kind). It marks each item green or red.
2. Fix every blocker. Red items go to tajmin as flags.

## 4. Specs

On the page branch, write the green items into `docs/design-system/` (the hook allows it only on a `page/` branch). Raise the version line of each changed spec and add a change-log row. Do not write red items. Then update `agent-contract.md` Section 3 if the page scope changed.

## 5. Status

Update the "Now" section of `docs/STATUS.md`. In `docs/ISSUES.md`, add a row for each new finding and flag (next free ID, the table format), and set the status of each item this work fixed. Do not delete rows.

## 6. Report and stop

Give tajmin:

- What changed (3 to 5 lines)
- Checks and results
- Spec-log items: green (written into the specs), and red (flags)
- Test steps with URLs and widths
- Items to mark: Keep, Fix now or Later

Then stop. Commit only when tajmin says so: one commit on the page branch, subject `<page>: <what>`, rule IDs on the second line, no agent attribution (`AGENTS.md` Section 9).
