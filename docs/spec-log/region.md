# region spec log

Branch `page/region` · Brief `docs/briefs/region.md` · Issue IMP-128, IMP-18 (the `/regions/<slug>` part) · Started 5 November 2026

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
| RE-01 | New rule | The region page layout, layout Section 7H (new): `/regions/<slug>` and `/en/regions/<slug>`, `RegionPageView`. Page order as the topic page (7E.1): site header, `ad-top`, C-43 PageTitle with the region name (the nav label) as the `h1`, no label and no description, the list, footer. No `ad-band`, no rail ad. Static for every region of the region list in bn and en; an unknown slug shows the 404 page (7C.1). No link back to the region hub. The 7C.2 Region row and 7G name 7H; 7C.2 no longer lists `/regions/<slug>` as not built | `src/app/[lang]/regions/[slug]/page.tsx:11`, `:13`, `:39`; `src/components/region/RegionPageView.tsx:19`, `:37` | Layout 7C.1, 7C.2 (Region row), 7D, 7E, 9; C-43; DR-370, DR-411 | tajmin, 5 Nov 2026: "follow the tags/latest page design and layout."; "Yes, all defaults" (title only, no ad band, no back link) | Green (design-reviewer, 5 Nov 2026) |
| RE-02 | New rule | The region page content: the news and analysis stories of the region (a story carries its regions, DR-411), newest first, no opinion, no repeats; 10 first, then 10 per press (7B.2 Load more). With no stories the list is not shown and the page is the title band only (the empty-state message is U-63); with 10 or fewer there is no Button. Below 3 stories the page is `noindex, follow`, as the topic page (DR-432) | `src/content/index.ts:358`, `:345`; `src/app/[lang]/regions/[slug]/page.tsx:29` | Layout 7B.2, 7D.3, 7E.2, 7E.3; DR-411, DR-414, DR-432 | tajmin, 5 Nov 2026: "Yes, all defaults" (news and analysis, no opinion; every region has a page; below 3 noindex) | Green (design-reviewer, 5 Nov 2026) |
| RE-03 | Reuse | `MoreStoriesSection`, `MoreStoriesList` on the region page, named by the `h1` (`h2` titles), with the C-08 `format` Eyebrow on every row (news the category, analysis বিশ্লেষণ / Analysis). The `section` prop takes `"region"` (`data-section="region"`) | `src/components/more-stories/MoreStoriesSection.tsx:27`; `src/components/region/RegionPageView.tsx:46`, `:49` | C-08 (DR-417), C-24 `dated`, DR-153 (the page mixes categories) | tajmin, 5 Nov 2026: "Yes, all defaults" (the `format` Eyebrow) | Green (design-reviewer, 5 Nov 2026) |
| RE-04 | New component | `RegionPageView`, the region page template, in component-system Section 3 with its page sections (PageTitle, `MoreStoriesSection`), beside `TopicPageView`. Section 8: region pages are built; only `/opinion` stays a 404 | `src/components/region/RegionPageView.tsx:19` | N-05 | Brief | Green (design-reviewer, 5 Nov 2026) |
| RE-05 | New rule | Current nav item on a region page: the region's Drawer child link is the current item and its Regions group opens (the C-19 child rule, Analysis spec log AN-15, reused); on `/regions/south-asia` the দক্ষিণ এশিয়া / South Asia NavBar and Drawer item is current too. অঞ্চলসমূহ / Regions stays current on the hub only (RG-08). C-18 `NavBar.current` and C-19 `Drawer.item` name it | `src/components/header/navItems.ts:48`, `:57` | C-18, C-19; DR-226, DR-411; regions spec log RG-08 | tajmin, 5 Nov 2026: "Yes, all defaults" (the region's Drawer item, and South Asia in the NavBar) | Green (design-reviewer, 5 Nov 2026) |

## Flags

None open. Written into the specs on `page/region`: layout 2.38 Sections 7C.2, 7G, 7H (new), 14.2 (RE-01, RE-02); component-system 1.33 Section 3, C-18, C-19 and Section 8 (RE-03 to RE-05); agent-contract 2.29 Sections 1, 3 and 5.
