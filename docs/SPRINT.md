# Homepage Prototype Sprint

Version 3.0 · 16 October 2026 · Run 3 (fix run)

This sprint builds a simple prototype: one homepage, mock data, Bangla and English. It is not a full website.

## Past runs (summary)

| Run | Dates | Result |
| --- | --- | --- |
| Run 1 | to 6 Oct 2026 | First homepage build, tickets FL-01 to FL-13. Findings went to the blueprint as DOC-, U- and IMP- items. Record: `docs/milestone-1-report.md`. |
| Run 2 | 7 to 11 Oct 2026 | Homepage rebuilt from the component sheets, tickets R2-00 to R2-21. PR #1 merged (`8863410`). Chromium e2e passed; WebKit had 40 failures (`docs/webkit-failures.md`). Audit: `PROTOTYPE_RUN_2.md`, merged by PR #4 (`0225398`). |
| Run 2 review | 12 to 16 Oct 2026 | The blueprint decided all run 2 findings (DR-262 to DR-344) and updated the specs. Run 3 puts these decisions in the code. |

## How it works

- Claude does one ticket at a time: plan, build, test, verify.
- Claude asks tajmin before a command that needs permission.
- At the end of a ticket, Claude stops and gives tajmin the test steps.
- tajmin tests the ticket and replies with problems, or types `/accept`.
- Claude starts the next ticket only after `/accept` and a new `/ticket`. tajmin runs `/clear` between tickets.

| Command | Who | Does |
| --- | --- | --- |
| `/ticket` | tajmin | Claude starts the next ticket that is "To do" |
| `/accept` | tajmin | Claude marks the ticket "Done", commits and pushes the current branch |

## Run 3

Run 3 is a fix run. It changes the run 2 code so that it agrees with the current specs. It adds no new feature and no new page. Mock data only.

Each ticket groups fixes of the same kind. A ticket names the decisions (DR-) and the spec sections. The decision register is not in this repository: read the rule in the spec section, not the DR. If the code and the spec do not agree, the spec is correct.

### Branch

- All run 3 work happens on the branch `prototype-run-3`, made from `main` at `0225398`.
- `/accept` commits each ticket on `prototype-run-3` and pushes that branch. Do not commit to `main` or push to `main`.
- `main` changes only in R3-09, when the pull request merges with a merge commit, on tajmin's explicit go.

### Log and findings

- `docs/run-3-log.md` has one row per ticket: dates, result, rounds of fixes, spec findings and commit. `/accept` adds the row in the same commit as the ticket. A rejected ticket also gets a row.
- At the end of each ticket, add new findings to `docs/prototype-findings.md` and update the status of the items that the ticket fixed (DR-333).

### Rules for every ticket

- Read `AGENTS.md`, `docs/design-system/agent-contract.md` Sections 5 to 9, and only the spec sections that the ticket names.
- If no rule answers a question, or the only fix is a workaround, or two rules disagree: report `UNRESOLVED_DESIGN_SYSTEM` with the rule IDs and ask tajmin. Do not choose a value.
- Test in Bangla (`/`) and English (`/en`), light and dark, at the widths in `spacing-layout-system.md` §13. Run axe and a keyboard pass.
- The "Done" lines are the acceptance criteria. For every ticket also: `pnpm check` passes, `pnpm test:e2e:chromium` passes, and `design-reviewer` says `Verdict: pass`.
- Do not weaken, skip or delete a test.

### Before R3-00

The specs in `docs/design-system/` must be the 16 October versions (layout 2.18, color 2.12, typography 2.14, component-system 1.12, agent-contract 2.7). They were copied from the blueprint on 16 October 2026. Do not start R3-00 with older specs.

## Run 3 board

| Ticket | Title | Status |
| --- | --- | --- |
| R3-00 | Kit, scripts and test fixes | Done |
| R3-01 | Names and structure | Done |
| R3-02 | Header, panels and theme | Done |
| R3-03 | Dividers, gaps and panel band | Done |
| R3-04 | Story units and images | Done |
| R3-05 | DailyPoll | Done |
| R3-06 | Regions and Most read | Done |
| R3-07 | Ads | Done |
| R3-08 | Accessibility, language and footer | In review |
| R3-09 | Final check, pull request and merge | To do |

## Run 3 tickets

### R3-00 Kit, scripts and test fixes

- Goal: the tools and the base files agree with the specs before the component work.
- Decisions: DR-289, DR-309, DR-285, DR-339, DR-313, DR-324, DR-272, DR-290.
- Read: `spacing-layout-system.md` §12.5; `agent-contract.md` §4 and §10.
- Do: add the script `test:e2e:chromium`. Set the `globals.css` imports to the §12.5 order (add `shadcn/tailwind.css`, remove `tw-animate-css` and its package). Fix the tests that the decisions name. Add the mock fields `readingMinutes` and `rank`.
- Done: `pnpm check` and `pnpm test:e2e:chromium` pass; `globals.css` matches §12.5.

### R3-01 Names and structure

