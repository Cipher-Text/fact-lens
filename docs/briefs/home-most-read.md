# Brief: homepage most read, columns layout

Branch `page/home-most-read` from `dev` · Issue IMP-99 · Task file `docs/tasks/home-most-read.md` · Drafted 27 October 2026

## Goal and URL

The homepage most read section (P-5) at `/` and `/en` uses the RankedList `columns` layout of the category page (`/[lang]/category/[id]`). `columns` becomes the only RankedList layout (C-07). The code that only the grid layout used is removed.

## Section

| Section | Component | Change |
| --- | --- | --- |
| P-5 MostReadSection (homepage and category page) | C-07 RankedList | The `columns` layout only. From 1024: three equal columns, the start column empty (tajmin, 27 Oct 2026), items 1 to 3 in the middle column, 4 and 5 in the end column. 600 to 1023: two list columns across the shell. Phone: one column. No Divider.item; items `--rank-list-gap` apart; the rank in the `--color-bar` chip, centered on the title |

No other homepage section changes (DR-370 stays for everything except P-5).

## Content

The existing mock data: `getHomepage(lang).mostRead` (5 stories) and the category `mostRead`. No new data.

## Redundant code to remove

- `RankedList`: the `layout` prop, the grid branch and `data-layout`; the chip markup (inner span) always.
- `MostReadSection`: the `layout` prop and the grid branch; the three column wrapper always. `CategoryPageView`: drop `layout="columns"`.
- `Divider.tsx` and `components.css`: `dividerItemGrid` / `divider-item-grid`, `listInk.title` / `list-ink-title`, and `--list-ink-end` in `divider-item` (only RankedList set it).
- `typography.css`: the `type-rank` numeral rules of `rank-list` and the `--type-rank-*` tokens, including `--type-rank-nudge`.
- `rank-list` and `rank-list-chip` become one `rank-list` utility in `components.css`, so the chip no longer repeats `.rank-list` in its selectors to beat the `type-rank` rules.
- Unit tests: `RankedList.test.tsx` and `most-read.test.tsx` overlap; one file, one layout.

## Rules that apply

C-07, P-5 (`spacing-layout-system.md` 7.2, 7.3, 13), C-22 (Divider.item no longer in most read), `COL-02`, `COL-13`, `TYP-03`, `TYP-08`, `TYP-14`, `LAY-01`, `LAY-07`, `LAY-14`, `LAY-17`, `CPT-05`, `CPT-07`, `N-05`, DR-290. Decisions amended (task file): DR-370 (P-5 only), DR-51, DR-145, DR-299, DR-144, DR-146, DR-147, `AGENTS.md` §6 rule 11.

## Checkpoints

1. One RankedList layout: the homepage on `columns` with the empty start column; the category page unchanged.
2. Remove the redundant code above (grid CSS, `type-rank`, list ink, merged `rank-list` utility).
3. Tests: `most-read.spec.ts` for the columns layout, `small-parts.spec.ts:102` without most read, one unit test file.
4. Final: `/checkpoint`, the spec edits (C-07, typography 7.1, layout 7.2 and 13, agent contract, `AGENTS.md` rule 11), full `pnpm test:e2e:chromium`, IMP-99 closed.

## Test files

- `tests/e2e/most-read.spec.ts` (rewritten)
- `tests/e2e/small-parts.spec.ts` (C-22 rule list)
- `tests/e2e/category.spec.ts` and `tests/e2e/text-size.spec.ts` (run; change only if they assert the grid)
- The full Chromium run at the final checkpoint (the token CSS changes)
