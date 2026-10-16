# Prototype Run 3: Report

16 October 2026 · Branch `prototype-run-3` (from `main` at `0225398`) · Written in R3-09

## Result

| Check | Result |
| --- | --- |
| `pnpm check` | Pass (lint, typecheck, unit tests, build; no warnings) |
| `pnpm test:e2e:chromium` | Pass, 591 tests, including axe |
| `pnpm test:e2e` WebKit | 42 failures, 533 pass, 16 skipped (see below) |
| `main` moved since the branch | No (`git fetch origin main`, nothing new) |
| After the merge (PR #5, 16 October 2026) | `pnpm check` and `pnpm test:e2e:chromium` ran on `prototype-run-3` and were not repeated on `main`: `main` had not moved, so the merge has the same code. Only the last two commits (docs) came after the checks |

## Tickets

R3-00 to R3-08 are Done; see `docs/run-3-log.md` for dates, rounds, findings and commits. R3-09 adds the final check and one fix (IMP-83).

## Fix found in the final check (IMP-83)

WebKit gave Latin digits for the locale `bn-BD`, so every Bangla page failed to hydrate in WebKit. The locale is now `bn-BD-u-nu-beng` in `src/lib/format.ts` and `src/lib/story-time.ts`. WebKit failures fell from 143 to 42. Chromium is unchanged.

## WebKit results (DR-289: a separate report, not a gate)

Run 2 had 40 failures. Run 3 has 42 on the same families; the list changes between runs. No test was skipped or weakened.

Counts include both languages. Kinds are from the first error line of each test.

| File | Failures | Kind |
| --- | --- | --- |
| `header.spec.ts` | 13 | Layout at 1280 and wider; SkipLink focus; drawer and search keyboard; theme storage event across tabs |
| `grouped.spec.ts` | 6 | Layout at 1280 and wider; poll keyboard |
| `regions.spec.ts` | 6 | Phone tab keys; keyboard links; axe at 360 |
| `hero.spec.ts` | 5 | Layout at 1280 and wider; keyboard links |
| `footer.spec.ts` | 3 | Hover and press timeout; keyboard order |
| `most-read.spec.ts` | 3 | Layout at 1440; keyboard links |
| `analysis-opinion.spec.ts` | 2 | Keyboard links |
| `featured.spec.ts` | 2 | Keyboard links |
| `small-parts.spec.ts` | 2 | Focus outline values |

Layout at 1280 and wider, keyboard links and focus outline repeat run 2. Not in the run 2 list: the header theme storage event, drawer and search keyboard, and `regions.spec.ts` axe at 360. Check these by hand in Safari before M2.

## 200% text and §13 widths

`text-size.spec.ts` runs at 320, 768, 1024 and 1280 in both languages: nothing scrolls sideways and story rows stack under 17.5rem (pass). The section specs run layout checks at several §13 widths in Chromium (pass). I did not check that every §13 width (for example 834 and 1180) is covered by every section.

## Open items for tajmin

`UNRESOLVED_DESIGN_SYSTEM`: U-39 (theme control icon color token), U-40 (column divider placement). Open spec issues are in `docs/prototype-findings.md`: DOC-38 to DOC-43, IMP-71 to IMP-83. Firefox is not tested (DR-341: check by hand before M2).