- Goal: component names, files and markup agree with `component-system.md` Section 3.
- Decisions: DR-286, DR-271, DR-267, DR-283, DR-326, DR-323.
- Read: `component-system.md` §3 and the sheets of the changed components.
- Do: rename RankedList, Footer parts and helpers. Add WithRail. Change the StoryCard markup and layout values and the OverlapCard `surface` prop. Remove dead code. Use `next/link` for internal links.
- Done: no old name stays in `src/` or the tests; no visual change except where a sheet requires it.

### R3-02 Header, panels and theme

- Goal: the TopBar, NavBar, drawer, search panel and theme follow the current sheets.
- Decisions: DR-280, DR-330, DR-249, DR-265, DR-322, DR-295, DR-306, DR-287, DR-269, DR-281, DR-340, DR-302, DR-331, DR-303, DR-301, DR-294.
- Read: the header sheets in `component-system.md` §7; `spacing-layout-system.md` §6.
- Do: use the shadcn Sheet (drawer) and Drawer (search). Set the TopBar min-height and wrap, the bar and nav heights, the logo type, the stuck state and the SkipLink. Theme: `.dark` class only, storage key `fl-theme`. Remove Op-ed. Fix the anchors and the moon icon. Use the §6 component tokens (`--top-bar-inset`, the switch radii, `--color-theme-control`).
- Done: both panels open, close and trap focus with the keyboard; the theme keeps its value after reload.

### R3-03 Dividers, gaps and panel band

- Goal: dividers, gaps and the panel band follow the layout spec.
- Decisions: DR-262, DR-268, DR-299, DR-300, DR-264, DR-320.
- Read: `spacing-layout-system.md` (gaps and dividers); Divider sheet (C-22).
- Do: place the item and column dividers, set the gaps, and fix the panel band. Check Safari.
- Done: dividers and gaps match the spec at every §13 width.

### R3-04 Story units and images

- Goal: story units and images follow their sheets.
- Decisions: DR-338, DR-325, DR-308, DR-297, DR-274, DR-272, DR-293, DR-279.
- Read: the StoryCard, StoryListItem, OverlapCard and StoryImage sheets.
- Do: add the image placeholder, image loading, the 17.5rem stack rule, the tokens, the time format and the reading time. Remove the Breaking label and its strings (no Breaking or Live label, COL-11).
- Done: units stack at 200% text without clipped text.

### R3-05 DailyPoll

- Goal: DailyPoll follows its sheet.
- Decisions: DR-273, DR-277, DR-298, DR-287, DR-319.
- Read: DailyPoll sheet.
- Do: fix the poll states, the panel, the stack cell and the results.
- Done: vote and results work with the keyboard and in both languages.

### R3-06 Regions and Most read

- Goal: RegionsSection and MostReadSection follow their sheets.
- Decisions: DR-284, DR-291, DR-318, DR-321, DR-290, DR-288.
- Read: the RegionsSection, RegionSlider and MostReadSection sheets.
- Do: use the 7 regions in `bn.ts`; fix the slider, the rank list and the counts per row.
- Done: the slider works with the keyboard; the rank list reads in order.

### R3-07 Ads

- Goal: ad slots follow the layout spec.
- Decisions: DR-266, DR-315, DR-296, DR-276.
- Read: `spacing-layout-system.md` §9; AdSlot sheet.
- Do: fix the ad positions, sizes, ad-inset count and order.
- Done: no two ad rows touch; the reserved height stops layout shift.

### R3-08 Accessibility, language and footer

- Goal: the heading outline, the language switch and the footer are correct.
- Decisions: DR-275, DR-270, DR-328, DR-329, DR-278, DR-314, DR-332.
- Read: `agent-contract.md` §7; Footer sheet.
- Do: fix the heading outline. Set the proxy and the `fl-lang` cookie. Fix the footer URLs and social links.
- Done: axe shows no serious or critical violation; the language choice stays after reload.

### R3-09 Final check, pull request and merge

- Goal: run 3 is checked, reviewed and in `main`. The merge needs tajmin's explicit go.
- Decisions: DR-327, DR-337, DR-341.
- Do: run the smoke run, the WebKit keyboard check, a 200% text check and the §13 final check. Write the run 3 report. `git fetch origin main`; merge `origin/main` into the branch if it moved. Open one PR from `prototype-run-3` into `main` (asks tajmin). Merge with `gh pr merge --merge --delete-branch` on tajmin's go.
- Done: `pnpm check` and `pnpm test:e2e:chromium` pass on `main`; WebKit results are in the report; the board is Done.

## Notes for later

- Do not deploy. The live preview (https://fact-lens-web-ashy.vercel.app/) is for compare only.
- `?content=sparse` works in development only.
- While the site is public, story, category, footer, `/regions` and `/latest` links go to 404.
- Plain `pnpm test:e2e` fails while the WebKit failures stay. The gate is `pnpm test:e2e:chromium`.
- Set `next/image` sizes again when real photos arrive. Add `scrollbar-gutter` if the scroll lock moves the page.
- Check VoiceOver with `role=list` on the rank list. Check the Bangla nav row when the IA labels arrive.
- Mock headlines name real countries; this is mock data only.
- Ignore the Playwright MCP caret-color hydration warning. Keep `agentRules: false`.
- The dark logo fails axe contrast until the logo SVG exists (DR-304).
- tajmin can delete the remote branches `r2-21-run-2-finished`, `add-claude-github-actions-1791724540471` and `docs/run-2-audit`.
