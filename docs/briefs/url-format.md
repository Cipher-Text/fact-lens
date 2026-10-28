# Brief: URL format, home and article (run 1 of 2)

Branch `page/url-format` (spec commit b4c6139 on top of `dev`) · Issue IMP-97 · Task file `docs/tasks/url-format.md` · Drafted 28 October 2026

## Goal and URLs

Move the site to the approved URL format and content model (DR-410 to DR-417, layout 7C). The layout changes only on the homepage (P-2) and the article page (Eyebrow).

- Article: `/[lang]/story/<slug>-<id>`, every format. Found by `<id>`; a wrong slug gets a 301 in `src/proxy.ts` (`NextResponse.redirect(url, 301)`, from an id-to-slug map in the mock content). Bare `/story` and an unknown id: 404.
- Links only, no pages yet (404, IMP-18): `/latest`, `/analysis`, `/opinion`, `/regions`, `/regions/<slug>`, `/topic/<slug>`.
- Gone (404): `/category/bangladesh`, `/tag/...`.

## Sections that change

| Where | Component | Change |
| --- | --- | --- |
| Header NavBar and Drawer | C-18, Drawer | South Asia in the place of Bangladesh, `/regions/south-asia`; Regions `/regions` and `/regions/<slug>`; বিশ্লেষণ `/analysis`, মতামত `/opinion`. Parent বিশ্লেষণ ও মতামত keeps `#analysis-opinion-title` (flag) |
| Cards in mixed lists (lead, top stories, region columns, More stories) | C-08 Eyebrow | New `format` mode on analysis cards: বিশ্লেষণ / Analysis, `/analysis`. Analysis sections keep `category` |
| P-2 featured | C-06 FeaturedCategorySection | Takes a region or a category. বাংলাদেশ becomes দক্ষিণ এশিয়া, id `region-south-asia`, MoreLink `/regions/south-asia` |
| P-3b regions | RegionSlider | The new list of 8; empty regions hidden, as now |
| Article heading | C-27 ArticleHeader.category, C-08 | Text links, no filled button on every article. News: category. Analysis and opinion: `two-part`, format · category. `.rd-kicker` / `.rd-cat` renamed (SL-22) |
| Article end | C-34 Topics | `Tags` becomes `Topics`, links `/topic/<slug>`; same look |
| Language switch (article) | TopBar switch | Missing translation: no hreflang, switch goes to the category page in the other language with a note (DR-401). A direct URL in the missing language is a 404 |

## Content and mock data

- `Format`: news, analysis, opinion. The 5 explainers become analysis.
- Categories: geopolitics, security, history, economy, technology. The 22 `bangladesh` stories are remapped or removed (table at checkpoint 1; `chattogram-rain-warning` removed; `river-data-framework` gets a beat and `south-asia`).
- Every story gets a hand-written 7-character base36 `id` and `regions: RegionId[]`.
- Regions, in order (labels approved, tajmin 28 Oct 2026): americas আমেরিকা / Americas, europe ইউরোপ / Europe, russia রাশিয়া / Russia, middle-east মধ্যপ্রাচ্য / Middle East, south-asia দক্ষিণ এশিয়া / South Asia, china চীন / China, asia এশিয়া / Asia, oceania ওশেনিয়া / Oceania.
- Topics: a topic table (key, slug, bn, en); articles hold topic keys.
- Bangla-only article: a short Bangla-only full text for one existing story in `stories.ts`; `ArticleDef.en` becomes optional, so `river-data-framework` keeps both languages (tajmin, 28 Oct 2026).
- Update `category-most-read.ts`, `homepage.ts` (featured, region order, sparse plans) and `content.test.ts`; sparse and long-headline cases keep working (layout 7.3, 13).

## Rules that apply

Layout 7C, 7.2, 7.3, 13; C-06, C-08, C-18, C-27, C-34; `COL-02`, `COL-06`, `COL-13`, `TYP-03`, `TYP-14`, `LAY-01`, `LAY-14`, `LAY-17`, `CPT-07`, `N-05`, `T-27`. Decisions: DR-401, DR-410 to DR-418; DR-370 exception for P-2 and the card Eyebrow.

## Checkpoints

1. Content model and mock data: formats, categories, regions, topics, ids, the remap table.
2. URLs and nav: `storyHref`, the `<slug>-<id>` route, the 301, the 404s, topic links, menu targets, missing translation.
3. Card Eyebrow `format` mode in the mixed lists.
4. Homepage দক্ষিণ এশিয়া in P-2 and the new region list.
5. Article two-part Eyebrow, text links only, SL-22 rename; separator gap token proposed if none fits.
6. Final: `/checkpoint`, full `pnpm test:e2e:chromium`, spec check (task file Section 5), STATUS, ISSUES (IMP-97, run 2 row).

## Test files

- Unit: `src/content/content.test.ts`, `src/components/home/featured/featured.test.tsx`, `src/components/home/most-read/most-read.test.tsx`, `src/components/home/regions/regions.test.tsx`, `src/components/story/small-parts.test.tsx`, `src/i18n/i18n.test.ts`.
- e2e: `tests/e2e/header.spec.ts`, `article.spec.ts`, `featured.spec.ts`, `category.spec.ts`, and new `tests/e2e/url-format.spec.ts` (301 from a wrong slug, 404 for bare `/story` and an unknown id, Eyebrow modes, two-part article Eyebrow, missing translation; bn and en).
- `src/i18n/` changes: the full `pnpm test:e2e:chromium` at the final checkpoint.
