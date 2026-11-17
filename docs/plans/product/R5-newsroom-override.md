# R5: the newsroom's reading time override (doc 24 section 4)

Owner: Codex (normal execution). Reading time steps 1 to 4 are merged. The API's news detail gives each translation `readingMinutesOverride`, `readingMinutesAuto` and `readingMinutes` (`packages/contracts/src/editorial.ts`, `newsTranslationSchema`). The translation save accepts `readingMinutesOverride` (1 to 120, or `null` to clear). Reads: `apps/newsroom/AGENTS.md` (or the root `AGENTS.md`, newsroom rules: `onSubmit` forms through `src/lib/form.ts`, colours from CSS variables), `apps/newsroom/src/components/NewsForms.tsx` (`EditableTranslation`, `TranslationEditor`, the save call near line 154), `apps/newsroom/src/app/(app)/news/[id]/page.tsx` (where each `TranslationEditor` gets its `translation` object, near line 108), `docs/24-reading-time.md` section 4.

## Goal

An editor can set a reading time for a language version, see what the calculation gives next to it, and is warned when the number they enter is far from the calculated one. Clearing the field returns to the calculation.

## Workspace

`@fact-lens/newsroom` (`apps/newsroom`).

## Files

- Edit `apps/newsroom/src/components/NewsForms.tsx`:
  - `EditableTranslation` gets `readingMinutesOverride?: number | null` and `readingMinutesAuto?: number | null`.
  - In `TranslationEditor`, add a number field after the SEO fields: label "Reading time (minutes)", `name="readingMinutesOverride"`, `min={1}`, `max={120}`, `step={1}`, `defaultValue` from `translation.readingMinutesOverride`, blank for calculated. Its hint shows "Auto: N min" from `translation.readingMinutesAuto` when that is known.
  - When the entered number differs from the auto value by more than half of the auto value, show a warning under the field (use the `Notice` primitive with kind `error`, or a plain warning line, with the same wording in the page's language as the other messages in this file).
  - The save body gains `readingMinutesOverride`: a blank field sends `null` (clears the override); a number sends that number. The field is always sent, so a save always states the override.
- Edit `apps/newsroom/src/app/(app)/news/[id]/page.tsx`: when it builds each `translation` object for `TranslationEditor`, pass `readingMinutesOverride` and `readingMinutesAuto` from the API's translation.
- Create `apps/newsroom/src/lib/reading-time.ts` with pure helpers:
  - `parseOverride(raw: string): number | null` (blank or whitespace gives `null`; otherwise the integer, or `NaN` for something that is not a number).
  - `overrideWarning(entered: number | null, auto: number | null | undefined): boolean` (true only when both are numbers and `|entered - auto| > auto / 2`).
  - `autoHint(auto: number | null | undefined): string | null` (`"Auto: N min"` or `null`).
- Create `apps/newsroom/src/lib/reading-time.test.ts` for the helpers: blank and `0`, `121`, `NaN`; the warning at exactly half and beyond; no warning without an auto value.

## Do NOT touch

The API, `packages/**`, the desk, the inbox, other panels on the news page, Playwright tests (unless one covers this form and needs its fixture updated), design tokens and component styling beyond the new field.

## Acceptance

1. The field shows the override, or blank when there is none, and the "Auto" hint.
2. Entering a number outside 1 to 120 is refused before the save (the message is shown, and the typed values are kept).
3. Saving sends `readingMinutesOverride` as a number, or `null` when blank.
4. The warning appears only when the difference exceeds half of the auto value.
5. Colours from the CSS variables only.

## Verification

```bash
pnpm --filter @fact-lens/newsroom typecheck
pnpm --filter @fact-lens/newsroom lint
pnpm --filter @fact-lens/newsroom test
pnpm --filter @fact-lens/newsroom build
```

Report the output of all four. Do not start dev servers, do not run `./run.sh`, do not commit.
