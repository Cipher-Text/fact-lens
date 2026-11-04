# type-scale spec log

Branch `page/type-scale` · Brief none (the task came with decisions DR-454, DR-455, DR-456, tajmin, 4 Nov 2026) · Issue none · Started 4 Nov 2026

This log keeps what the work changes in the specs. Open code items are rows in `docs/ISSUES.md`. After the merge, the log stays as the record of what the work changed in the specs (`AGENTS.md` Section 9, step 6).

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
| TS-01 | Changed rule | One type scale with Tailwind 4 names, `text-xs` to `text-7xl` and `text-section`, replaces the 25 `type-*` role utilities. Steps read per-language tokens through `@theme inline` | `src/styles/typography.css` | TYP-01, TYP-04, TYP-18; typography 3.1, 8.2 | DR-454 | |
| TS-02 | Changed rule | A role is a set of classes: family, step, weight (role map) | All components that used `type-*` | typography 3.2, 7 | DR-454 | |
| TS-03 | Changed rule | New sizes: card title 20–24, list title 16–20, lead and cover 24–36, article title 26–38, page title 28–40, h2 22–30, h3 18–22, deck 16–20, summary 16 both languages | `src/styles/typography.css` | typography 3.1 | DR-454, DR-456 | |
| TS-04 | Changed rule | Body floor 17px in both languages (was 18 BN); body 18px at 1280 in both languages | `src/styles/typography.css`, `src/styles/reader.css` | TYP-11; typography 4 | DR-455 | |
| TS-05 | New token | `leading-tight` 1.2 / 1.35, `leading-relaxed` 1.5 / 1.6 | `src/styles/typography.css` | typography 3.1 | DR-454 | |
| TS-06 | New token | `text-nav` (xs EN, sm BN), `font-eyebrow` (700 / 600), `tracking-eyebrow` (0.06em / 0), `case-eyebrow` (uppercase / none) | `src/styles/typography.css` | TYP-04, DR-216, DR-346 | DR-454 | |
| TS-07 | New token | Ink inset tokens renamed `--text-lg-ink-start`, `--text-lg-ink-end`, `--text-xs-ink-end`; shares kept, to be measured again | `src/styles/typography.css`, `src/styles/components.css` | DR-355; typography 3.4 | DR-454 | |
| TS-08 | Reuse | `cn()` knows `text-section`, `text-nav`, `font-eyebrow`, `tracking-eyebrow` | `src/lib/utils.ts` | typography 3.2 | DR-454 | |
| TS-09 | Changed rule | Deck line height 1.5 / 1.6 (was 1.45 / 1.55); metadata tracking 0 (was 0.01em) | `src/styles/typography.css` | typography 3.1 | tajmin, 4 Nov 2026: "no issues" | |
| TS-10 | Reuse | Article title: `text-wrap: balance` and the `measure-article-title` cap in `.rd-title` (the code had `pretty` and no cap) | `src/styles/reader.css` | TYP-12, TYP-13 | Spec | |
| TS-11 | Reuse | Ad label at weight 600 with no uppercase, as typography 7.1 says (the code had the eyebrow 700 and uppercase) | `src/components/ads/AdSlot.tsx` | DR-216 | Spec | |

## Flags

- TS-09: confirmed by tajmin (4 Nov 2026, "no issues"), with the other shifts in the report.
- `component-system.md` still names roles as `type-<role>` in about 90 places. Typography 3.2 says to read an old name as its role. A later pass can rename them (DOC item).
