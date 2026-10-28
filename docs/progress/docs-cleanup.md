# docs-cleanup progress

Branch `task/docs-cleanup` · Brief `docs/briefs/docs-cleanup.md` · Issue none · Started 29 October 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: PR #19 open; spec logs restored and committed
- Next step: on tajmin's answer, make the after-merge rule keep the spec logs (or leave it), then the merge
- Open questions to tajmin: the rule text still says spec logs are deleted after the merge; change it to keep them?
- Uncommitted: no

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 29 Oct 2026 | Clean up the redundant md files of earlier runs | tajmin, chat: "I also can see redundant md files from the previous runs. plan a cleanup." |
| 29 Oct 2026 | Also delete the merged `page/` and `task/` branches, local and remote | tajmin, chat: "Yes, plus branches" |
| 29 Oct 2026 | Run the proposed plan as `/task docs-cleanup`: delete (not archive), spec-log template, fix spec references, after-merge delete rule | tajmin, chat: "yes go ahead." (to the plan with delete as the first option) |

## Log

### Checkpoint 1: delete, template, references, rule (29 Oct 2026)

- Deleted: `docs/tasks/` (`home-most-read.md`, `url-format.md`); `docs/briefs/` `category-formats`, `dev-process`, `home-most-read`, `latest`, `url-format`; `docs/progress/` `dev-process`, `latest`; `docs/spec-log/` `article`, `category`, `category-formats`, `dev-process`, `home-most-read`, `latest`, `url-format`. Their open items are rows in `docs/ISSUES.md` (U-47, U-48, U-49); LT-02 decided
- New: `docs/spec-log/TEMPLATE.md` (header, kinds, empty item table, flags; says the log is deleted after the merge)
- `.claude/skills/checkpoint/SKILL.md` step 3: the spec log is made from `TEMPLATE.md` (was the `category-formats.md` format)
- Specs, body text only: "spec log `<file>.md`" became "<Latest / most read / category formats> spec log" with the item IDs; the article and category intros name the log, not the path. `agent-contract.md` Section 3 rows (category, Latest) link the layout sections only. Version lines and changelog entries keep the old file names as history
- Versions: agent-contract 2.20 (also Section 1 table), component-system 1.26, spacing-layout 2.30 (changelog entry), `AGENTS.md` 1.10. No rule, value or token change
- New rule: `AGENTS.md` Section 9 step 6 and `agent-contract.md` Section 11 item 1: after the merge, on `dev`, run the e2e, update `STATUS.md`, delete the brief, progress file and spec log once each open item is an `ISSUES.md` row; commit and push on tajmin's yes; the specs name spec-log items by ID, never by file
- `README.md`: docs folders line says the files are for the work in progress and go after the merge
- `src/` and `tests/` comments only: `LatestPageView.tsx`, `content/types.ts`, `tests/e2e/latest.spec.ts` cite layout 7D, not `docs/briefs/latest.md`
- `docs/STATUS.md`: Branch line; spec versions; no spec log file name in the latest bullet
- Branches deleted local and remote (all in `origin/dev`, local equal to remote): `page/article-parallel`, `page/category`, `page/category-formats`, `page/category-review`, `page/latest`, `page/url-format`, `task/dev-process`. Kept: `page/category-v2` (not merged, commit caf1e9f, no PR), asked tajmin
- Spec log: none (no spec item: text and process only)
- Checks: `pnpm check` passed (320 unit tests). E2e not run: comments only in `src/` and `tests/`
- Design review (design-reviewer): pass, no blockers. Nits fixed in `AGENTS.md`: step 5 says the specs do not change after the merge (was "Nothing changes"); step 6 says its commit is the only one made on `dev` itself. Changelog names of deleted files stay as history

### PR #19 review fixes (29 Oct 2026)

- tajmin, chat, 29 Oct 2026: "check the review comment in the pr."
- `docs/STATUS.md` open items bullet: the stale "The spec logs keep only open spec items" now says open spec items are `ISSUES.md` rows and the logs of merged work are deleted
- `docs/ISSUES.md` 1.4: the intro bullet says rows are self-contained and name no log; U-47, U-48, U-49 drop "spec log HM-04 / UF-06 / UF-02"; U-49 status names layout 7B.2, not CF-07
- `agent-contract.md` Section 11 item 1 and `AGENTS.md` step 6: a deleted log stays in git history (`git log --all -- docs/spec-log/<name>.md`); the spec text keeps the meaning of each item it cites. So the CL-, CF-, LT-, HM- IDs left in the specs still resolve
- `AGENTS.md` step 4: the step 6 commit on `dev` is the one exception to "one commit per yes on the branch"
- Not changed: changelog lines that name deleted files (history, as the review allows); `STATUS.md` shows the task as in progress until the step 6 commit, as the rule says

### Spec logs restored (29 Oct 2026)

- tajmin, chat, 29 Oct 2026: "restore the spec logs and commit."
- Restored from `origin/dev`, unchanged: `docs/spec-log/` `article`, `category`, `category-formats`, `dev-process`, `home-most-read`, `latest`, `url-format`. `TEMPLATE.md` stays. The other deletions (`docs/tasks/`, the briefs, the progress files) stay deleted
- Not changed yet (open question to tajmin): the text that says spec logs are deleted after the merge: `AGENTS.md` Section 9 step 6, `agent-contract.md` Section 11 item 1, `docs/spec-log/TEMPLATE.md`, `README.md`, `docs/ISSUES.md` intro bullet, `docs/STATUS.md` open items bullet. The spec body text names the logs without paths ("Latest spec log LT-03"), which still reads right
