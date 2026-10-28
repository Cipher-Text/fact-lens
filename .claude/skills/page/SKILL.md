---
name: page
description: Start a new Fact Lens page. Ask tajmin questions, draft the page brief with a short checkpoint plan, make the page branch and the progress file. Stop for tajmin's yes before you build.
argument-hint: "<page name, e.g. category>"
disable-model-invocation: true
---

# Start a page

There are no sprints or tickets. One page is one branch, one brief and one progress file (`AGENTS.md` Section 9). For a fix or a change that is not a new page, use `/task`.

## 1. Branch

1. Run `git fetch origin dev`. Make the branch: `git switch -c page/$ARGUMENTS origin/dev --no-track`.
2. If the working tree is not clean, stop and tell tajmin.
3. In `docs/STATUS.md` "Now", set the next page line to `Next page: $ARGUMENTS, in progress (branch page/$ARGUMENTS)`.

## 2. Ask

1. Read `docs/STATUS.md`, the open items in `docs/ISSUES.md` that touch the page, `agent-contract.md` Sections 1 to 4 and the spec sections that the page uses.
2. Ask tajmin the questions the brief needs: sections, content, which existing components to use, what is new. Ask them in one message. Wait for the answers.

## 3. Brief

Write `docs/briefs/$ARGUMENTS.md`, one page at most:

- Goal and URL (`/[lang]/...`)
- Sections, top to bottom, each with the existing component (`C-` ID) or "new"
- Content and mock data the page needs
- Rule IDs that apply (`COL`, `TYP`, `LAY`, `CPT`, `N`)
- Checkpoints: 3 to 6 one-line steps, for example "1. Page shell and header row"
- Test files: the e2e spec files the page adds or changes

Make `docs/progress/$ARGUMENTS.md` from `docs/progress/TEMPLATE.md`. Write tajmin's answers from step 2 into its "Decisions" section. Do not make the spec log now: `/checkpoint` makes it from the progress file.

## 4. Stop

Show the brief. Say: "Reply with changes or yes." Do not build before tajmin says yes. After the yes, the brief does not change unless tajmin asks.

## 5. While you build

Keep the progress file current (`docs/progress/TEMPLATE.md` says how). It is the memory of the work: tajmin clears the context often, and a new session knows only what the file says.
