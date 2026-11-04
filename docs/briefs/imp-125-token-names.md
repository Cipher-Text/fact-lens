# IMP-125: token name proposal

4 Nov 2026 · Title names decided by tajmin (4 Nov 2026); sections 2 and 3 approved by tajmin ("yes to rest of all too", 4 Nov 2026; DR-453, amends DR-441 and DR-451) · Source: code on `dev` 665ae50

Rule for the names: a token is named by the card or list that uses it and its variant (DR-451), never by a page role (DR-450). The exceptions are the lead and cover titles, which take the role names lead and cover (tajmin, 4 Nov 2026).

**Section 1 is replaced** by DR-454 and DR-455 (4 Nov 2026, typography cleanup): a size scale in place of the role names. Sections 2 and 3 (DR-453) stand.

## 1. Title type roles (`typography.css`, Bangla twins follow)

| Now | Used by today | Proposed | Why |
| --- | --- | --- | --- |
| `type-story-lead` | LeadStory (P-1 hero lead) | `type-story-lead-title` | Decided: its own token for the lead story |
| `type-story-lead` | Category cover (OverlapCard `feature`), analysis hub cover (StoryCard `lead`) | `type-story-cover-title` | Decided: its own token for the cover story (option `large` on both cards). Same values as the lead title for now |
| `type-story-title-lg` | Nothing in the code (spec: "second-level story in a lead group") | Remove | Unused; DR-451 has no size words on cards |
| `type-story-title` | StoryCard `md`, OverlapCard default | `type-story-card-title` | Decided. The card title. With DR-451 it follows the card width (container query), so one role covers every card |
| `type-story-title-sm` | StoryCard `sm` (P-2 rail, P-4 rows, P-6 regions), StoryListItem, RankedList (P-5 most read), OpinionList (P-4 analysis and opinion), DailyPoll question, RegionSlider | `type-story-list-title` | Decided. After DR-451 the cards drop `sm`; the users left are text lists |
| `type-story-title-sm` | DailyPoll question | `type-poll-question` | Decided: its own token, same values as the list title for now |

### 1b. New title names: current sizes and where they are used now

Sizes are from `typography.css` on `dev`. Each size grows smoothly from 360px to 1280px wide (the `clamp`); below 360 it holds the first value and from 1280 the second. EN is the serif, BN the Bangla face. All are weight 600.

| New name | Today's token | EN size (line height) | BN size (line height) | Used now |
| --- | --- | --- | --- | --- |
| `type-story-lead-title` | `type-story-lead` | 30–42px (1.08). Below 600: 22px (1.16), the card title | 28–40px (1.2). Below 600: 22px (1.26), the card title | LeadStory: homepage P-1 hero, the lead story |
| `type-story-cover-title` | `type-story-lead` | Same as the lead: 30–42px (1.08); below 600: 22px | Same as the lead: 28–40px (1.2); below 600: 22px | Category page cover (OverlapCard `feature`, `CategoryFeatureSection`); analysis hub cover (StoryCard `lead`, `AnalysisHeroSection`) |
| `type-story-card-title` | `type-story-title` | 22–26px (1.16) | 22–26px (1.26) | OverlapCard default: P-1 hero top stories, P-4 analysis and opinion (the analysis column feature), analysis hub top stories mosaic. StoryCard `md`: P-2 featured category feature, P-3 grouped categories block first story, category page cards, More stories (category, Latest, topic, analysis hub), article related stories |
| `type-story-list-title` | `type-story-title-sm` | 18–20px (1.2) | 18–20px (1.3) | StoryListItem in every StoryList: P-1 hero rail, P-2 featured category rail, P-3 grouped categories blocks, category cover rail, category formats; RankedList: P-5 most read; OpinionList: P-4 analysis and opinion; RegionSlider: P-6 regions panel titles. StoryCard `sm` today (moves to the card title with DR-451): P-2 featured category rail image story (removed), P-4 analysis and opinion rows, P-6 regions panel first story |
| `type-poll-question` | `type-story-title-sm` | 18–20px (1.2) | 18–20px (1.3) | DailyPoll question: P-3 grouped categories rail |
| (removed) | `type-story-title-lg` | 26–34px (1.12) | 26–32px (1.22) | Nothing |

## 2. Story spacing (`components.css`)

| Now | Used by | Proposed |
| --- | --- | --- |
| `--space-lead-eyebrow-title` | Every card and StoryListItem, reader | `--space-story-eyebrow-title` |
| `--space-lead-summary-meta` | LeadStory, OverlapCard, StoryCard | `--space-story-summary-meta` |
| `--space-lead-panel`, `-panel-start`, `-inset-start`, `-inset-end`, `-overlap` | LeadStory and OverlapCard `large` (the big panel) | `--space-panel-large`, `-large-start`, `--space-inset-large-start`, `-large-end`, `--space-overlap-large` |
| `--space-card-overlap` | OverlapCard default | `--space-overlap` |
| `.overlap-feature` (class) | OverlapCard `feature` | `.overlap-large` |

## 3. StoryCard variant utilities and tokens (`components.css`)

| Now | Proposed variant | Proposed utility and tokens |
| --- | --- | --- |
| `story-stacked` | `top` | `story-top` |
| `story-split-third` | `thumbnail` | `story-thumbnail` |
| `story-split-feature` + `story-split-lead`, `--story-feature-media-min/max/share`, `--story-analysis-lead-media-share/max` | `side` | `story-side`, `--story-side-media-min` (420px), `--story-side-media-share` (2/3). No max token: no cap |
| `story-dated`, `story-date` | `dated` | No change |
| `aspect-video` / `aspect-3/2` through `ratio` | – | `aspect-3/2` always, no token |

## 4. Section and analysis names (from IMP-125, for completeness)

`CategoryFeatureSection` to `CategoryCoverSection` (`data-section="category-cover"`); `AnalysisHeroSection` to `AnalysisCoverSection` (`analysis-lead` to `analysis-cover`, `data-analysis-cover-*`, string key `analysisPage.cover`).

## Decision

Recorded as DR-452 (amends DR-450; DR-445 and DR-451 amended). tajmin, 4 Nov 2026: "type-story-lead-title for lead story, type-story-cover-title for cover story, type-story-card-title, type-story-list-title, type-poll-question - gets own token. Explicit yes." The explicit yes covers the type role rename (old open item a). `type-story-title-lg` is removed (not in the list, unused).
