# Task: replace the homepage RankedList with the columns layout

Status: Waiting for the `page/category` merge · Issue: IMP-99 · Asked by tajmin, 27 October 2026

This is a task file, not a brief. Start the work with `/page home-most-read` after `page/category` is merged into `dev`. The brief (`docs/briefs/home-most-read.md`) is drafted from this file (`AGENTS.md` Section 9).

## Goal

The homepage most read section (P-5) uses the RankedList `columns` layout of the category page, not the grid layout. `columns` becomes the only RankedList layout.

The `columns` layout as built on `page/category` (`docs/briefs/category.md`, section 6; spec log CL-10, CL-12, CL-18, CL-21, CL-22):

- From 1024: three equal columns; the start column stays empty, items 1 to 3 in the middle column, items 4 and 5 in the end column. 600 to 1023: two list columns across the shell. Phone: one column.
- No Divider.item between items; the items are `--rank-list-gap` apart, and the tops of the two columns line up.
- The rank is a square chip in `--color-bar` with `on-interactive` serif digits, centered on the whole title.

## Branch

`page/home-most-read` from `dev`. A `page/` branch, because the spec hook allows spec edits only there (`AGENTS.md` Section 10).

## Decisions to amend

The decision register is not in this repository; the blueprint thread records the new decisions.

| Decision | Now | After |
| --- | --- | --- |
| DR-370 | The homepage is locked | Exception for P-5 most read only |
| DR-51, DR-145 | 4 per row from 1280, 3 at 1024 to 1279 | The `columns` layout above |
| DR-299 | Divider.item between items in a column | No rule in RankedList; `--rank-list-gap` |
| DR-144, DR-146, DR-147 | `type-rank` numeral, interactive, with `--type-rank-nudge` | The rank chip; `type-rank` is retired |
| `AGENTS.md` §6 rule 11 | "Most read is a numbered list: 4 per row from 1280px, 3 at 1024–1279px" | The `columns` layout |

## Open question for tajmin

Does the homepage keep the empty start column from 1024, as the category page does, or do the two list columns span the full shell?

## Work

1. Code
   - `src/components/home/most-read/RankedList.tsx`: remove the `layout` prop and the grid branch; `columns` is the only layout.
   - `src/components/home/most-read/MostReadSection.tsx`: remove the `layout` prop; apply the answer to the open question.
   - `src/components/category/CategoryPageView.tsx`: drop `layout="columns"`.
   - `src/styles/typography.css`: remove the `rank-list` numeral styles and the `--type-rank-*` tokens (including `--type-rank-nudge`) if nothing else uses them.
   - `src/styles/components.css`: remove `dividerItemGrid` and the RankedList grid rules if nothing else uses them.
2. Tests
   - `tests/e2e/most-read.spec.ts`: rewrite the homepage layout tests for the `columns` layout (both languages, the validation widths, the column tops, the chip).
   - `tests/e2e/small-parts.spec.ts:102`: most read has no rules any more, so take it out of the C-22 rule list. This follows the DR-299 change; it is not a loosened test.
   - `src/components/home/most-read/most-read.test.tsx`: one layout only.
3. Specs (at the final checkpoint, from the green spec-log items)
   - `component-system.md` C-07: one layout, the chip, the tokens in Section 6.
   - `typography-system.md` 7.1: retire `type-rank`.
   - `spacing-layout-system.md` 7.2 (P-5 row) and 13 (200% text size: most read stacks).
   - `agent-contract.md`: rule index and Section 3.
   - `AGENTS.md` §6 rule 11.

## Done when

- `pnpm check` and the full `pnpm test:e2e:chromium` pass (the token CSS changes).
- The homepage and the category page show the same RankedList at every validation width, in Bangla and English, light and dark, and at 200% text size.
- U-42 and DOC-55 are closed in `docs/ISSUES.md`.
