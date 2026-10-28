# Dev process spec log

Branch `task/dev-process` · Brief `docs/briefs/dev-process.md` · Progress `docs/progress/dev-process.md` · Issue none · Started 28 October 2026

This log keeps what the work changes in the specs. Open code items are rows in `docs/ISSUES.md`.

## Kinds

| Kind | Use when |
| --- | --- |
| Reuse | An existing rule, token or component is used in a new place. Name it |
| New token | A tweak has no token step. Give the name, the value and the scale it joins (`CPT-07`) |
| New component | A part that no sheet in `component-system.md` §7 covers. Give the name per `N-01` to `N-05` |
| New rule | A behavior that no rule covers |
| Changed rule | The page needs an existing rule to change. Always a flag |

## Items

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| DP-01 | Changed rule | How the contract changes: spec edits on a `page/` or `task/` branch (was `page/` only); each new token, gap or extension is logged in the progress file while building, and `/checkpoint` makes the spec log from it at the final checkpoint (was: write each change in the page spec log first) | `docs/design-system/agent-contract.md:307`, `:308`, `:309` | DR-372, `AGENTS.md` Sections 9 and 10 | tajmin, chat, 28 Oct 2026 | green: changed rule approved by tajmin in chat (28 Oct 2026) |
| DP-02 | Changed rule | Section 3 "Other page layout and components" row: build from the brief `docs/briefs/<name>.md`, log changes in the progress file, spec log made from it at the final checkpoint (was: the page spec log) | `docs/design-system/agent-contract.md:51` | DR-370 | tajmin, chat, 28 Oct 2026 | green: same approval as DP-01 |

## Flags

None open. DP-01 and DP-02 are changed rules, approved by tajmin in chat (28 Oct 2026).
