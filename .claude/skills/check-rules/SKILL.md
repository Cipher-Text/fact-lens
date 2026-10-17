---
name: check-rules
description: Review changed or named files against the Fact Lens rule IDs (COL, TYP, LAY, CPT, N, DR) and report violations. Use before a commit or when the user asks whether code follows the design system.
argument-hint: "[path or git range; default: uncommitted changes]"
context: fork
agent: design-reviewer
---

Review this target against the Fact Lens design system: $ARGUMENTS

If the target is empty, review the uncommitted changes (`git diff HEAD` and new files from `git status`).

Follow your instructions as the design reviewer. Return the report table and the verdict.
