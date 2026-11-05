# region brief

Page `page/region` · Issues IMP-128, IMP-18 (`/regions/<slug>` part) · Progress `docs/progress/region.md` · 5 Nov 2026 on `dev` 3e0868b

## Goal and URL

The region page of layout 7C.2 (row Region): `/regions/<slug>` and `/en/regions/<slug>`, one template for every region in `regionIds` (`americas`, `europe`, `russia`, `middle-east`, `south-asia`, `china`, `asia`, `oceania`), built at build time for bn and en. An unknown slug gives a 404 (7C.1). The design and layout follow the topic page (7E) and the Latest page (7D) (tajmin, 5 Nov 2026). With the page built, every link to `/regions/<slug>` opens its page (IMP-128).

## Sections, top to bottom

| Row | Container | Component |
| --- | --- | --- |
| Site header | As on the homepage | `SiteHeader` (C-17, C-18). The region's Drawer sub-item is current (C-19); on `/regions/south-asia` the দক্ষিণ এশিয়া / South Asia NavBar item is current too. অঞ্চলসমূহ / Regions is not current. The language link keeps the region |
| `ad-top` | Ad container | `AdSlot` top (C-16). No `ad-band`, no rail ad |
| Page title | `Shell` | `PageTitle` (C-43): the region name (`t.regions[id]`), the page `h1`, in the `surface` band. No label, no description, as the topic page. `space-module` below |
| `MoreStoriesSection` | `Shell`, `WithRail`: the wrapper column; the rail stays empty | `MoreStoriesList` (StoryCard `dated`, C-24; Divider.item; Divider.rule and the load more `Button`), named by the `h1`, `h2` titles. The C-08 Eyebrow in `format` mode on every row (news the category, analysis বিশ্লেষণ / Analysis; DR-417); DR-153 does not apply. 10 first, then 10 per press (7B.2) |
| Footer | As on the homepage | `Footer` (C-21) |

No link back to the region hub: the nav has it. `main` starts with the title band and ends with `space-section` (7D.2).

## Content and mock data

- The region's news and analysis stories, newest first, no repeats, no opinion.
- New: `getRegionPage(lang, slug)` and a `RegionPage` type (`lang`, `region`, `stories`) in `src/content/`, `getRegionSlugs()` from `regionIds`. A new `RegionPageView` in `src/components/region/`.
- Mock data stays as it is: South Asia has more than 10 stories, so load more shows there; Oceania has none.
- Sparse: a region with no stories shows the title band only (the empty-state message is U-63, open). Below 3 stories the page is `noindex, follow`, as the topic page (DR-432); with 10 stories or fewer there is no Button.

## IMP-128 links

Every link to `/regions/<slug>` opens its region page: the 7 MoreLinks of the region hub blocks (`RegionsGroupedSection`), the NavBar South Asia item, the Drawer region sub-items (`navItems.ts`) and the homepage P-2 featured region MoreLink (`FeaturedCategorySection`). Update the code comments that call them 404 links, and IMP-14 and IMP-18.

## Rules

`COL-01` to `COL-05`, `COL-13`, `COL-15`; `TYP-01`, `TYP-03`, `TYP-04`, `TYP-08`, `TYP-09`, `TYP-14`; `LAY-02`, `LAY-05`, `LAY-06`, `LAY-09` to `LAY-15`, `LAY-17`; `CPT-05` to `CPT-07`; `N-05`; DR-19, DR-153, DR-411, DR-417, DR-432.

## Checkpoints

1. Route, metadata, `getRegionPage`, header, ad-top and the PageTitle band
2. The list: `MoreStoriesSection` with the `format` Eyebrow, load more and the sparse cases
3. The current nav item and the IMP-128 links
4. Tests and the final checkpoint (`/checkpoint`)

## Test files

- New: `tests/e2e/region.spec.ts` (page order, widths 360 / 600 / 768 / 1024 / 1280, bn and en, light and dark, keyboard, axe, load more, the empty region, an unknown slug 404, every IMP-128 link opens its page), `src/app/[lang]/regions/[slug]/metadata.test.ts`
- Changed: `src/content/content.test.ts` (`getRegionPage`), `tests/e2e/header.spec.ts` (the current region items), `tests/e2e/regions-hub.spec.ts` and `tests/e2e/featured.spec.ts` (the region links open their pages), `src/components/region-hub/region-hub.test.tsx` if the current-item logic changes
- The string tables may change, so the full `pnpm test:e2e:chromium` runs at the final checkpoint (AGENTS.md Section 11)
