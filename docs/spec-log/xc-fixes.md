# xc-fixes spec log

Branch `task/xc-fixes` · Brief `docs/briefs/xc-fixes.md` · Issue: the 30 Oct 2026 cross-check (XC flags) · Started 30 October 2026

This log keeps what the work changes in the specs, made from the progress file at the final checkpoint. Open code items are rows in `docs/ISSUES.md`. After the merge, the log stays as the record of what the work changed in the specs; the brief and the progress file are deleted (`AGENTS.md` Section 9, step 6).

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
| XF-01 | New token | `--color-page-title-band` = `surface` in light and dark, next to `--color-bar`; PageTitle uses it as `bg-(--color-page-title-band)` (the `--color-bar` form, no `@theme` utility). Color 2.9 lists the two component color tokens; 2.1 drops the band exception note; component-system Section 6 row and CSS block; C-43 names the token | `components.css:17`, `components.css:49`, `PageTitle.tsx:32` | XC-16, DR-424, DR-425, C-43, `CPT-07`, color 2.1, 2.9 | Plan; class form: tajmin, 30 Oct 2026, "ok" (the wording of DR-425, recorded as DR-439) || green |
| XF-02 | Changed rule | C-08 `Eyebrow.separator` (`two-part`) is the CPT-10 separator: a drawn 4px square, no radius, 10px each side, centered, `aria-hidden`, in the Eyebrow color (`interactive`), outside the links so it keeps its color on hover and press. Was a muted middle dot; `--space-eyebrow-separator` retired (Section 6 row and CSS block removed) | `Eyebrow.tsx:62`, `components.css` (token removed) | XC-18, DR-435, `CPT-10`, C-08, DR-416 | Plan (DR-435) | green: CPT-10 now says "The separator takes the text color of its line" (metadata and Eyebrow; was "in the metadata text color", red at review) |
| XF-03 | Changed rule | CPT-07: a variable that only computes from named tokens is a helper with a code comment naming its sources, not a spec row. Comments on `--list-ink-start`, `--divider-item-start`, `--logo-stuck-scale`. Section 6 rows for the real tokens `--quote-mark-width` (28 / 36 / 44px), `--divider-column-inset` (16px), `--rd-anchor-size` | `components.css:129`, `components.css:513`, `components.css:599`, `components.css:58` | XC-06, DR-437, `CPT-07`, C-06, C-22 | Plan (DR-437) || green |
| XF-04 | Changed rule | C-08 `format` in the homepage region columns on every story: the category on news, বিশ্লেষণ / Analysis on analysis, as the hero (DR-417). C-15 panel and C-25 (`eyebrowMode`) name it. Amends the news part of DR-433 ("news stories show no Eyebrow") | `RegionsSection.tsx:70`, `RegionsSection.tsx:80`, `StoryListItem.tsx:46` | XC-04, DR-433, DR-417, C-08, C-15, C-25 | tajmin, 30 Oct 2026, 16:20: "Hero and region columns - analysis will be there. But label format will be: category name for news, format for analysis."; 17:01: "DR-433 needs amend. in the region column, news too show eyebrow." || green |
| XF-05 | Changed rule | C-08 sheet states the current use: the hero keeps `format` (DR-417, no code change); category More stories shows the `format` Eyebrow on analysis rows only, news rows none (DR-153, CF-07, no code change); the topic page `format` on every row | `HeroSection.tsx:34`, `MoreStoriesList.tsx:57` | DR-417, DR-153, C-08, C-24 | tajmin, 30 Oct 2026, 17:04: "Category > More Stories: if news then no eyebrow. if analysis then show eyebrow." || green |
| XF-06 | Changed rule | `CategoryFormatsSection` fixed halves: Analysis always at the start, Opinion always at the end; an empty block leaves its own half empty (an empty `div`, hidden on phones so it takes no row); both empty: no row. Layout 7B.1, 7B.3 | `CategoryFormatsSection.tsx:42`, `CategoryFormatsSection.tsx:52` | XC-11, DR-436, layout 7B.1, 7B.3, `LAY-07` | Plan (DR-436) || green |
| XF-07 | New rule | A topic page with fewer than 3 stories is `noindex, follow`; from 3 it sets no robots rule. The list pages use load more, no `?page=` (layout 7E.2). Sitemaps wait for the backend (ISSUES IMP-123) | `page.tsx:29` (topic), `seo.ts:13`; tests `seo.test.ts`, `metadata.test.ts` (generateMetadata with a mocked loader: 2 stories noindex, follow; 3 stories none; PR #22 review) | XC-02, DR-432, layout 7E | Plan (DR-432) || green |
| XF-08 | Changed rule | Layout 7B.2 Spacing: `main` starts with the title band, as 7D.2 (was `space-page-start`) | spec text only | XC-03, layout 7B.2, 7D.2, C-43 | Plan || green |
| XF-09 | Reuse | Decision citations without new text: DR-418 in 7C and on the C-08 `two-part` variant (amends DR-416); DR-419 in 7B.1; DR-420 in 7.1; DR-393 in layout Section 10. Placed at section level: the DR texts are not in this repository | spec text only | XC-05, DR-418, DR-419, DR-420, DR-393 | Plan || green |
| XF-10 | Changed rule | The homepage lock (DR-370) is lifted: the homepage changes like any page (`AGENTS.md` Section 1, agent-contract Section 3, the task skill). Agent-contract Sections 1 and 5 name the current spec versions (XC-07, DOC-57 closed) | `AGENTS.md` Section 1 | XC-17, DR-434, XC-07 | Plan (DR-434) || green |

## Flags

- XF-04 amends DR-433 (news in the region columns shows its category Eyebrow): tajmin decided it in chat (30 Oct 2026); recorded as DR-438.
- XF-05 amends DR-417 (category More stories: news rows show no Eyebrow, analysis rows the `format` Eyebrow): tajmin, 30 Oct 2026, 17:04: "Category > More Stories: if news then no eyebrow. if analysis then show eyebrow." Recorded as DR-438.
- Closed: DR-421 (mock data: the Bangladesh stories moved to their beat plus the south-asia region, domestic-only stories dropped, the mock region list is the DR-411 working list of 8) stays in the register only, no spec citation; XF-09 cites DR-418, DR-419, DR-420 and DR-393 only. tajmin, 30 Oct 2026, 17:29: "no issues. keep as it is now."
- U-53 (open flag): homepage P-4 spans the shell with no opinion, unlike the DR-436 fixed halves of the category page. tajmin: "keep this as open flag to decide later".
- U-52 closed with no change (tajmin, 30 Oct 2026, "close u-52. next"): Divider.item rule-to-ink audit at 1280, every list within about 0.3px of 16px; the first report of +4 to 5px on rows with no image was a script fault (it missed the `data-placeholder` slot, DR-338).
