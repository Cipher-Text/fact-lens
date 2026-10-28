---
name: checkpoint
description: Close a Fact Lens page or task. Run the checks, make the spec log from the progress file, run the reviewer, write the green items into the specs, update STATUS.md and ISSUES.md and give tajmin a report. Commit only after tajmin's yes. Use at the final checkpoint or when tajmin asks.
disable-model-invocation: true
---

# Checkpoint

Run this at the final checkpoint of the brief, or when tajmin asks. Do not run it after each checkpoint. `<name>` is the branch name after `page/` or `task/`.

## 1. Progress

Read `docs/progress/<name>.md` and the brief. Check the progress file against `git diff origin/dev...` and the uncommitted changes: add each change that the file does not have. The progress file is the source for the next steps.

## 2. Checks

Run the `/verify` steps. The test files are in the brief.

## 3. Spec log

Make or update `docs/spec-log/<name>.md` from `docs/spec-log/TEMPLATE.md` (header, kinds, item table, flags). Take the items from the progress file: each reused rule, new token, new component, new rule and changed rule, with `file:line` from the code now. A changed rule is always a flag. Code changes that are not spec items stay in the progress file only. If the work has no spec item, make no spec log and say so in the report.

## 4. Review

1. Ask the `design-reviewer` subagent to review the diff against the rule IDs and to check each spec-log item (matches the diff, naming and scale, no clash, one pattern per kind). It marks each item green or red. With no spec log, it reviews the diff against the rule IDs only.
2. Fix every blocker. Red items go to tajmin as flags.

## 5. Specs

With no spec log, skip this step: make no edit in `docs/design-system/`, `agent-contract.md` Section 3 included. A change of page or component scope is a spec item, so it always has a spec log.

On the branch, write the green items into `docs/design-system/` (the hook allows it only on a `page/` or `task/` branch). Raise the version line of each changed spec and add a change-log row. Do not write red items. Then update `agent-contract.md` Section 3 if the scope of a page or a component changed.

## 6. Status

Update the "Now" section of `docs/STATUS.md`. In `docs/ISSUES.md`, add a row for each new finding and flag (next free ID, the table format), and set the status of each item this work fixed. Do not delete rows. In the progress file, set "Now" to "Final checkpoint done, waiting for tajmin's commit yes".

## 7. Report and stop

Give tajmin:

- What changed (3 to 5 lines)
- Checks and results
- Spec-log items: green (written into the specs), and red (flags)
- Test steps with URLs and widths
- Items to mark: Keep, Fix now or Later

Then stop. Commit only when tajmin says so: one commit on the branch, subject `<name>: <what>`, rule IDs on the second line, no agent attribution (`AGENTS.md` Section 9).
