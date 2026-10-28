---
name: task
description: Start a Fact Lens fix or change that is not a new page, for example a UI piece, typography, a token, a component or an open issue. With an issue ID it reads the row in docs/ISSUES.md; without one, tajmin says what to change and where. Makes the task branch, a short brief and the progress file, then stops for tajmin's yes.
argument-hint: "[issue ID, e.g. IMP-120] [what to change and where]"
disable-model-invocation: true
---

# Start a task

A task is one branch, one short brief and one progress file, like a page (`AGENTS.md` Section 9). Use `/page` for a new page.

`$ARGUMENTS` can be:

- an issue ID (`IMP-`, `U-`, `DOC-`, `T-` and the others in `docs/ISSUES.md`), with or without more words
- only words: what to change and where, for example "headline size on the story card in English"
- empty: ask tajmin what to change and where, then go on

## 1. Understand

1. If there is an issue ID, read its row in `docs/ISSUES.md`. If there is no such row, tell tajmin and stop.
2. Find the code and the specs the change touches: the components, `src/styles/`, the sheets in `component-system.md` Section 7, and the rule IDs. Read `agent-contract.md` Sections 1 to 4 and only the spec sections that the change needs.
3. If the change touches the homepage, it is locked (`DR-370`, except P-5 most read). Say so in the questions; do not plan the change without tajmin's yes.

## 2. Name and branch

1. Name: the issue ID in lower case, then 2 to 4 words in kebab case, for example `imp-120-format-hub-links`. Without an ID, only the words, for example `english-card-headline`.
2. If the working tree is not clean, stop and tell tajmin.
3. Run `git fetch origin dev`. Make the branch: `git switch -c task/<name> origin/dev`.
4. In `docs/STATUS.md` "Now", add the line `Task: <name>, in progress (branch task/<name>)`.

## 3. Ask

Ask only what the code, the specs and the issue row do not answer: the scope, which widths, languages and pages, the values to use. Ask in one message and wait. If nothing is open, say so and go to step 4.

## 4. Brief

Write `docs/briefs/<name>.md`, half a page at most:

- Goal: what changes, and the issue ID if there is one
- Where: pages, URLs, components (`C-` IDs), files
- Rule IDs that apply (`COL`, `TYP`, `LAY`, `CPT`, `N`, `DR`)
- Checkpoints: 1 to 6 one-line steps. A small fix has one
- Test files: the e2e and unit test files the task adds or changes, and the existing ones that cover the change

Make `docs/progress/<name>.md` from `docs/progress/TEMPLATE.md`. Write tajmin's words from the request and the answers into its "Decisions" section.

## 5. Stop

Show the brief. Say: "Reply with changes or yes." Do not change code before tajmin says yes.

## 6. Build

Then work as for a page (`AGENTS.md` Section 9, steps 2 to 7): one checkpoint at a time, keep the progress file current before you stop, `/checkpoint` at the final checkpoint, and commit only on tajmin's yes. With one checkpoint, it is also the final one.
