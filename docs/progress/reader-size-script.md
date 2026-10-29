# reader-size-script progress

Branch `task/reader-size-script` · Brief `docs/briefs/reader-size-script.md` · Issue none · Started 30 Oct 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: PR 21 open; the second review fix (a comment) is uncommitted, waiting for tajmin's commit yes
- Next step: on yes, commit and push to PR 21
- Open questions to tajmin: none
- Uncommitted: yes, the comment in `src/components/reader/ReaderRoot.tsx` and this file

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 30 Oct 2026 | Steps to see the error: Bangla homepage, click the lead story, the Next.js devtools indicator shows 1 issue. The e2e test follows these steps | tajmin: "Run localhost:3000 on browser. language is bangla. click the lead story. the next.js devtool indicator button shows count 1. clicking the button loads the issue details." |
| 30 Oct 2026 | Brief approved | tajmin: "yes" |
| 30 Oct 2026 | Fix the console error "Encountered a script tag while rendering React component." | tajmin: "/task Console error :Encountered a script tag while rendering React component." |

## Log

### Diagnosis (30 Oct 2026)

- Reproduced in the dev server: `/en` → click a story link → console error. A full load of the article shows no error.
- Source: the inline `<script>` of `readerSizeScript` in `ReaderPage` (`src/components/reader/ReaderPage.tsx`). React 19.2 (`react-dom-client`, `createInstance`) warns when the client creates an executable `<script>`; data blocks (the JSON-LD in `story/[slug]/page.tsx`) are exempt. The layout scripts (`themeScript`, `storyTimeScript`) render once with the root layout and are hydrated, not created.
- Not caused by this task, seen during the check: earlier 404 responses in the console of the dev tab (a previous visit to `/en/story/foreign-secretary-kathmandu-j5obt77`). Not looked into.

### Checkpoint 1: the reader size script in the layout <head> (30 Oct 2026)

- Built: the reader size script runs once from the root layout `<head>`, only on an article path. `ReaderPage` has no inline `<script>` now.
- Code: `src/lib/reader-size.ts` (`isArticlePath`, new; `readerSizeScript` returns early when the path is not `/story/` or `/en/story/`); `src/app/[lang]/layout.tsx` (`RootLayout`: second `<script>` in `<head>` after the theme script); `src/components/reader/ReaderPage.tsx` (inline `<script>` and its import removed). After a client link, `ReaderRoot` (`useLayoutEffect`) sets the size, as before.
- New tokens: none. New components or parts: none
- Rules used: TYP-15, DR-281
- Rules that need a change: none
- Tests: `src/lib/reader-size.test.ts` (`isArticlePath`; the script sets nothing off an article; the existing script tests now run at an article path). `tests/e2e/article.spec.ts`: "the stored text size is not set on the homepage (TYP-15)" and "a click on the lead story logs no script tag error" (tajmin's steps). The second test fails on the old code (checked) and passes now.
- Results: vitest `reader-size.test.ts` 8 passed; `pnpm exec playwright test --project=chromium tests/e2e/article.spec.ts` 50 passed. In the dev browser: Bangla homepage, click on the lead story, no `console.error`, and the devtools indicator shows no issue count.
- Gaps and flags: none

### Final checkpoint (30 Oct 2026)

- `pnpm check`: passed, no warnings (unit tests 329 passed, build compiled).
- Full `pnpm test:e2e:chromium` (the root layout runs on every page): 922 passed.
- `visual-qa`: not run. The change has no visual effect; the behaviour was checked in the dev browser (tajmin's steps).
- `design-reviewer`: pass, no blockers. Note kept as is: `isArticlePath` also matches a 404 under `/story/`, so a hard load there sets `data-reader-size`; no effect, because `--reader-scale` is used only by the article type classes.
- No spec items: no spec log, no edit in `docs/design-system/`. `docs/ISSUES.md`: no row (the error had no row, and the work found nothing new).

### PR 21 review (30 Oct 2026)

- Committed 3809c86 and opened PR 21 to `dev` on tajmin's "Yes, commit" and "Push and open PR".
- claude-review: no blockers. Inline note: in "the stored text size is not set on the homepage (TYP-15)", `not.toHaveAttribute` passes at once, before hydration. Fix: the test now sets 1280 and waits for the regions slider to drop its tab roles (the page is hydrated), then checks. Chromium `article.spec.ts`: 50 passed.
- Review note not acted on: "the docs dates say 30 Oct, the session date is 29 Oct". The PR time was 29 Oct 20:03 UTC, which is 30 Oct in Dhaka, so the dates stay.
- Committed d8bb513 (the homepage test fix) and pushed, on tajmin's "Commit and push".
- Second claude-review (on d8bb513): no blockers. Note acted on: the `ReaderRoot` comment above the first `useLayoutEffect` now says the layout script sets the size on a full load, and only the effect after a client link. Inline note on `isArticlePath` inlined through `toString`: no change needed (the bot says so too).
