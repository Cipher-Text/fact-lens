# Reading time (product backlog item 2)

Status: built (steps 1 to 5; ADR-031). Reads: `docs/24-reading-time.md` (all sections, the rule is approved in ADR-039 and open question 25), `docs/17-architecture-decisions.md` ADR-014 (submitted revisions are locked), `apps/api/src/news/news.service.ts` (translation save at about line 301; new revision copy at about line 772, which lists the translation columns explicitly), `packages/contracts/src/news.ts` (`translationSaveSchema`, `publicNewsSchema`), `packages/contracts/src/configuration.ts` (configuration key schemas).

## Goal

Every news item shows a reading time that is the same across the API, the public site and the newsroom: calculated from the body of each language version, or the editor's override when one is set.

## The rule (doc 24, approved)

- Calculated from the body of that translation: paragraphs, headings, list items and quotes count; captions, credits, title and standfirst do not.
- Words are counted with `Intl.Segmenter(lang, { granularity: "word" })`, counting only word-like segments. Bangla punctuation (`।`) is not a word.
- Rate: words per minute per language from configuration key `reading.words_per_minute` (default `en` 230, `bn-BD` 170; a language with no rate uses the English one).
- Result: `max(1, round(words / rate))`.
- Override: `news_translation.reading_minutes_override`, a whole number from 1 to 120, `NULL` means calculated. Entering it wins. Clearing the field restores the calculation. An override is not cleared when the text changes.
- A new revision copies the override with the text.

## Tasks, in order

### R1: calculation, contracts (Claude, critical: contracts)

- `packages/contracts/src/configuration.ts`: add `reading.words_per_minute` with a value schema: an object with `en` and `bn-BD` positive integers from 50 to 600 (other language keys allowed, each 50 to 600). Add it to the configuration keys and to the seed defaults (`apps/api/src/seed/data.ts`).
- `packages/contracts/src/news.ts`: `translationSaveSchema` gets `readingMinutesOverride: z.number().int().min(1).max(120).nullish()`. `publicNewsSchema` and the public list item schema get `readingMinutes: z.number().int().min(1)`.
- Create `apps/api/src/news/reading-time.ts`: `readingMinutesFor(body, lang, wordsPerMinute)` (pure) and `effectiveReadingMinutes(calculated, override)`.
- Tests in `apps/api/src/news/reading-time.test.ts`: the six cases in doc 24 section 6 (different English and Bangla times for the same count; `।` and captions not counted; an empty body gives 1; the override wins, blank falls back, 0 and 121 are refused by the schema; a changed rate changes the result; an unknown language uses English).

### R2: migration and the revision copy (Claude, critical: migration)

- Create `apps/api/migrations/1761000000029_reading-time-override.sql` with Up and Down sections: `ALTER TABLE news_translation ADD COLUMN reading_minutes_override integer NULL CHECK (reading_minutes_override BETWEEN 1 AND 120);` and the matching drop in Down.
- `apps/api/src/news/news.service.ts` new-revision copy (about line 772): add `reading_minutes_override` to the column list of the `INSERT ... SELECT`.
- Test: a new revision keeps the override of the revision it copies.
- Run this task alone; no other migration may run in parallel.

### R3: API responses and the save path (Claude)

- Translation save (about line 301 and the update statement that follows it): write `reading_minutes_override` from the request. A submitted revision stays locked (ADR-014): the existing rule applies unchanged.
- Public news detail and the public list items return `readingMinutes`, the effective value, computed from the stored body and the configured rate.
- Newsroom news detail returns `readingMinutes` (effective), `readingMinutesOverride` and `readingMinutesAuto`.
- Tests: the public detail carries the effective value; an override changes the public value; the newsroom detail shows both numbers; a locked revision refuses a new override.

### R4: the site uses the API value (Codex)

- `apps/web/src/lib/api/adapters.ts` and `article.ts`: `readingMinutes` comes from the API field. Remove the site's own calculation (`readingMinutesFrom`) and its rate constants.
- Story cards (`storyFromListItem`) take `readingMinutes` from the list item.
- Tests cover a value from the API; the old calculation is deleted, not kept as a fallback. If the API value is missing, the page shows no reading time.

### R5: the newsroom input (Codex)

- The translation editor (`apps/newsroom/src/components/...`, the form that saves a translation) gets a "Reading time override" number field (1 to 120, blank means calculated), with a hint "Auto: N min" from `readingMinutesAuto`, and a warning when the entered number differs from the auto value by more than half.
- The form uses `onSubmit` (`src/lib/form.ts`); a failed save keeps what was typed. Colours from the CSS variables only.
- Tests for the hint and the warning logic (pure helper), and the save body including the override.

## Order

R1, then R2, then R3. R4 and R5 start after R3 and can run in parallel with each other.

## Verification

- R1 to R3: `TEST_DATABASE_URL=postgres://factlens:factlens@localhost:5432/postgres pnpm --filter @fact-lens/api test`, plus typecheck and lint for `@fact-lens/api` and `@fact-lens/contracts`.
- R2: the migration runs up and down on a scratch database (as in the card migration check).
- R4 and R5: the web and newsroom typecheck, lint, test and build.
- Before merge of R5: `pnpm check` at the root, with the test variables set.

## Risks

- A revision copy that misses the new column silently drops overrides on the next edit. R2's test is the guard.
- The rate is read from configuration. If the configuration row is missing, the defaults in the schema apply; that must be covered by a test.
