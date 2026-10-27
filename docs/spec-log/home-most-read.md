# Homepage most read spec log

Branch `page/home-most-read` · Brief `docs/briefs/home-most-read.md` · Issue IMP-99 · Started 27 October 2026

The spec items of the homepage most read change. Green items go into the specs at the final checkpoint; red items are flags. Open code items are rows in `docs/ISSUES.md`.

## Kinds

| Kind | Use when |
| --- | --- |
| Reuse | An existing rule, token or component is used in a new place. Name it |
| New token | A tweak has no token step. Give the name, the value and the scale it joins (`CPT-07`) |
| New component | A part that no sheet in `component-system.md` §7 covers. Give the name per `N-01` to `N-05` |
| New rule | A behavior that no rule covers |
| Changed rule | The page needs an existing rule to change. Always a flag |

## Open items

| ID | Kind | What | Code (`file:line`) | Rule or token IDs | Source | Reviewer |
| --- | --- | --- | --- | --- | --- | --- |
| HM-01 | Changed rule | The homepage P-5 uses the RankedList `columns` layout, now the only C-07 layout: from 1024 three equal columns, the start column empty, items 1 to 3 in the middle column, 4 and 5 in the end column; 600 to 1023 two list columns across the shell; phone one column. Replaces 4 per row from 1280 and 3 at 1024 to 1279. The DR-370 homepage lock gets an exception for P-5 only | `MostReadSection.tsx:36`, `RankedList.tsx:32`, `RankedList.tsx:42` | C-07, P-5, DR-51, DR-145, DR-370, DR-403, DR-404, `LAY-07`, `AGENTS.md` §6 rule 11; layout §4, 7.2, 8 | Task file IMP-99; empty start column: tajmin, 27 Oct 2026 | green |
| HM-02 | Changed rule | No Divider.item between RankedList items: they are `--rank-list-gap` apart (24 / 28 from 600 / 32 from 1280). `divider-item-grid`, `list-ink-title` and `--list-ink-end` (only RankedList used them) are removed; `divider-item` takes the full `space-list-item` above | `components.css:442`, `components.css:504`, `Divider.tsx:13` | DR-299, C-22, DR-350, `--rank-list-gap` | Task file IMP-99 | green |
| HM-03 | Changed rule | `type-rank` is retired: the rank is the square chip of the category page (`--color-bar`, `on-interactive` serif digits, `--rank-chip-*`), centered on the title, 16px to the title. The `--type-rank-*` tokens (with `--type-rank-nudge`) and the numeral rules go; `rank-list` becomes one utility in `components.css` (was `rank-list` in `typography.css` and `rank-list-chip` in `components.css`) | `components.css:534` (`rank-list`, moved from `typography.css`; `--rank-list-gap` stays), `typography.css:135` (the `--type-rank-*` tokens, removed) | DR-144, DR-146, DR-147, DR-217, DR-290, C-07, C-11; typography 3.1, 7.1, 8; components §6 | Task file IMP-99 | green |
| HM-04 | Changed rule | 200% text size (layout §13): "Most read stacks" no longer holds. With `columns`, most read keeps two list columns from 600 at 200% text size; `text-size.spec.ts` passes (no sideways scroll). No stacking trigger chosen (`agent-contract.md` §9) | `RankedList.tsx:32` | layout §13, DR-81, `TYP-08` | checkpoint 3 | red: loosens layout §13 and the C-07 200% check with no stacking rule; needs tajmin |
| HM-05 | Reuse | `--rank-chip-size`, `--rank-chip-digit-size`, `--rank-chip-digit-weight`, `--rank-chip-ink-start`, `--rank-chip-ink-end` and `--rank-list-gap` now serve the homepage too; their usage text drops "`columns`" | `components.css:500`, `typography.css:113` | `CPT-07`, components §6, typography 3.1 | checkpoint 2 | green |
