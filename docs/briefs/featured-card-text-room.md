# featured-card-text-room (task)

Branch `task/featured-card-text-room` · Issue none · 5 November 2026

## Goal

Give the title and text more room in the StoryCard `side` variant. Keep the image as big as it can be. Below 1024 the card stacks, with the image on top and the text below. From 1024 on, the text takes 2/5 of the card width and the image takes 3/5. Today the card stacks only below 768, and from 768 the image takes 2/3. At 1024 that leaves the text about 192px; at 2/5 it gets about 235px. This amends DR-464. The rail stays 19rem, because the 300×600 rail ad needs that width from 1024.

## Where

- Homepage P-2 featured category: the feature story (`FeaturedCategorySection`, `/` and `/en`).
- Analysis hub cover: `AnalysisCoverSection`, StoryCard `side` with `large` (`/analysis`, `/en/analysis`). The rule applies to the `side` variant, so the cover follows it.
- C-24 StoryCard: `src/components/story/StoryCard.tsx` (`gridClass.side`: `md:story-side` becomes `lg:story-side`).
- `src/styles/components.css`: `--story-side-media-share` changes from `calc(2 / 3)` to `calc(3 / 5)`. The `story-side` comment also changes.
- Specs at the final checkpoint: `component-system.md` (Section 6 token row and CSS, C-24 `side` rows, P-2 featureStory rows) and `spacing-layout-system.md` (7.2 P-2, 7F `AnalysisCoverSection`).

## Rules

LAY-05, LAY-06, LAY-14, LAY-17, TYP-08, TYP-09, TYP-13, CPT-05, CPT-07, N-05; C-24, P-2; DR-451, DR-464 (amended), DR-468.

## Checkpoints

1. `side` stacks below 1024; from 1024 the text is 2/5 and the image 3/5. Check P-2 and the analysis cover at 768, 1023, 1024, 1279 and 1280, in Bangla and English. Update the unit and e2e tests. This is also the final checkpoint (`/checkpoint`).

## Test files

- Change: `src/components/home/featured/featured.test.tsx` (`lg:story-side`), `tests/e2e/featured.spec.ts`, `tests/e2e/analysis.spec.ts` (stacked at 768 to 1023, side from 1024), `tests/e2e/side-title.ts` (comment).
- Covering: `src/components/story/story-units.test.tsx`, `tests/e2e/home*.spec.ts` for P-2.
