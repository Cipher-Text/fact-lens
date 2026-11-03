# analysis brief

Page `page/analysis` · Issue IMP-18 (`/analysis` part) · Progress `docs/progress/analysis.md` · 2 Nov 2026

## Goal and URL

The analysis hub of layout 7C.2 (row Analysis hub): `/analysis` and `/en/analysis`, built at build time for bn and en. Analysis stories only, no news, no opinion. It should stand out from the news hub (`/latest`). The বিশ্লেষণ / Analysis nav item already links here (404 today).

## Sections, top to bottom

| Row | Container | Component |
| --- | --- | --- |
| Site header | As on the homepage | `SiteHeader` (C-17, C-18). The বিশ্লেষণ / Analysis child is the current item in the dropdown and the Drawer (C-19) |
| `ad-top` | Ad container | `AdSlot` top (C-16) |
| Page title | `Shell` | `PageTitle` (C-43): বিশ্লেষণ / Analysis, `h1`, in the band. **New:** a short description below the title, in the band (new part `PageTitle.description`, strings in `bn.ts` and `en.ts`) |
| Hero | `Shell`, no rail | The homepage P-2 feature card: `StoryCard` (C-24) stacked under 768 (image first), row from 768 (3:2, md, `feature` split, image at the end), summary, meta, **plus** the `category` Eyebrow (C-08: inside the `/analysis` hub use `category`, DR-417). No heading: a hidden `h2` |
| Mosaic | `Shell`, `WithRail` | Wrapper: 2x2 grid as P-3 GroupedCategoriesSection (1 per row on phones, 2 from 600, `LAY-07`), the homepage hero top story cards `OverlapCard` (C-02): Eyebrow (`category`), title, deck, meta. No heading: a hidden `h2`. Rail: `AdSlot` rail from 1280 only (DR-240, DR-245); empty from 1024 to 1279 (flag U-54) |
| `ad-band` | Ad container | `AdSlot` band |
| More stories | `Shell`, `WithRail`: wrapper, rail empty | `MoreStoriesSection` as on the category page: StoryCard `dated`, 10 then 10, the `category` Eyebrow on every row, `h2` titles |
| Footer | As on the homepage | `Footer` (C-21) |

## Content and mock data

- Every analysis story, newest first, no repeats: the hero is the newest, the mosaic the next 4, More stories the rest (about 14 of the 19 mock analysis stories, so load more shows). Whether the hero and mosaic are editor picks or the newest is not decided (tajmin); the newest is the stand-in, logged as an open item.
- Sparse: 1 story shows the hero only; 2 to 4 fill the mosaic as far as they go; no list stories remove More stories and the ad band before it (7.3, `LAY-13`). No robots rule.
- New: `getAnalysisPage(lang)` and an `AnalysisPage` type in `src/content/`; the description strings.

## Rules

`COL-01` to `COL-05`, `COL-13`, `COL-15`; `TYP-03`, `TYP-08`, `TYP-09`, `TYP-14`, `TYP-17`, `TYP-18`; `LAY-02`, `LAY-05` to `LAY-07`, `LAY-09` to `LAY-15`, `LAY-17`; `CPT-05` to `CPT-08`; `N-05`; DR-153, DR-240, DR-245, DR-267, DR-417, DR-432.

## Checkpoints

1. Route, metadata, `getAnalysisPage`, header with the current nav item, ad-top and the PageTitle band with the description
2. Hero: the feature StoryCard with the category Eyebrow
3. Mosaic: the 2x2 OverlapCard grid and the ad rail
4. Ad band, More stories and the sparse cases
5. Tests and the final checkpoint (`/checkpoint`)

## Test files

- New: `tests/e2e/analysis.spec.ts` (page order, widths 360 / 600 / 768 / 1024 / 1280, bn and en, light and dark, axe, load more, sparse), `src/app/[lang]/analysis/metadata.test.ts`
- Changed: `src/content/content.test.ts` (`getAnalysisPage`), `src/components/layout/layout.test.tsx` (PageTitle description), `tests/e2e/header.spec.ts` (the current Analysis item)
- Existing that cover it: `latest.spec.ts`, `category.spec.ts`, `url-format.spec.ts` (`/analysis` is no longer a 404)
