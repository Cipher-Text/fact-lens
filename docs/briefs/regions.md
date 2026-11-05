# regions brief

Page `page/regions` · Issue IMP-18 (`/regions` part) · Progress `docs/progress/regions.md` · 4 Nov 2026, revised 5 Nov 2026 on `dev` 5dc5ada

## Goal and URL

The region hub of layout 7C.2 (row Region hub, "All regions"): `/regions` and `/en/regions`, built at build time for bn and en. The অঞ্চল / Regions nav item already links here (404 today); it becomes the current item. Region pages `/regions/<slug>` stay 404 (IMP-18).

IMP-125 (story role names) is done on `dev` (PR #25, #26), so it is no longer part of this run. The page uses its names: N-06 (lead, cover, top stories, feature), OverlapCard `large`, StoryCard `variant`, and the type scale classes of type-scale (PR #24, TYP-01).

## Changed in the build

The table below is the plan of 4 Nov. The build differs; the spec log RG-01 to RG-09 is the record:

- Title অঞ্চলসমূহ / Regions (the nav label, DR-345), not অঞ্চল.
- The Eyebrow is `format` on every card (news the category, analysis only Analysis), not `two-part` (RG-06).
- 7 regions with stories (Oceania has none), in groups of 4 with an `ad-band` before each group and one `ad-rail` per group; no `ad-inset` (RG-05).
- The Divider between the wrapper and the rail is `column-inset`, not `column-full` (RG-05).
- With no cover, the page shows no cover section and no Latest rail, as the category page (RG-02; PR 27 review).

## Sections, top to bottom

| Row | Container | Component |
| --- | --- | --- |
| Site header | As on the homepage | `SiteHeader` (C-17, C-18). অঞ্চল / Regions is the current item in the NavBar and the Drawer (C-19) |
| `ad-top` | Ad container | `AdSlot` top (C-16) |
| Page title | `Shell` | `PageTitle` (C-43): অঞ্চল / Regions, `h1`, in the `surface` band, with `PageTitle.description`: বিশ্বের প্রতিটি অঞ্চলের খবর ও বিশ্লেষণ / News and analysis from every region of the world. `space-module` below |
| Cover (new `RegionsCoverSection`) | `Shell`, `WithRail` | Laid out as `CategoryCoverSection` (layout 7B) without the card rows. Wrapper: the cover story as `OverlapCard` (C-02) with `large` (N-06), eager image, plus the Eyebrow: news the C-08 `category`; analysis `two-part`, format · category as on the article page (region hub only; tajmin, 5 Nov 2026; the page mixes categories, so DR-153 does not apply). Hidden `h2` প্রধান খবর / Main story. Rail: SectionHeading সর্বশেষ / Latest and `StoryList` (C-03, `columns={2}` as on the category page), the 5 newest stories with any region. **No MoreLink.** With no rail stories the wrapper spans the shell (7.3) |
| `ad-band` | Ad container | `AdSlot` band |
| Regions (new `RegionsGroupedSection`) | `Shell`, `WithRail` | Wrapper: P-3 rows of two `CategoryBlock`s (C-23), one per region, all 8 in the 7C.2 order; 1 per row on phones, 2 from 600 (`LAY-07`). Each block: the feature story as StoryCard `top` (N-06, C-24), a StoryList of 3, the Eyebrow on every story as on the cover (news `category`, analysis `two-part`), MoreLink to `/regions/<slug>` (404 until IMP-18). One `ad-inset` at most, after the second row (DR-447: 30% ad density under 768). Rail: AdSlot `rail` from 1024 (as `AnalysisTopSection`, AN-11); Divider.column-full from 1024; below 1024 the Rail is not drawn. No poll (tajmin, 5 Nov 2026) |
| Footer | As on the homepage | `Footer` (C-21) |

No More stories section. `main` starts with the title band and ends with `space-section` (7D.2).

## Content and mock data

- The cover and the region blocks are editorial and backend decisions (tajmin, 4 Nov 2026): the mock picks any story; no de-duplication logic.
- Latest rail: the 5 newest stories with any region.
- Mock: add stories (bn and en) so every region has 4 or more: Russia and Oceania have none, Americas and Europe have 2 (mock-content skill). Code still hides a region with no stories (7.3).
- New: `getRegionsPage(lang)` and a `RegionsPage` type (`cover`, `latest`, `regions`) in `src/content/`; description, cover and Latest strings in `bn.ts` and `en.ts`.
- Sparse: no cover removes the cover section and its ad band; a region with no stories is not shown; 0 stories in all: the title band only for now; the reusable empty-state message comes later (U-63, to do).

## Flags

- `two-part` Eyebrow on cards: decided by tajmin (5 Nov 2026): format · category, on the region hub only. A spec-log item for C-08 (an exception to DR-416, DR-418), not a flag.
- DOC-61: P-3b and P-6, the homepage regions slider. tajmin: keep P-6, drop P-3b from the layout spec; the spec log of this page carries it.

## Rules

`COL-01` to `COL-05`, `COL-13`, `COL-15`; `TYP-01`, `TYP-03`, `TYP-08`, `TYP-09`, `TYP-14`, `TYP-17`; `LAY-02`, `LAY-05` to `LAY-07`, `LAY-09` to `LAY-15`, `LAY-17`, `LAY-18`; `CPT-05` to `CPT-08`; `N-05`, `N-06`; DR-19, DR-276, DR-411, DR-416, DR-418, DR-438, DR-447, DR-450, DR-451.

## Checkpoints

1. Route, metadata, `getRegionsPage`, mock stories, header with the current nav item, ad-top and the PageTitle band with the description
2. Cover section: the OverlapCard `large` cover and the Latest rail
3. Ad band and the regions section: 8 region blocks, the ad-inset and the rail ad
4. Sparse cases, tests and the final checkpoint (`/checkpoint`)

## Test files

- New: `tests/e2e/regions-hub.spec.ts` (page order, widths 360 / 600 / 768 / 1024 / 1280, bn and en, light and dark, keyboard, axe, sparse), `src/app/[lang]/regions/metadata.test.ts`
- Changed: `src/content/content.test.ts` (`getRegionsPage`, every region has stories), `tests/e2e/header.spec.ts` (the current Regions item), `tests/e2e/url-format.spec.ts` (`/regions` is no longer a 404)
- Existing that cover it: `regions.spec.ts` (homepage P-3b), `grouped.spec.ts`, `category.spec.ts` (the cover layout)
- The string tables change, so the full `pnpm test:e2e:chromium` runs at the final checkpoint (AGENTS.md Section 11)
