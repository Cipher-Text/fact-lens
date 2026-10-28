# URL format spec log

Branch `page/url-format` · Brief `docs/briefs/url-format.md` · Task file `docs/tasks/url-format.md` · Started 28 October 2026

The specs for this run are already written on the branch (commit b4c6139: layout 2.27 Section 7C, component-system 1.22, typography 2.20). This log keeps what the build adds or finds wrong. Open code items are rows in `docs/ISSUES.md`.

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
| UF-01 | Reuse | C-08 Eyebrow `format` mode: on an analysis story in a mixed list, বিশ্লেষণ / Analysis, a link to `/analysis`; other stories keep the category. Label from `analysisOpinion.analysis` (no new key) | `src/components/story/Eyebrow.tsx:72`, `src/components/home/hero/HeroSection.tsx:34`, `:45` | C-08, DR-417, `N-05` | checkpoint 3 || green |
| UF-02 | New rule | `format` mode shows only where a mixed list already shows an Eyebrow: the hero lead and top stories. Region columns and More stories stay without an Eyebrow; Read next (article page) keeps `category` (tajmin, 28 Oct 2026) | `src/components/home/regions/RegionsSection.tsx:67`, `src/components/reader/ArticleParts.tsx:245` | C-08, DR-153, DR-370, DR-417 | checkpoint 3 || red: the C-08 sheet also names region columns and More stories; open flag, U-49 |
| UF-03 | Reuse | C-08 `two-part` on the article heading: format link, `·` separator (`ink-muted`, `aria-hidden`), category link; news shows the category only. Text links, no filled button. The separator stays with the first part when the row wraps | `src/components/story/Eyebrow.tsx:46`, `src/components/reader/ReaderPage.tsx:71` | C-08, C-27, DR-416, `COL-06`, `COL-13` | checkpoint 5 || green |
| UF-04 | New token | `--space-eyebrow-separator: 0.5rem` (8px), the inline gap on each side of the `Eyebrow.separator`; joins the component spacing tokens of Section 6 (the Eyebrow-to-title step). Approved by tajmin, 28 Oct 2026 | `src/styles/components.css:14` | `CPT-07`, C-08 | checkpoint 5 || green |
| UF-05 | Reuse | SL-22 done: `.rd-kicker` becomes `.rd-category` (the part `ArticleHeader.category`); `.rd-cat` (the DR-389 button) removed. The Eyebrow sets the type | `src/styles/reader.css:138` | `N-05`, C-27, SL-22 | checkpoint 5 || green |
| UF-06 | New component | `MissingTranslationNote`: one neutral `type-ui-sm` `ink-secondary` line above the category page title, shown with `?only=<lang>` after the switch from an article in one language. No sheet covers it (gap, `AGENTS.md` Section 8) | `src/components/category/MissingTranslationNote.tsx:25` | DR-401, layout 7C, `TYP-14`, `N-01` | checkpoint 2 || red: gap, U-48; `pb-4` replaced by `--space-module` |
| UF-07 | Reuse | `formatHref(lang, format)` for the hub links `/analysis` and `/opinion` | `src/components/story/links.ts:40` | layout 7C, DR-414 | checkpoint 3 || green |

## Flags

| ID | What | Proposal | Rule IDs | Status |
| --- | --- | --- | --- | --- |
| UF-02 | The code uses C-08 `format` on the hero lead and top stories only. The sheet also names region columns and More stories, which show no Eyebrow (DR-153, DR-370). Read next keeps `category` | Decide later: change the C-08 sheet to the two places, or add an Eyebrow to the region columns and More stories | C-08, DR-153, DR-370, DR-417 | Open (flag), U-49 |
| UF-06 | `MissingTranslationNote` has no sheet: a neutral `type-ui-sm` line above the category page title, `--space-module` below it | Add a sheet line (C-43 PageTitle or a new part) when run 2 or the hub pages define page notes | DR-401, `AGENTS.md` Section 8 | Open (flag), U-48 |
