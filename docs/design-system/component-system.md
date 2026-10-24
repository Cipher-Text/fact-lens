# Fact Lens Component System

Version 1.18.1 · 24 October 2026 · Article page components, checkpoint 1 (DR-385 to DR-390); process wording: no tickets, no `/accept`

This document is the single source for the homepage and article page components: their names, parts, variants, sizes per width, content rules, accessibility and checks. It is for designers, developers and AI agents.

The component values use the tokens of `color-system.md`, `typography-system.md` and `spacing-layout-system.md`, plus the component tokens in Section 6. The section layouts (wrapper, rail, columns per width) are in `spacing-layout-system.md` Section 7.

This file is the only home of the component specs (DR-372, DR-377). To change it, write the change in the page spec log (`docs/spec-log/<page>.md`); at the final checkpoint the coding agent writes the green items into this file on the page branch, so they go in the same pull request (DR-392).

## Contents

1. [How to use this document](#1-how-to-use-this-document)
2. [Status](#2-status)
3. [Names](#3-names)
4. [Rules](#4-rules)
5. [Container sizes](#5-container-sizes)
6. [Component tokens](#6-component-tokens)
7. [Components](#7-components)
8. [Open items](#8-open-items)

## 1. How to use this document

- Find the component for a homepage part in the **name table** (Section 3). Use these names in code, tests, briefs and chat (`N-05`).
- Follow the **rules** (Section 4). Each rule has a stable ID, for example `CPT-05`. Use the ID in reviews, prompts and commit messages.
- Build each component from its **sheet** (Section 7). The sheet gives the parts, the values per width and the checks.
- Values in the sheets are the result. Build them with the tokens and the Tailwind 4px scale classes. Do not type a hex value or an arbitrary size in a component (`CPT-07`). A value that only one component uses is a scale class in that component, for example `min-h-13` for a 52px row (`LAY-21`). Add a component token in `src/styles/components.css` only for a value that two or more components share or that is not a scale step.
- "Phone" is a page under 600px, "tablet" is 600 to 1023px and "desktop" is 1024px and up, unless a sheet gives other widths.

## 2. Status

| ID | Component | Group | Status | Decisions |
| --- | --- | --- | --- | --- |
| C-01 | `LeadStory` | Story units | Approved | DR-86, DR-87, DR-325 |
| C-02 | `OverlapCard` | Story units (shared cards) | Approved | DR-91, DR-93, DR-97, DR-98, DR-99, DR-105, DR-106, DR-109, DR-325 |
| C-03 | `StoryList` | Story units (shared cards) | Approved | DR-93, DR-96, DR-98, DR-101, DR-102, DR-124, DR-125, DR-300, DR-350 |
| C-24 | `StoryCard` | Story units (shared cards) | Approved | DR-93, DR-108, DR-118, DR-119, DR-121, DR-126, DR-152, DR-153, DR-267, DR-283, DR-300, DR-308, DR-325 |
| C-25 | `StoryListItem` | Story units (shared cards) | Approved | DR-93, DR-101, DR-102, DR-126, DR-153 |
| P-2 | `FeaturedCategorySection` | Sections | Approved | DR-93, DR-101, DR-103, DR-108, DR-110, DR-118, DR-119, DR-121, DR-122, DR-123, DR-300 |
| P-4 | `AnalysisSection` | Sections | Approved | DR-52, DR-76, DR-93, DR-101, DR-108, DR-110, DR-111, DR-205, DR-224, DR-264, DR-268, DR-300, DR-351 |
| C-06 | `OpinionList` | Section components | Approved | DR-52, DR-76, DR-101, DR-110, DR-112, DR-113, DR-299, DR-300, DR-301, DR-351 |
| C-23 | `CategoryBlock` | Section components | Approved | DR-53, DR-93, DR-101, DR-103, DR-110, DR-122, DR-123, DR-126, DR-127, DR-128, DR-134, DR-135, DR-138, DR-139, DR-152, DR-239, DR-240, DR-245, DR-351 |
| C-07 | `RankedList` | Section components | Approved | DR-44, DR-51, DR-144, DR-145, DR-146, DR-147, DR-148, DR-300 |
| C-15 | `RegionSlider` | Section parts | Approved | DR-19, DR-140, DR-141, DR-142, DR-143, DR-151, DR-227, DR-236, DR-284, DR-291, DR-318 |
| C-16 | `AdSlot` | Section parts | Approved | DR-127, DR-163, DR-197, DR-206, DR-207, DR-233, DR-240, DR-241, DR-242, DR-245, ad proposal (approved 5 Oct), DR-315, DR-387 |
| C-14 | `NewsletterSignup` | Section parts | Deferred | DR-128, DR-129, DR-130, DR-131, DR-132, DR-133, DR-134, DR-135, DR-137, DR-224, DR-229, DR-230, DR-231, DR-238, DR-239 |
| C-26 | `DailyPoll` | Section parts | Approved | DR-134, DR-138, DR-139, DR-149, DR-236, DR-239, DR-273, DR-277, DR-287, DR-295, DR-298 |
| C-22 | `Divider` | Small parts | Approved | DR-87, DR-102, DR-103, DR-262, DR-299, DR-350, DR-351 |
| C-13 | `SectionHeading` | Small parts | Approved | DR-103, DR-122, DR-159, DR-163, DR-262 |
| C-10 | `MoreLink` | Small parts | Approved | DR-110, DR-123, DR-136, DR-160, DR-163, DR-350 |
| C-08 | `Eyebrow` | Small parts | Approved | DR-112, DR-153, DR-163 |
| C-09 | `MetaLine` | Small parts | Approved | DR-96, DR-98, DR-100, DR-101, DR-166 |
| C-11 | `Chip` | Small parts | Approved | DR-112, DR-140, DR-163, DR-222, DR-279 |
| C-12 | `Button` | Small parts | Approved | DR-133, DR-138, DR-140, DR-163, DR-165, DR-167, DR-168, DR-169, DR-208, DR-225, DR-227, DR-235, DR-237, DR-303, DR-349 |
| C-17 | `TopBar` | Page chrome | Approved | DR-21, DR-41, DR-42, DR-43, DR-165, DR-167, DR-170, DR-171, DR-174, DR-176, DR-177, DR-179, DR-180, DR-234, DR-265, DR-269, DR-287, DR-294, DR-295, DR-306, DR-349 |
| C-18 | `NavBar` | Page chrome | Approved | DR-41, DR-157, DR-223, DR-287, DR-295, DR-349 |
| C-19 | `Drawer` | Page chrome | Approved | DR-21, DR-41, DR-56, DR-170, DR-181, DR-182, DR-185, DR-188, DR-223, DR-226, DR-227, DR-228, DR-280, DR-295, DR-302, DR-306, DR-331, DR-349 |
| C-20 | `SearchDialog` | Page chrome | Approved | DR-21, DR-186, DR-187, DR-189, DR-190, DR-191, DR-192, DR-227, DR-228, DR-231, DR-280, DR-349 |
| C-21 | `Footer` | Page chrome | Provisional | DR-59, DR-157, DR-193 (provisional; extension after run 2, CMP-33), DR-224, DR-264, DR-306, DR-314 |
| C-27 | `ArticleHeader` | Article page | Approved | DR-386, DR-388, DR-389, DR-390 |
| C-28 | `Byline` | Article page | Approved | DR-386, DR-390 |
| C-29 | `LeadMedia` | Article page | Approved | DR-386, DR-390 |
| C-30 | `KeyPoints` | Article page | Approved | DR-386, DR-388, DR-390 |
| C-31 | `ContextCard` | Article page | Approved | DR-383, DR-386, DR-388, DR-390 |
| C-32 | `PreferredSourceAlert` | Article page | Approved | DR-386, DR-389, DR-390 |
| C-33 | `ArticleBody` | Article page | Approved | DR-386, DR-387, DR-388, DR-390 |
| C-34 | `Tags` | Article page | Approved | DR-390 |
| C-35 | `ReadingTools` | Article page | Approved | DR-386, DR-390 |
| C-36 | `ProgressButton` | Article page | Approved | DR-390 |
| C-37 | `TextSize` | Article page | Approved | DR-388, DR-390 |
| C-38 | `ShareDialog` | Article page | Approved | DR-389, DR-390 |
| C-39 | `CopyLinkButton`, `SaveButton` | Article page | Approved | DR-390 |
| C-40 | `Popover` | Article page | Approved | DR-390 |
| C-41 | `SelectionShare` | Article page | Approved | DR-386, DR-390 |
| C-42 | `Toaster` | Article page | Approved | DR-386, DR-390 |

**Approved**: build as written. **Provisional**: build as written; the design can grow later. **Draft**: not decided; use the values that the sheets of the other components give.

## 3. Names

### 3.1 Page sections

In page order. The pattern ID links to `spacing-layout-system.md` Section 7.2.

| Pattern | Section | Label (Bangla / English) | Item | Component | What |
| --- | --- | --- | --- | --- | --- |
| — | `TopBar, NavBar` | – | – | TopBar (C-17) | Sticky bar: menu, search, logo, language, theme |
|  |  |  | – | NavBar (C-18) | Category links from 1280px; sticky with the TopBar, hides past its row (DR-349) |
|  |  |  | – | Drawer (C-19), SearchDialog (C-20) | Opened from TopBar |
| — | `AdSlot variant="top"` | – | – | AdSlot | Top ad below the NavBar (below the TopBar under 1280), above HeroSection (DR-295): 274px from 1024 (250 creative + 24px label line), 124 on phones, 114 at 768 |
| P-1 | `HeroSection` | শীর্ষ খবর (hidden) / Top stories (hidden) | `HeroSection.leadStory` | LeadStory (C-01) | The lead story of the site. Only here |
|  |  |  | `HeroSection.topStories` | 2 × OverlapCard (C-02) | The two top stories under the lead |
|  |  |  | `HeroSection.latest` | SectionHeading + StoryList (5 × StoryListItem) | সর্বশেষ / Latest, in the rail. 2 columns at 768 to 1023px. আরও দেখুন to the Latest page (DR-350) |
| — | `AdSlot variant="band"` | – | – | AdSlot | After every section except where layout §7.1 says no |
| P-4 | `AnalysisSection` | বিশ্লেষণ ও মতামত / Analysis and opinion | `AnalysisSection.analysis` | FeatureStory (OverlapCard) + StoryList (2 × StoryCard row, 16:9, sm, third) + MoreLink | Start column. Eyebrow shows the story category |
|  |  |  | `AnalysisSection.opinion` | Chip মতামত + OpinionList (5 items) + MoreLink | End column |
| P-2 | `FeaturedCategorySection` | Category name, for example বাংলাদেশ, ভূরাজনীতি ও কূটনীতি / Bangladesh, Geopolitics and Diplomacy | `FeaturedCategorySection.featureStory` | StoryCard (row from 768, 3:2, md, split feature, summary) | The feature story in the wrapper |
|  |  |  | `FeaturedCategorySection.rail` | StoryCard (stack beside, row third when stacked; 16:9, sm) + StoryList (2 × StoryListItem) | One image story and two text items |
|  |  |  | `FeaturedCategorySection.more` | MoreLink | আরও দেখুন, section end |
| P-3 | `GroupedCategoriesSection` | None (each block has its own label) / None | `GroupedCategoriesSection.blocks` | 4 × CategoryBlock (C-23), 2 per row from 600 | One block per category |
|  |  |  | `GroupedCategoriesSection.adInset` | AdSlot variant="inset" | Between the two rows of blocks, wrapper width |
|  |  |  | `GroupedCategoriesSection.rail` | DailyPoll (C-26) in prototype run 2; NewsletterSignup (C-14) above it after run 2 (DR-239) | নিউজলেটার / Newsletter, আজকের জরিপ / Daily poll (DR-346) |
|  |  |  | `GroupedCategoriesSection.adRail` | AdSlot variant="rail" | Below the poll in the rail, from 1280 only (DR-240, DR-245) |
| P-5 | `MostReadSection` | সর্বাধিক পঠিত / Most read | `MostReadSection.list` | RankedList (C-07, 5 items) | Numbered list, 4 / 3 / 2 / 1 per row. No MoreLink |
| P-3b | `RegionsSection` | অঞ্চলসমূহ / Regions | `RegionsSection.slider` | RegionSlider (C-15) | Slider from 600px, tabs (Chip) on phones |
|  |  |  | `RegionsSection.more` | MoreLink | আরও দেখুন / See more, like every section |
| — | `Footer` | – | – | Footer (C-21) | Logo, social links, About, Contact, Corrections, Privacy, Terms |

Helper parts. They are not sections or numbered components; use these names in code (DR-286).

| Name | What |
| --- | --- |
| SiteHeader | A fragment, not a wrapper: TopBar (C-17, the header landmark) and NavBar (C-18, a sibling nav landmark), so the bar stays sticky for the whole page (LAY-15, DR-346) |
| PeerRow | A row of peer story cards (layout §8 Peer rows) |
| PeerCard | One card in a PeerRow |
| StoryImage | The image part of the story units (ratio, sizes, square corners). No-image placeholder (DR-338): when a story has no image or the image does not load, the same slot shows a flat surface-alt fill at the slot ratio (3:2 or 16:9), square corners, no border, no shadow, no mark, no text. Decorative: aria-hidden; the image link keeps tabindex -1. skeleton is for loading only |
| QuoteMark | The quote mark drawing in OpinionList (C-06) |
| WithRail | Layout wrapper: main column and the 304px rail from 1024 |

Code names to change: the code uses the approved names above, and the folder names follow them (DR-286).

| Code name now | Approved name |
| --- | --- |
| Hero | HeroSection |
| AnalysisOpinion | AnalysisSection |
| Featured | FeaturedCategorySection |
| Grouped | GroupedCategoriesSection |
| MostRead | MostReadSection |
| Regions | RegionsSection |
| SiteFooter | Footer |
| Most read list inline in MostRead.tsx | RankedList (C-07), its own component |

### 3.2 Words

| Word | Meaning |
| --- | --- |
| Section | One full row of the homepage between two ad bands, with its own heading. Example: MostReadSection. |
| Wrapper | The wide column of a section, at the start side. It holds the main stories. |
| Rail | The 304px column at the end side of a section, from 1024px. Below 1024px it stacks under the wrapper. |
| Column | One of two equal halves of AnalysisSection. Not the rail. |
| Block | One category inside GroupedCategoriesSection (CategoryBlock). |
| Card | One story with an image: LeadStory, OverlapCard or StoryCard. |
| List | Stories in a row stack with rules between them: StoryList, OpinionList, RankedList. |
| Item | One story in a list: StoryListItem, OpinionList.item, RankedList.item. |
| Lead story | LeadStory: the one lead story of the whole site, in HeroSection only. |
| Feature story | FeatureStory: the first and largest story of a section, a CategoryBlock or a region panel. It is a role, not a card: StoryCard or OverlapCard draws it. Never call it the lead. |
| Top stories | The two OverlapCards under LeadStory in HeroSection. |
| Heading | SectionHeading: the divider bar and the h2 label of a section or block. |
| Band | A full-width ad row between sections (AdSlot variant band). |
| Panel band | A full-width surface-elevated row with its content in the shell: AnalysisSection and Footer (DR-264). Not an ad band. |
| WithRail | Layout part: the Wrapper and the Rail of a section in one grid. Used by HeroSection, FeaturedCategorySection and GroupedCategoriesSection. No rail content: the Wrapper spans the shell (DR-271). |

### 3.3 Labels

Interface labels come from `src/i18n/bn.ts` and `src/i18n/en.ts`. English labels are working labels. The article page labels are under `reader` in the same files (DR-390).

| Bangla | English | Where |
| --- | --- | --- |
| শীর্ষ খবর | Top stories | HeroSection, hidden h2 |
| সর্বশেষ | Latest | HeroSection.latest |
| বিশ্লেষণ ও মতামত | Analysis and opinion | AnalysisSection |
| মতামত | Opinion | Chip in AnalysisSection.opinion |
| সর্বাধিক পঠিত | Most read | MostReadSection |
| অঞ্চলসমূহ | Regions | RegionsSection heading; NavBar and Drawer item (DR-345) |
| নিউজলেটার | Newsletter | NewsletterSignup |
| আজকের জরিপ | Daily poll | DailyPoll (DR-346) |
| ভোট দিন | Vote | DailyPoll.vote |
| আরও দেখুন | See more | MoreLink, every section and block |
| আগের অঞ্চল / পরের অঞ্চল | Previous region / Next region | RegionSlider.prev / .next (button names) |
| বিজ্ঞাপন | Advertisement | AdSlot.label |
| মূল খবরে যান | Skip to main content | SkipLink (TopBar sheet) |

## 4. Rules

### CPT-01 Name a component by what it is

Name components by what they are, not by where they sit. Use StoryCard, not HeroRightCard. Bangla section names are content, never component names. (DR-84)

### CPT-02 Give a variant as a prop

Give a variant as a prop with a closed list of values, for example variant="overlap" | "plain". Do not make a new component for a size change. (DR-84)

### CPT-03 Name a part Component.part

Name a part with the component name and the part name, for example LeadStory.panel. (DR-84)

### CPT-04 Make a component react to its container

Make a component react to the width of its container, not the viewport. Use the container sizes below. The page layout keeps the viewport breakpoints. (DR-84, DR-86)

### CPT-05 Do not round corners

Do not use rounded corners on images, panels, cards, buttons, inputs or dialogs. Set border-radius to 0. There is no exception (the ThemeToggle switch is removed, DR-349). (DR-87, DR-168, DR-295, DR-349)

### CPT-06 Do not put a border around a card

Do not put a border around a card. Use space, rules and the brand bar to separate content. (DR-87)

### CPT-07 Use tokens and scale classes only

Use only the tokens of the color, typography and layout specs, the component tokens below and the Tailwind 4px scale classes (LAY-21). A value that one component uses is a scale class in that component (gap-7, min-h-13); a token only for a value that two or more components share or that is not a scale step. Do not use arbitrary values (p-[22px]). (LAY-01, LAY-21, DR-223)

### CPT-08 Do not cut a news title

Do not cut a news title with "…". Let it wrap. (Method)

### CPT-09 Scale insets and overlaps with the container

Give insets and overlaps that follow an image as a share of the container width (cqi) with a minimum and a maximum: clamp(min, n cqi, max). Keep bar thickness, padding and type in fixed tokens. (DR-89)

### CPT-10 Draw the metadata separator

Separate items in a metadata line with a drawn separator: 4px square (no radius), in the metadata text color, centered on the line, 10px space each side, aria-hidden. Do not type the dot as a character (it sits differently in Bangla and English fonts). No vertical lines or pipes. (DR-98, DR-166)

### CPT-11 Keep the story text hierarchy

Keep the story text hierarchy: title > summary > metadata (> eyebrow is a label, colored, not ranked by size). Each lower level is weaker in at least two of size, weight and color, and is never heavier than the level above. Metadata: weight 400, --color-meta, smaller than the summary. (DR-96)

### CPT-12 Use one metadata size per language

Use one metadata size per language on the whole page: Bangla 15px, English 14px (type-metadata). Do not change the metadata size by component or container size. (DR-101)

### CPT-13 Do not make a section heading a link

Do not make a section heading a link. The heading is plain text (h2). The section link is the আরও দেখুন MoreLink. (DR-122)

### CPT-14 Put one MoreLink at the end of each section

Place one আরও দেখুন MoreLink per section, at the end of the whole section and its end edge. It links to the category page, not to the rail. (DR-123)

### CPT-15 Align a standalone link to the end edge

Align a standalone link (a link on its own line, such as আরও দেখুন or গোপনীয়তা নীতি) to the end edge of its block (text-align: end). Links inside a sentence and title links stay in the text flow. A spec can name an exception. (DR-136)

### CPT-16 Restyle a shadcn component when you add it

Restyle a shadcn/ui component when you add it. After shadcn add, change the file to the Fact Lens sheet before use: remove radius, shadow, dark: classes, opacity modifiers (/50), ring-3, leading-none, text-sm and text-xs, size-4 icons and the active translate. Give the parts the typography roles (typography §7.3) and the color tokens. Keep the behavior (focus, keys, aria). Use Button, Input, Drawer (SearchDialog, from the top), Sheet (Drawer), Collapsible (Drawer.accordion), Tabs (phone region chips), RadioGroup (DailyPoll), Switch (theme controls), Alert (PreferredSourceAlert), Badge (Tags), Card (ContextCard) and Dialog (ShareDialog) (DR-390). Do not use Carousel, NavigationMenu or Separator. Keep the shadcn base-nova preset (Base UI). (DR-236)

### N-01 Name each section with Section at the end

Give each homepage section one component name that ends in Section, for example HeroSection. Its ID is the pattern ID (P-1 to P-5). (DR-162)

### N-02 Name a section by what it holds

Name a section by what it holds, not by its Bangla label or its place on the page. The label is content and can change. (DR-162)

### N-03 Name a one-component part Parent.part

Give a part that only one component uses the name Parent.part, for example OpinionList.item. Write the part in camelCase. (DR-162)

### N-04 Make a shared part its own component

Make a part that two or more components use its own component, with its own C-ID, for example StoryCard. (DR-162)

### N-05 Use the approved names and words

Use the names and words of Section 3 of this document in specs, briefs, canvas boards, code and chat. (DR-162, DR-259)

## 5. Container sizes

A component sets `container-type: inline-size` on its root and reacts to its own width (`CPT-04`). The narrow style is the base. `@container (width >= 600px)` is medium. `@container (width >= 880px)` is wide. The page layout keeps the viewport breakpoints. Some sheets switch at a page breakpoint; the sheet says so.

| Size | Container width | Examples |
| --- | --- | --- |
| narrow | Less than 600px | Phone column, the 304px rail, hero top stories (464px at 1366) |
| medium | 600px to 879px | Tablet lead (720px), lead beside the rail at 1024px (648px) |
| wide | 880px and more | Lead beside the rail from 1280px (904px, 952px) |

## 6. Component tokens

These tokens add to the tokens of the three foundation documents. Put them in `src/styles/components.css` and import it as `spacing-layout-system.md` Section 12.5 lists (DR-339).

| Token | Narrow | Medium | Wide | Use | Decision |
| --- | --- | --- | --- | --- | --- |
| `--bar-brand` | 6px | 8px | 10px | Thickness of the brand bar on LeadStory | DR-86 |
| `--color-bar` | brand (light) / interactive (dark) |  |  | Color of the brand bar | DR-86 |
| `--space-lead-inset` | start 0, end 2rem (32px) | clamp(2rem, 4.2cqi, 2.5rem) | same (40px at 952) | Image edge to panel edge, each side. Scales with the card width, 32 to 40px | DR-86, DR-89 |
| `--space-lead-panel` | 1rem top and end, 0 at the start | 1.5rem (24px) | 2rem (32px) | Padding inside the lead panel | DR-86 |
| `--space-lead-overlap` | 2rem (32px) | clamp(4rem, 10cqi, 6rem) | same (95px at 952) | How far the lead panel covers the image. Scales with the card width, 64 to 96px (65 at 648, 72 at 720) | DR-86, DR-89 |
| `--space-lead-eyebrow-title` | 0.5rem (8px) | same | same | LeadStory: eyebrow to title | DR-92 |
| `--space-lead-summary-meta` | 1rem (16px) | same | same | LeadStory: summary to meta | DR-92 |
| `--color-meta` | #6E6862 (light, 5.2:1 on background, 4.8:1 on surface-alt) | #A3A3A3 (dark, unchanged) |  | Metadata text and its separator. Same value as ink-muted: #6E6862 is the light ink-muted value for all muted text (captions, labels, ad label), replacing #4F4B48 | DR-100 |
| `--bar-section` | 2.5rem x 0.5rem (40 x 8px) | 2.5rem x 0.5rem (40 x 8px) | 3rem x 0.5rem (48 x 8px) | Section divider bar, width x height (DR-262). Columns: phone / 600-1023 / 1024 and up (page breakpoints). 48 x 6 under 1024  | DR-103 |
| `--space-card-overlap` | clamp(2.5rem, 10cqi, 4rem): 40px at 328 | same (DR-109: every width) | same (46px at 464, 58px at 584) | How far a story card text block covers its image: 10% of the card width, 40 to 64px. Same percent rule as the lead (DR-89) | DR-105, DR-109 |
| `--space-card-notch` | clamp(2.5rem, 10cqi, 4rem): 40px at 328 | same | same (46px at 464, 58px at 584) | Image left visible at the end side of an overlap card: 10% of the card width, 40 to 64px | DR-105, DR-109 |
| `--button-height` | 3rem (48px) | same | same | Button height at every width | DR-208 |
| `--button-padding` | 1.25rem (20px) | same | same | Button side padding | DR-208 |
| `--icon-button-size` | 2.75rem (44px) | same | same | IconButton filled size (slider buttons) and the 44px caret and social link taps. Article page: `ProgressButton`, `TextSize` steps, share dialog icons (DR-390) | DR-208, DR-349, DR-390 |
| `--icon-button-size-ghost` | 2rem (32px) | 2.25rem (36px) from 768 | same | IconButton ghost size: TopBar (menu, search, theme), Drawer and SearchDialog close (DR-349; was --icon-button-size-bar, phones only). Article page: `ReadingTools` icon buttons (DR-390) | DR-208, DR-209, DR-349, DR-390 |
| `--icon-size` | 1.25rem (20px) | same | same | Icon size in buttons and icon buttons, every width | DR-208 |
| `--button-icon-gap` | 0.5rem (8px) | same | same | Space between a button label and its icon | DR-208 |
| `--top-bar-inset` | 0.625rem (10px) | 1.125rem (18px) at 600; 1rem (16px) from 768 |  | TopBar side padding = page gutter minus the controls inner space (C-17): (32 - 20) / 2 = 6 under 768, (36 - 20) / 2 = 8 from 768 (DR-349). Columns: phone / 600 and 768 up | DR-294, DR-349 |
| `--space-lead-panel-start` | 0 | var(--space-lead-panel) | same | Lead panel padding at the start side (container width 600 and up) | DR-297 |
| `--story-feature-media-min` | 26.25rem (420px) | same | same | Feature split: smallest image column (C-24, P-2) | DR-297 |
| `--story-feature-media-max` | 34.8125rem (557px) | same | same | Feature split: largest image column | DR-297 |
| `--story-feature-media-share` | 0.5 | same | 0.6 from 1024 | Feature split: image share of the row (minus one column gap) | DR-297 |

In CSS, `--bar-section` is the pair `--bar-section-width` and `--bar-section-height`, and `--space-lead-inset` is the pair `--space-lead-inset-start` and `--space-lead-inset-end`.

```css
:root {
  --bar-brand: 0.375rem;
  --bar-section-width: 2.5rem;
  --bar-section-height: 0.5rem;
  --space-lead-inset-start: 0;
  --space-lead-inset-end: 2rem;
  --space-lead-panel: 1rem;
  --space-lead-overlap: 2rem;
  --space-lead-eyebrow-title: 0.5rem;
  --space-lead-summary-meta: 1rem;
  --space-card-overlap: clamp(2.5rem, 10cqi, 4rem);
  --space-card-notch: clamp(2.5rem, 10cqi, 4rem);
  --color-bar: var(--brand);
  --color-meta: var(--ink-muted);
  --button-height: 3rem;
  --button-padding: 1.25rem;
  --icon-button-size: 2.75rem;
  --icon-button-size-ghost: 2rem;
  --icon-size: 1.25rem;
  --button-icon-gap: 0.5rem;
  --top-bar-inset: 0.625rem;
  --space-lead-panel-start: 0;
  --story-feature-media-min: 26.25rem;
  --story-feature-media-max: 34.8125rem;
  --story-feature-media-share: 0.5;
}

.dark {
  --color-bar: var(--interactive);
}

@media (min-width: 37.5rem) {
  :root { --top-bar-inset: 1.125rem; }
}

@media (min-width: 48rem) {
  :root { --top-bar-inset: 1rem; --icon-button-size-ghost: 2.25rem; }
}

@media (min-width: 64rem) {
  :root {
    --bar-section-width: 3rem;
    --bar-section-height: 0.5rem;
    --story-feature-media-share: 0.6;
  }
}

/* LeadStory root: container-type: inline-size */
@container (width >= 600px) {
  .lead-story {
    --bar-brand: 0.5rem;
    --space-lead-inset-start: clamp(2rem, 4.2cqi, 2.5rem);
    --space-lead-inset-end: clamp(2rem, 4.2cqi, 2.5rem);
    --space-lead-panel: 1.5rem;
    --space-lead-panel-start: var(--space-lead-panel);
    --space-lead-overlap: clamp(4rem, 10cqi, 6rem);
  }
}

@container (width >= 880px) {
  .lead-story {
    --bar-brand: 0.625rem;
    --space-lead-panel: 2rem;
    --space-lead-panel-start: var(--space-lead-panel);
  }
}

/* Feature split: image column width (C-24, P-2) */
/* clamp(var(--story-feature-media-min), calc((100% - var(--grid-column-gap)) * var(--story-feature-media-share)), var(--story-feature-media-max)) */

/* Named utilities instead of arbitrary variants (DR-287) */
@custom-variant bar-stuck (html[data-bar-stuck] &);
@utility stack-cell {
  display: grid;
  & > * { grid-column: 1; grid-row: 1; }
}
The container rule sets the lead tokens on `.lead-story`, so the `@container` is the parent of `.lead-story`, not the card itself (DR-297). The feature split utilities `story-split-third` and `story-split-feature` and the poll utility `poll-layout` are in `components.css` (DR-297, DR-298).

```

`--color-bar` is the one allowed component color token (color §2.9, DR-294, DR-349). The NewsletterSignup colors (after prototype run 2, DR-239) are in `color-system.md` Section 2.9.

Article page tokens (`--rd-*`, `--ad-inline-w`, `--ad-inline-h`) are in `src/styles/reader.css`, scoped under `.rd`. `spacing-layout-system.md` Section 7A lists them (DR-386). The shadcn `Dialog` motion is the `dialog-panel` utility in `components.css` (DR-390).

## 7. Components

### Story units

#### C-01 LeadStory

**Status:** Approved · **Decisions:** DR-86, DR-87, DR-325

The one lead story of the whole site, in the homepage hero (P-1) only (DR-155). It is the largest story on the page.

**Variants.** None.

| Part | Spec |
| --- | --- |
| `LeadStory.media` | Image, 16:9, square corners |
| `LeadStory.panel` | Text panel. Background = page color (background). No border |
| `LeadStory.bar` | Brand bar: --bar-brand, --color-bar |
| `LeadStory.eyebrow` | Category: type-eyebrow, interactive (link) |
| `LeadStory.title` | type-story-lead, ink, text-wrap balance, max measure-article-title. News link: hover ink-muted, no pressed color, no underline (COL-06, DR-199) |
| `LeadStory.summary` | Optional. type-summary at weight 500 (DR-97), ink-secondary, max measure-deck |
| `LeadStory.meta` | type-metadata at weight 400 (DR-96), --color-meta |
| Spacing | Eyebrow to title --space-lead-eyebrow-title (8px); title to summary space-story-title-summary (8px); summary to meta --space-lead-summary-meta (16px) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Image | Full width | Full width | Full width |
| Brand bar | 6px, top of the panel | 8px, top of the panel | 10px, top of the panel |
| Panel | Covers the image by 32px. Starts at the image start edge (left in Bangla and English); 32px of image shows at the end side. Padding 16px top and end, 0 at the start, so text lines up with the image edge | Covers the image by --space-lead-overlap (10% of the card width, min 64px). Inset --space-lead-inset each side (centered, 32px). Padding 24px | Covers the image by --space-lead-overlap (95px at 952). Inset --space-lead-inset (4.2%, max 40px). Padding 32px |
| Title | type-story-lead | Same | Same, capped by measure-article-title |
| Summary, meta | Shown | Shown | Shown |

**Content.**

- Title, eyebrow and meta are required. The summary is optional.
- Image loads eagerly and is preloaded (fetchPriority high): it is the page LCP (DR-325).
- Editors add an image to every hero story (DR-91). If it is missing or does not load, StoryImage shows the no-image placeholder (DR-338).
- Long title: the panel grows down. Do not reduce the type size.

**Accessibility.**

- Title is an h2 with one link to the story. The image link has tabindex -1 and aria-hidden, so the story has one tab stop.
- The eyebrow links to its category page (separate tab stop).
- Text sits on the page color, never on the photo.

**Checks.**

- No border and border-radius 0 at every size.
- Bar thickness and panel padding are fixed per size (they do not scale). Bar is 6px at 360px, 8px at 768px, 10px at 1366px page width; dark theme bar = interactive.
- At 768px and 1366px the panel space to the image edge is equal on both sides (32px, 40px); it never goes under 32px or over 40px.
- Panel covers the image by about 95px at 1366px (952px card) and 72px at 768px (720px card); 32px at 360px, where the panel starts at the image left edge and leaves 32px at the right.
- Panel background equals the page background in both themes.
- One tab stop for the story, one for the eyebrow.

### Story units (shared cards)

#### C-02 OverlapCard

**Status:** Approved · **Decisions:** DR-91, DR-93, DR-97, DR-98, DR-99, DR-105, DR-106, DR-109, DR-325

The image-led story card with the text block over the image bottom. Used for the two stories under the lead in the hero (P-1) and the first story of the analysis column (P-4). First shared card of the DR-93 merge (DR-106).

**Variants.** surface: background (hero) | elevated (P-4). Sets the text block color to the section background (DR-283).

| Part | Spec |
| --- | --- |
| `OverlapCard.media` | Image, 16:9, square corners (StoryImage). No image: the no-image placeholder (DR-338) |
| `OverlapCard.body` | Text block in the background color of its section (page color in the hero, surface-elevated in P-4), no border. Covers the image bottom by --space-card-overlap from the start edge, stops --space-card-notch short of the end edge |
| `OverlapCard.eyebrow` | Category: type-eyebrow, interactive (link) |
| `OverlapCard.title` | type-story-title, ink, h3. News link: hover ink-muted, no pressed color, no underline (COL-06, DR-199) |
| `OverlapCard.summary` | Optional. type-summary at weight 500 (DR-97), ink-secondary |
| `OverlapCard.meta` | type-metadata at weight 400 (DR-96), --color-meta |
| Spacing | Same gaps as LeadStory: 8 / 8 / 16px (DR-92) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Body | Same look as every width: overlap and notch 40px at 328 (DR-109, replaces DR-94) | Covers the image by --space-card-overlap (10% of card width, 46px at 464); --space-card-notch (10%) of image shows at the end side; padding 16px top and end, 0 at the start (DR-105) | Same |
| Title | type-story-title | Same | Same |
| Place | Phone: stacked under the lead. 768: pair, 348px each. 1024: pair, 312px. 1366: pair, 464px |  |  |

**Content.**

- Editors add an image (DR-91). If it is missing or does not load, StoryImage shows the no-image placeholder (DR-338).
- In the hero, both top-story images load eagerly (DR-325).
- Long title: the body grows down.
- In the pair, each card flows on its own: no shared rows (no subgrid) for title, summary or meta; the cards are top-aligned and may end at different heights (DR-99). This replaces layout L-14 / LAY-08 peer rows for the hero pair.

**Accessibility.**

- Title is an h3 with one link. Image link has tabindex -1 and aria-hidden.

**Checks.**

- No border and border-radius 0.
- Body covers the image by --space-card-overlap and leaves --space-card-notch of image at the end side (46px each on a 464px card, 40px on a 328px card).

#### C-03 StoryList

**Status:** Approved · **Decisions:** DR-93, DR-96, DR-98, DR-101, DR-102, DR-124, DR-125, DR-300, DR-350

Shared list (DR-162, was LatestList): a ul of story items with 16px padding and a 1px rule between rows, no rule after the last. Option columns 1 | 2 (column-first). This sheet gives its first use, HeroSection.latest: the সর্বশেষ (Latest) list in the hero rail (P-1), 5 newest stories as StoryListItem rows. Also used in P-2, P-4, CategoryBlock and RegionSlider.panel.

**Variants.** None.

| Part | Spec |
| --- | --- |
| HeroSection.latest heading | Section divider (C-22: 2px rule with the bar on it, 48 x 8px from 1024, 40 x 8px under 1024, DR-262), then the label সর্বশেষ: type-section-title (serif 22px, 600), h2 |
| HeroSection.latest MoreLink | MoreLink (C-10) আরও দেখুন / See more below the list at the end edge, to /latest (/en/latest). The Latest page is built in M2 (DR-350, amends DR-102) |
| `StoryList.item` | One story row. No image. 1px border rule between rows, 16px padding top and bottom |
| `StoryListItem.title` | type-story-title-sm (serif 18 to 20px, 600), ink, h3 with one link. News link: hover ink-muted, no pressed color, no underline (COL-06, DR-199) |
| `StoryListItem.meta` | category, dot (CPT-10), time: type-metadata at weight 400, ink-muted; same size as every other metadata line (CPT-12) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Items | 5 | 5 | 5 |
| Columns | Phone and 600 to 767: 1 column, rows stack | 768 to 1023: under the hero, full width, 2 columns, column-first (1 to 3, then 4 and 5), --grid-column-gap (24px, DR-300), rules within a column only (DR-125). Built with CSS columns and a column break before item 4, so each column keeps its own row heights. Divider.column-inset between the two columns, centered in the gap (DR-355) | Rail 304px from 1024: 1 column, rows stack |
| Title | type-story-title-sm (18 to 20px) | Same | Same |

**Content.**

- Always 5 stories, newest first (DR-102).
- Title has no line clamp: long titles wrap.
- Meta shows category and relative time only.
- One আরও দেখুন link below the list, to the Latest page (DR-350).

**Accessibility.**

- Heading is an h2; each title is an h3 with one link.
- The dot is aria-hidden.

**Checks.**

- No border-radius. Rules are 1px border color.
- Rail width 304px fixed (LAY).
- One column, except 768 to 1023: 2 columns, column-first (DR-125).
- One MoreLink at the end edge (DR-350).

#### C-24 StoryCard

**Status:** Approved · **Decisions:** DR-93, DR-108, DR-118, DR-119, DR-121, DR-126, DR-152, DR-153, DR-267, DR-283, DR-300, DR-308, DR-325

Shared card from the merge (DR-93): one story with an image and text. Draws every image story that is not a LeadStory or an OverlapCard. Takes over the working name StoryRow (DR-121). Merge approved (DR-153): no approved look changes.

**Variants.** layout: stack | row | row-from-md | row-until-lg (the section sets it; a layout value changes only the grid, never the markup order, DR-283). ratio: 3:2 | 16:9. size: md (type-story-title) | sm (type-story-title-sm, 18 to 20px). split, row only: third (2fr 1fr, DR-108) | feature (DR-118, DR-119 clamp); both use --grid-column-gap between text and image (DR-300). eyebrow and summary optional.

| Part | Spec |
| --- | --- |
| `StoryCard.media` | Image, ratio prop, square corners, grid area media. Link with tabindex -1 and aria-hidden |
| `StoryCard.body` | Grid area body. Markup order follows LAY-14: stack has media then body; row has media then body in the DOM and the grid places the image at the end (DR-267). Eyebrow (optional), title h3, summary (optional, 500), meta. Title: News link: hover ink-muted, no pressed color, no underline (COL-06, DR-199) |
| Spacing | stack: media, 16px, body. Eyebrow to title 8px; title to summary 8px; summary to meta 16px; title to meta 8px when no summary |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| stack | P-2 featureStory under 768 (3:2, md, summary); CategoryBlock featureStory (3:2, md, summary, DR-152) | RegionSlider.panel first story (3:2, sm) | P-2 rail image story in the 304 rail beside (16:9, sm, DR-121) |
| row | P-2 rail image story when the rail stacks, phones too (16:9, sm, third, DR-121) | P-4 AnalysisSection compact rows (16:9, sm, eyebrow, third) | P-2 featureStory from 768 (3:2, md, summary, feature) |

**Content.**

- Editors add an image. If it is missing or does not load, StoryImage shows the no-image placeholder (DR-338).
- Long titles wrap; no clamp.

**Accessibility.**

- Each story is an article with an h3 title link; one tab stop per story.
- Markup order = reading order (LAY-14, DR-267): the image comes before the text in the markup at every layout; in row layout grid areas place the image at the end (no order property).

**Checks.**

- No radius, no card border.
- Every row layout stacks (image on top, text below) when its container is narrower than 17.5rem (@container, rem-based): at 200% text the rows below 1280 stack; at normal text no row stacks. Check the value in the build (A11Y-18, DR-308).
- Image loads lazily, except the hero cards (DR-325).
- The list around the card draws rules and padding, not the card.
- Each place matches its approved board.

#### C-25 StoryListItem

**Status:** Approved · **Decisions:** DR-93, DR-101, DR-102, DR-126, DR-153

Shared card from the merge (DR-93): one story as a text row, title + meta, no image.

**Variants.** None. The meta content changes by place (category and time in Latest; time and read time elsewhere).

| Part | Spec |
| --- | --- |
| `StoryListItem.title` | type-story-title-sm (18 to 20px, 600), ink, h3 with one link. News link: hover ink-muted, no pressed color, no underline (COL-06, DR-199) |
| `StoryListItem.meta` | type-metadata, 400, --color-meta, 8px below the title (CPT-10, CPT-12) |
| List | The parent list (ul / ol) gives 16px padding top and bottom and the 1px rule between rows (C-22 item); no rule after the last row |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Used in | HeroSection.latest, P-2 rail | C-23 CategoryBlock | RegionSlider.panel |

**Content.**

- Long titles wrap; no clamp.

**Accessibility.**

- Title is an h3 with one link. The dot is aria-hidden.

**Checks.**

- No radius, no border. Same look in every list.

### Sections

#### P-2 FeaturedCategorySection

**Status:** Approved · **Decisions:** DR-93, DR-101, DR-103, DR-108, DR-110, DR-118, DR-119, DR-121, DR-122, DR-123, DR-300

The featured category section (P-2: বাংলাদেশ, ভূরাজনীতি): a FeatureStory in the wrapper and a rail with one image story and 2 text rows. Was the C-04 sheet CategoryLead (DR-162).

**Variants.** None. Each card is one CSS grid with named areas (body, media). The page breakpoint switches the columns and areas; the markup does not change.

| Part | Spec |
| --- | --- |
| Heading | Section divider (C-22) + category name, h2, plain text, not a link (DR-122) |
| featureStory (StoryCard) | Grid, areas body + media, top aligned, gap --grid-column-gap (16px under 768, 24px from 768, 32px from 1280, DR-300). From 768: text left, image right; image min 420px, max 557px; 50% of the free width from 768 to 1023 (DR-119), 60% from 1024 (DR-118): minmax(0, 1fr) clamp(26.25rem, calc((100% - var(--grid-column-gap)) * 0.5 \| 0.6), 34.8125rem). Under 768: one column, image on top, 16px, text below (no overlap). Image 3:2. Title type-story-title (fluid 22 to 26px), summary (500), meta. No eyebrow. Not an OverlapCard |
| rail StoryCard, rail beside | Grid, areas media / body in one column: 16:9 image, 16px, title type-story-title-sm (18 to 20px, 600), 8px, meta. Rule below |
| rail StoryCard, rail below | Grid 2fr 1fr, areas body media: text at the start, 16:9 image at the end, gap --grid-column-gap (16px under 768, 24px from 768, 32px from 1280, DR-300), 16px padding (same as the AnalysisSection rows, DR-108). Rule below |
| rail StoryList (2 × StoryListItem) | Title type-story-title-sm + meta, 16px padding, rule between rows (StoryList) |
| MoreLink | আরও দেখুন links to the category page: one per section, below the feature story and the rail, at the section end edge (DR-110, DR-123) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| featureStory | Under 768 (phone and 600 to 767): one column, image then text | 768 to 1023: text : image 276 : 420 at 768, 408 : 420 at 900, 475 : 476 at 1023 (DR-119) | 1024 and up: 204 : 420 at 1024, 280 : 420 at 1100, 352 : 527 at 1279, 352 : 528 at 1280, 371 : 557 at 1328+ |
| featureStory title | 22px | 24px at 768 | 25px at 1024, 26px from 1280 |
| Rail | Below the feature story, stacked | Below the feature story, full width, stacked | 304px rail beside the wrapper from 1024 |
| Rail image story | Row: text left, image right, 2 : 1 (DR-121) | Row: text left, image right, 2 : 1 | 304 rail beside: image on top, text below  |

**Content.**

- Feature story: editors add an image. If it is missing or does not load, StoryImage shows the no-image placeholder (DR-338).
- Long titles wrap; no clamp.
- No rail stories: the wrapper spans the shell (layout P-2).

**Accessibility.**

- Section h2 is plain text; the MoreLink is the category link. Each story is an article with an h3 link.
- The image comes before the text in the markup at every width (C-24, DR-267, DR-348); grid areas move the image. The image link has tabindex -1 and aria-hidden.

**Checks.**

- No radius, no card borders.
- Rail 304px fixed from 1024.
- Grid tracks use minmax(0, Nfr) so long words do not widen a column.
- No order property and no duplicate markup per width.

#### P-4 AnalysisSection

**Status:** Approved · **Decisions:** DR-52, DR-76, DR-93, DR-101, DR-108, DR-110, DR-111, DR-205, DR-224, DR-264, DR-268, DR-300, DR-351

The analysis column (left) of বিশ্লেষণ ও মতামত (P-4): one FeatureStory, then 2 compact stories.

**Variants.** Uses OverlapCard (C-02) for the first story, then compact rows (text + thumbnail at the end).

| Part | Spec |
| --- | --- |
| Section background | Panel band (layout §5.3, DR-264): surface-elevated across the full viewport width; the content stays in the shell (page gutter, 1280px max). Block inset from panel-inset only: 40px under 600px, 48px from 600px; no inline inset. space-module outside as margin (DR-205) |
| Column rule | From 768 (columns side by side): Divider.column-inset between analysis and opinion, 1px solid, border color, 16px from the top and the bottom, centered in the gap. The gap is --space-analysis-gap: 32px at 768 to 1023, 48px at 1024 to 1279, 64px from 1280, a stated exception to --grid-column-gap (layout §3.1, DR-356) |
| featureStory (OverlapCard) | OverlapCard (C-02): image 16:9, text block covers the image bottom by --space-card-overlap (10% of card width), notch --space-card-notch (10%) at the end side; text block background = section background (surface-elevated). Eyebrow, title, summary (500), meta |
| StoryList (2 × StoryCard row) | Grid: text at the start, 16:9 image at the end, text : image = 2 : 1 (grid 2fr 1fr) at every width, gap --grid-column-gap (16px under 768, 24px from 768, 32px from 1280, DR-300). At 200% browser text size the rows stack: image on top, text below, no sideways scroll (DR-81). Eyebrow, title type-story-title-sm (18 to 20px, 600), meta. No summary. Divider.item (C-22) between the rows, the same as every list (DR-268) |
| Eyebrow | The story category (not the word বিশ্লেষণ on every item) |
| MoreLink | আরও দেখুন below the column, aligned to the column end (right) edge, with a right caret (DR-110, C-10) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| featureStory body | Overlap and notch, 40px minimum (DR-109) | Overlap and notch, 40px minimum (348px column at 768) | Overlap and notch 10% of card width (48px at 476, 62px at 624) |
| featureStory title | 22px | 22px | 24px |
| Compact image | 1/3 of the row after the gap: 104px at 328 | 108px at 348 | 150px at 476, 197px at 624 (DR-300) |

**Content.**

- Analysis stories: editors add an image. If it is missing or does not load, StoryImage shows the no-image placeholder (DR-338).
- Long titles wrap; no clamp.

**Accessibility.**

- Each story is an article with an h3 title link; the image link has the title as its name.

**Checks.**

- No radius. No card border.
- Divider.item (1px dotted, space-list-item each side) between the analysis rows (DR-262, DR-268).
- At 200% browser text size the compact rows stack and nothing scrolls sideways (DR-81).

### Section components

#### C-06 OpinionList

**Status:** Approved · **Decisions:** DR-52, DR-76, DR-101, DR-110, DR-112, DR-113, DR-299, DR-300, DR-301, DR-351

The opinion column (right) of বিশ্লেষণ ও মতামত (P-4): a মতামত chip, then 5 opinion pieces as quote rows.

**Variants.** None.

| Part | Spec |
| --- | --- |
| Chip | মতামত: brand fill (light), interactive fill (dark), on-interactive text, type-eyebrow, padding 2px 8px, square corners. Not a link. Replaces the spec accent-subtle chip (DR-112, issue CLR-09) |
| `OpinionList.item` | Grid: quote mark column, gap --grid-column-gap (16px under 768, 24px from 768, 32px from 1280, DR-300), text. No image. Divider.item between items (space-list-item each side, DR-299); the rule spans the text column only, not the quote mark column (DR-351). Chip to the first item: space-section-title-after (20 / 24 / 24, DR-351) |
| Quote mark | Drawn SVG in code (QuoteMark), no icon package (DR-301): viewBox 0 0 44 36, fill currentColor (--color-bar: brand light, interactive dark), paths M0 36V20C0 9 6 2 17 0v6C11 8 9 12 9 17h8v19z and M24 36V20C24 9 30 2 41 0v6c-6 2-8 6-8 11h8v19z. aria-hidden, top aligned with the title. Width 44 / 36 / 28px, height follows |
| Title | type-story-title-sm (serif 18 to 20px, 600), ink, h3 with one link. News link: hover ink-muted, no pressed color, no underline (COL-06, DR-199) |
| Author | Own line: type-metadata at weight 600, ink-secondary, plain text, not a link (DR-112) |
| Time | Own line: type-metadata, weight 400, ink-muted |
| MoreLink | আরও দেখুন at the column end edge (DR-110) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Quote mark | 28 x 23px (phone) | 36 x 29px (tablet 600 to 1023) | 44 x 36px (desktop 1024 and up) |
| Items | 5 | 5 | 5 |

**Content.**

- Always 5 opinion pieces, newest first.
- Long titles wrap; no clamp.

**Accessibility.**

- Chip is a label (p or the column h3), not a link.
- Quote mark is aria-hidden.
- Each item is an article: h3 title link; the author is plain text.

**Checks.**

- No radius on the chip.
- Divider.item between items, no rule after the last (DR-299).
- The item rule starts at the text column (DR-351).

#### C-23 CategoryBlock

**Status:** Approved · **Decisions:** DR-53, DR-93, DR-101, DR-103, DR-110, DR-122, DR-123, DR-126, DR-127, DR-128, DR-134, DR-135, DR-138, DR-139, DR-152, DR-239, DR-240, DR-245, DR-351

One category inside the grouped categories section (P-3): heading, a feature story with image, 2 text rows and আরও দেখুন. Rows of two blocks, an ad-inset between rows, a rail with DailyPoll (C-26). NewsletterSignup (C-14) joins the rail after prototype run 2 (DR-239).

**Variants.** None. The section grid switches columns at the page breakpoints: 2 blocks per row from 600, 1 on phones.

| Part | Spec |
| --- | --- |
| Heading | Section divider (C-22) + category name, h2, plain text, not a link (DR-122) |
| featureStory (StoryCard) | Image 3:2 on top, 16px, title type-story-title (22 to 26px with the page, DR-152), 8px, summary (17px, 500), 16px, meta. Rule below |
| Rows | Two text rows: title type-story-title-sm + meta, 16px padding, rule between (StoryList, as in P-2 and the hero). 3 stories per category (DR-126) |
| MoreLink | আরও দেখুন links to the category page, at the block end edge, pinned to the block bottom so both blocks in a row line up (DR-110, DR-123) |
| ad-inset | Between the two rows of blocks, wrapper width, surface-alt, label বিজ্ঞাপন on a 24px line. 728 x 90 from 1280, 300 x 250 below, phones too. Never after the last row. Space-module above and below belongs to the section |
| Rail | Daily poll in prototype run 2 (DR-239), then from 1280 the ad-rail slot space-module below it: 300×600 or 300×250, reserve 600 (DR-240 to DR-245). No section divider: plain h2 (DR-128), type-section-title 22px (DR-215). At the top of the 304px rail beside the wrapper from 1024; a full row below the blocks under 1024. After run 2 the newsletter sits above the poll, 64px apart beside the wrapper, 48px when the rail stacks (DR-150) |
| Column rule | From 1024 (rail beside the wrapper): Divider.column-inset between the wrapper and the rail only, 1px solid, 16px from the top and the bottom, centered in the existing --grid-column-gap. No rule between category blocks (DR-351) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Blocks | Phone: 1 column, A, B, ad, C, D, then the poll | 600 to 1023: 2 per row (264px at 600, 348px at 768), rail below: the poll as a full row (DR-134, DR-239) | 1024 and up: 2 per row (312px at 1024, 440px at 1280), rail 304 beside |
| ad-inset | 300 x 250 | 300 x 250 | 300 x 250 at 1024 to 1279, 728 x 90 from 1280 |

**Content.**

- 4 categories in wireframe V2 (অর্থনীতি ও বাণিজ্য, নিরাপত্তা ও সংঘাত, প্রযুক্তি, ইতিহাস ও প্রেক্ষাপট). Odd count: the last block keeps its size (layout §7.3).
- Lead story: editors add an image. If it is missing or does not load, StoryImage shows the no-image placeholder (DR-338).
- Long titles wrap; no clamp.

**Accessibility.**

- h2 per category; each story is an article with an h3 link. Poll: radiogroup, vote button, results in role=status.

**Checks.**

- No radius on cards, fields or buttons. No card borders.
- The poll never uses the ad label or ad colors.
- Poll: square marker, no round radio dots (DR-138).
- Spacing between blocks: see L-62 (check in run 2).

#### C-07 RankedList

**Status:** Approved · **Decisions:** DR-44, DR-51, DR-144, DR-145, DR-146, DR-147, DR-148, DR-300

Most read (P-5): the 5 most read stories as a numbered list. RankedList.item = rank numeral + title (DR-162, was RankItem).

**Variants.** None.

| Part | Spec |
| --- | --- |
| Heading | Section divider (C-22) + সর্বাধিক পঠিত / Most read, h2, not a link. No section link (no page behind it) |
| List | ol, 5 items, row-first order. Column gap --grid-column-gap (16px under 768, 24px from 768, 32px from 1280, DR-300). Divider.item between two items in the same column (rules within a column only, as Latest), space-list-item on each side; no rule after the last item of a column (DR-299, DR-300) |
| Numeral | type-rank, interactive, weight 700, 56px from 1024, 44px below (DR-146); Bangla: Noto Sans Bengali, English: Source Serif 4 (DR-147); column 0.75em (42 / 33px), 12px gap to the title; glyph top on the first title line (DR-144). The rank comes from the data (backend query): React writes it in a span with aria-hidden="true", digits in the page language (১ on Bangla pages, 1 on English pages). No CSS counter (DR-290) |
| Title | h3 link, type-story-title-sm 600, ink. No image, no meta. News link: hover ink-muted, no pressed color, no underline (COL-06, DR-199) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Items per row | Phone: 1 | 600 to 1023: 2, item 5 on row 3 | 1024 to 1279: 3, items 4 and 5 on row 2 (DR-145); 1280 and up: 4, item 5 on row 2 (DR-51) |

**Content.**

- Always 5 stories.
- Long titles wrap; no clamp.
- An ad band follows the section.

**Accessibility.**

- The list order gives the rank; the numeral is hidden from screen readers.

**Checks.**

- Numeral glyph top on the first title line (DR-144).
- No radius, no card borders.
- Divider.item between items in a column, none across columns (DR-300).
- At 200% browser text size the list stacks and nothing scrolls sideways (DR-81).

### Section parts

#### C-15 RegionSlider

**Status:** Approved · **Decisions:** DR-19, DR-140, DR-141, DR-142, DR-143, DR-151, DR-227, DR-236, DR-284, DR-291, DR-318

The regions section (P-3b): one column per region in a row that slides, previous / next buttons at the heading end; chips (tabs) on phones.

**Variants.** Slider (600 and up) and chips with one panel (phones).

| Part | Spec |
| --- | --- |
| Heading | Section divider (C-22) + অঞ্চলসমূহ, h2, not a link (DR-159) |
| Buttons | Previous / next at the end of the heading line, 44px squares, interactive fill, on-interactive chevron. Shown whenever more regions exist than are in view (DR-140); CSS hides them when every region fits, no script count (DR-318). At an end: aria-disabled, surface-alt fill, ink-disabled chevron |
| `RegionSlider.panel` | Region name h3 type-story-title-sm, 3:2 image, 3 stories (title type-story-title-sm + meta), rules between. No আরও দেখুন per column |
| Section link | আরও দেখুন at the section end, end edge, every width; links to the regions page (DR-142, DR-160) |
| Chips | Phones only: shadcn Tabs (CPT-16): Tabs, TabsList and TabsTab only; the panels are the slider columns, not Tabs.Panel, which hides them from 600 (DR-348), tabs 44px, as wide as the label, 8px gap, outline (1px border-interactive, no fill); selected = interactive fill; no white chips (DR-140). One panel, h3 visually hidden |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| In view | Phone: chips, 1 region | 600 to 1023: 2 (DR-141) | 3 at 1024 to 1279 (DR-141), 4 from 1280 (DR-140) |

**Content.**

- Working list of 6 regions; the editorial team approves names and order (U-07).
- Long titles wrap; no clamp.

**Accessibility.**

- Buttons are real buttons with aria-label (আগের অঞ্চল / পরের অঞ্চল); focus stays on a disabled-at-end button.
- Phones: tablist, tab, tabpanel.

**Checks.**

- Own slider code, not the shadcn Carousel (CPT-16): its disabled ends and motion differ from DR-140 and DR-151.
- The row is a scroll-snap container (@utility region-row, layout §12.3). One press moves one region: the buttons animate the scroll position one column over --duration-slide (450ms) with ease-slide (cubic-bezier(0.22, 1, 0.36, 1), DR-227, DR-284); no transform. Swipe and keyboard focus scroll the row natively. Button colors fade 200ms (theme default). Phones: a chip press fades the current tab panel out and the new panel in, each --duration-slide (450ms), ease-slide, opacity only (DR-284, DR-346: one motion duration). No motion with prefers-reduced-motion (DR-151). No loop, no autoplay; scrollbar hidden.
- No radius on buttons or chips.
- The slider is the exception to LAY-07 (4 columns from 1280, layout P-3b).

#### C-16 AdSlot

**Status:** Approved · **Decisions:** DR-127, DR-163, DR-197, DR-206, DR-207, DR-233, DR-240, DR-241, DR-242, DR-245, ad proposal (approved 5 Oct), DR-315

One ad row: surface-alt band, 24px label line, creative centered. No padding, margin or gutter (ad proposal). A rail variant for the homepage P-3 rail from 1280 only (DR-240, DR-245): 300×600 or 300×250, reserve 600, space-module below the poll (DR-241, DR-242).

**Variants.** variant="top" | "band" | "inset" | "rail" | "inline" (DR-162 names, DR-197, DR-387). Layout §9 slots: ad-top, ad-band, ad-inset, ad-rail, ad-inline.

| Part | Spec |
| --- | --- |
| `AdSlot.label` | বিজ্ঞাপন (EN Advertisement, IA-06): type-eyebrow 600, ink-muted, centered, line 24px |
| `AdSlot.creative` | Reserved box, centered. top: 320 x 100 under 768, 728 x 90 768 to 1023, 970 x 250 from 1024. band: 336 x 280 under 768 when the viewport is 336px or wider, else 300 x 250 (DR-206), 728 x 90 768 to 1023 (reserve 90, DR-315), 970 x 250 from 1024. inset: 300 x 250 below 1280, 728 x 90 from 1280. rail: 300 x 600 or 300 x 250 from 1280, the 300 x 250 at the top of the 600 reserve; row = rail width 304, surface-alt, label on top; creative box 300 x 600 centered, no padding: w-(--ad-rail-w) h-(--ad-rail-h) (DR-241, DR-245, DR-296). Sizes from the px tokens --ad-*-w and --ad-*-h (layout §12.2, LAY-19): w-(--ad-inset-w) h-(--ad-inset-h) |
| AdSlot band width | top and band: full viewport width. inset: wrapper width; full screen width when the viewport is under 332px (DR-207) |
| AdSlot inline | Article body only, between two paragraphs (layout `LAY-22`). Creative box 300 x 250 at every width, `max-width: 100%`, centered in the reading column: w-(--ad-inline-w) h-(--ad-inline-h). Reserve 274 (label + creative). `data-ad-slot="ad-inline"`. Phase 1 mock: the ad-inset creative (DR-387) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Reserve (label + creative) | top 124, band 304, inset 274 | top 114, band 274, inset 274 | top 274, band 274, inset 114 (from 1280), rail 624 (from 1280) |

**Content.**

- Never sticky. top: Phase 1 leaves the band out when no campaign is booked (DR-250); a booked top never collapses; the Phase 2 house ad is ADS-09. band and inset collapse only when unfilled before they near the viewport.

**Accessibility.**

- Not a landmark: a div, no section element and no aria-label. The visible label বিজ্ঞাপন names the slot and is not aria-hidden (DR-266).

**Checks.**

- No padding or gutter.
- Height reserved before load (no layout shift).

#### C-14 NewsletterSignup

**Status:** Deferred · **Decisions:** DR-128, DR-129, DR-130, DR-131, DR-132, DR-133, DR-134, DR-135, DR-137, DR-224, DR-229, DR-230, DR-231, DR-238, DR-239

Paused for prototype run 2: not built or shown; it comes in a phase after run 2 (DR-239). The approved look below stays the spec for that phase. Newsletter invitation in the P-3 rail (304px) or as a full row under 1024. Own solid surface; never the news look or the ad look.

**Variants.** layout rail | row (600 to 1023: heading on top, line left, form right, DR-135).

| Part | Spec |
| --- | --- |
| `NewsletterSignup.panel` | accent-soft in both themes (light #EDCEC4, dark #3A201A, DR-229). panel-inset (LAY-20): 40 / 32px in a container under 600px (rail, phones), 48 / 40px from 600px (row) (DR-224) |
| `NewsletterSignup.heading` | নিউজলেটার, h2, type-section-title 22px (DR-215), ink. No section divider (DR-128) |
| `NewsletterSignup.line` | গুরুত্বপূর্ণ খবর সবার আগে, প্রতিদিন, বিনা মূল্যে আপনার ইনবক্সে। 16px 500 (DR-130), ink-secondary. 12px below the heading |
| `NewsletterSignup.form` | 48px (h-12) email field with the arrow IconButton filled attached (interactive fill, on-interactive arrow, DR-208 F4); hidden label. Field background, 1px border-interactive, ink text, ink-muted placeholder (DR-229, DR-231). 32px below the line |
| `NewsletterSignup.privacy` | গোপনীয়তা নীতি link at the end edge (CPT-15). UI link: hover interactive-hover, pressed interactive-pressed, no underline (COL-06, DR-199) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Layout | Phone: stacked rail look | 600 to 1023: full row (DR-134, DR-135) | 304 rail from 1024 |

**Content.**

- Error (DR-230): on aria-invalid the field gets a 2px error border, no ring tint; one short message below, linked by aria-describedby, type-ui-sm, ink, with a 20px error icon (COL-09). Done: one line replaces the form (role status).

**Accessibility.**

- Label kept for screen readers. Button aria-label সাবস্ক্রাইব করুন.

**Checks.**

- No radius, no border, no shadow.
- Not surface-alt (ad look).
- Light border-interactive on accent-soft is 3.14:1 (color §3, DR-238).

#### C-26 DailyPoll

**Status:** Approved · **Decisions:** DR-134, DR-138, DR-139, DR-149, DR-236, DR-239, DR-273, DR-277, DR-287, DR-295, DR-298

Daily poll in the P-3 rail: at the top of the rail from 1024 (the only rail module in prototype run 2, DR-239; NewsletterSignup sits above it after run 2); full row under 1024.

**Variants.** state choose | results. layout rail | row.

| Part | Spec |
| --- | --- |
| `DailyPoll.section` | No panel: no background, padding, border, radius or shadow. The poll sits on background like every section. No section divider, no brand bar, no rule (DR-128, DR-273) |
| `DailyPoll.heading` | আজকের জরিপ (Daily poll), h2, type-section-title 22px, ink (DR-215). 16px to the question |
| `DailyPoll.question` | fieldset (border 0, padding 0, margin 0, min-width 0) with the question as legend: type-story-title-sm 20px, ink. 24px to the first option or the first result row (DR-149) |
| `DailyPoll.options` | Choose state. shadcn RadioGroup (CPT-16). 2 to 4 label rows; the whole row is the tap target: flex, align center, gap 12px, min-height 48px, 4px apart. Label type-ui, ink; long labels wrap. No option selected at first. 24px to the button |
| `DailyPoll.marker` | 20px square, no radius, 2px border, aria-hidden. Not selected: border-interactive, no fill. Selected: interactive border with a 12px interactive square inside, inset 2px (padding 2px). Not a full fill (DR-273) |
| `DailyPoll.vote` | Button primary, full width, 48px, no radius: ভোট দিন (Vote) (DR-208). Hover interactive-hover, pressed interactive-pressed. Enabled with no option selected; a press with no choice does nothing and focus stays where it is (DR-348) |
| `DailyPoll.results` | Results state, in role status; replaces the choose state in place, no page reload. No radio and no marker. Per option: label line (type-ui, ink; the own vote adds " · আপনার ভোট" / " · Your vote" in the same style), 8px, then the bar. 16px between rows |
| `DailyPoll.bar` | 32px high, full width, no radius, aria-hidden. Track: border token. Fill from the start edge, width = the rounded percent: own vote interactive, others fill-neutral (#7E7E7E) in both themes (color token, DR-295; 2.72:1 / 2.68:1 on the track, accepted because the percent carries the value) (DR-273) |
| `DailyPoll.percent` | Inside the track at the end edge, 8px in, vertically centered: type-ui-sm, tabular-nums, digits in the page language (৪৬%). Color ink; it switches to the background color when the fill reaches the start of the number (fill end >= track width - 8px - number width; near 85% in the 304 rail, so measure, do not hard-code 85). Switch the whole number, not part of it. Hard to read over the grey fill is accepted (DR-273) |
| `DailyPoll.total` | Vote count, for example ১,২৪৮ জন ভোট দিয়েছেন / 1,248 votes: type-ui-sm, ink-muted, tabular-nums. 16px below the last bar |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Layout | Container under 600px: one column (phones, the 304 rail) | Container 600px or wider (@utility poll-layout): two equal columns with --grid-column-gap; heading and question in the start column, options or results and the button in the end column (DR-298) | 304 rail from 1024: one column |

**Content.**

- 2 to 4 options; long options wrap.

**Accessibility.**

- The shadcn RadioGroup sits in a fieldset; the question is its legend and names the group (no aria-labelledby, DR-273, DR-298).
- Keys: Tab enters the group, arrow keys move the choice, Space selects, Tab reaches the vote button.
- Focus: the base 2px ring outline with 2px offset (COL-13, DR-225); no focus classes, no ring utilities.
- After a vote the vote button is gone: focus moves to the poll heading h2 (tabindex -1, DR-346). Results in role status, so the change is announced. Markers and bars are aria-hidden; the text gives the label, the own-vote tag and the percent.

**Checks.**

- No panel, no radius, no helper lines (DR-138, DR-273).
- The choose and results states share one grid cell, so the height does not jump (DR-287, DR-348). Before the vote a hidden copy of the results (inert, aria-hidden, invisible) holds the cell height.
- One vote per browser, kept in local storage (key fl-poll:<id>, DR-277). A vote cannot be changed. A return visit with a stored vote for the poll shows the results.
- Percents by largest remainder, so the sum is 100 (CMP-29, DR-277). Mock data until M3.

### Small parts

#### C-22 Divider

**Status:** Approved · **Decisions:** DR-87, DR-102, DR-103, DR-262, DR-299, DR-350, DR-351

A thin rule that separates list rows, sections and (option) columns. Dividers and space show grouping; no card borders or surfaces for that (DR-87).

**Variants.** section, item, column-inset, column-full (DR-262). DR-351 sets where column-inset is used (Divider.column); column-full is not used on the homepage. The canvas drawings are stale until the CMP-34 redraw.

| Part | Spec |
| --- | --- |
| `Divider.item` | 1px dotted rule, border color: square 1 x 1px dots with a 2px gap in every browser (DR-351). Draw it with a repeating gradient, not border-style dotted (browsers differ): background-image: repeating-linear-gradient(to right, var(--color-border) 0 1px, transparent 1px 3px); height 1px. Full width of the list, except OpinionList: the text column only (DR-351). 16px space each side (space-list-item), measured to the text ink, not the line box (DR-350): the list takes the ink inset of its roles off its padding (typography §3.1, DR-355). Check: per list, the median space is 16px ±1; each rule is 16px ±3 (the ink depends on the letters, DR-355). Between rows only; no rule after the last row |
| `Divider.section` | 2px solid rule, border color. A bar sits on the rule at the start and shares its bottom edge (the rule runs along the bar bottom). Bar color: brand (light), interactive (dark). Bar size: --bar-section. 12px from the rule to the heading (space-section-rule-title) |
| `Divider.column` | 1px solid vertical rule, border color, centered in the column gap. Two versions: column-inset (16px from the top and bottom) and column-full (full height). Placed (DR-351, DR-355): column-inset in P-4 between analysis and opinion (from 768), in P-3 between the wrapper and the rail (from 1024), and between the two HeroSection.latest columns (768 to 1023). Always centered in the gap; no pixel split. column-full is not used on the homepage |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Item | Same | Same | Same |
| Section bar | 40 x 8px (under 600) | 40 x 8px (600 to 1023) | 48 x 8px (1024 and up) |
| Column | Not shown: columns stack | Where a section sheet places it, when columns sit side by side | Same |

**Content.**

- One color (border). Section rule 2px solid; item rule 1px dotted; column rule 1px solid. No dashed or double rules.
- General rule (DR-299): a group of items of the same kind stacked in a column gets Divider.item between the items (StoryList, OpinionList, RankedList, the AnalysisSection rows, RegionSlider.panel). In a multi-column list the rule runs within a column only (DR-300).

**Accessibility.**

- Decorative: aria-hidden or CSS border. Lists keep ul/li semantics; do not use hr between list items.

**Checks.**

- No other border color or width.
- No rule after the last list item.

#### C-13 SectionHeading

**Status:** Approved · **Decisions:** DR-103, DR-122, DR-159, DR-163, DR-262

The heading of every news and category section: the section divider (C-22) with the bar on the rule, then the section name as plain text (h2). Optional actions slot at the end edge (slider buttons, C-15). Rail modules (NewsletterSignup, DailyPoll) do not use it (DR-128).

**Variants.** actions: none | slot (end edge, 8px gap between controls, row min height 44px).

| Part | Spec |
| --- | --- |
| `SectionHeading.rule` | Divider.section (C-22): 2px border rule, bar on it (--bar-section 40 x 8px under 1024, 48 x 8px from 1024, DR-262), bar brand (light) / interactive (dark). aria-hidden |
| `SectionHeading.title` | h2, plain text, never a link (CPT-13). Serif 600, 22px at every width (Noto Serif Bengali / Source Serif 4), ink, line 1.3. 12px below the rule (space-section-rule-title) |
| `SectionHeading.actions` | Optional. At the end edge, centered on the title line. IconButton filled (C-12) for the slider |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Bar | 40 x 8px (page under 1024, DR-262) | 40 x 8px | 48 x 8px (1024 and up) |
| Title | 22px | Same | Same |

**Content.**

- The label is content and can change (N-02). Long labels wrap; no clamp.

**Accessibility.**

- One h2 per section. The section element is labelled by the h2 (aria-labelledby).
- The rule and bar are decorative.

**Checks.**

- Heading is not a link.
- Bar and rule share the bottom edge.
- No other heading size inside the component.

#### C-10 MoreLink

**Status:** Approved · **Decisions:** DR-110, DR-123, DR-136, DR-160, DR-163, DR-350

The আরও দেখুন link: one per section, at the end of the section and its end edge, to the category page (CPT-14, CPT-15).

**Variants.** None. The label is a prop (default আরও দেখুন; English working label See more, IA-06).

| Part | Spec |
| --- | --- |
| `MoreLink.label` | type-ui-sm weight 600 (BN 15px, EN 14px), sentence case, interactive (DR-216) |
| `MoreLink.icon` | 16px chevron, 2px stroke, square caps, currentColor, 4px after the label, aria-hidden |
| States | hover: interactive-hover. pressed: interactive-pressed. No underline (COL-06, DR-199). focus: 2px ring, 2px offset (COL-13) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Whole link | 44px tap height, end edge | Same | Same |

**Content.**

- One per section (CPT-14). Also under the hero Latest list, to the Latest page (DR-350). Not under RankedList.

**Accessibility.**

- Accessible name gives the target when the label is short: aria-label "আরও দেখুন: বাংলাদেশ" (draft).

**Checks.**

- text-align: end.
- Tap height 44px.
- Chevron mirrors in RTL (none planned).

#### C-08 Eyebrow

**Status:** Approved · **Decisions:** DR-112, DR-153, DR-163

The category label above a story title. A link to the category page. Off when the section heading already names the category (DR-153, CMP-19).

**Variants.** None. No Breaking label in this slot (DR-279).

| Part | Spec |
| --- | --- |
| Eyebrow | type-eyebrow: BN 15px 600; EN 14px 700 uppercase, 0.06em. interactive. UI link: hover interactive-hover, pressed interactive-pressed, no underline (COL-06, DR-199); focus ring |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Eyebrow | Same size at every width | Same | Same |

**Content.**

- The story's own primary category, never the section name and never Fact Check (DR-18).

**Accessibility.**

- A link with its own name. Before the title in the DOM.

**Checks.**

- Not bold above 600 in Bangla.
- No background, no border.

#### C-09 MetaLine

**Status:** Approved · **Decisions:** DR-96, DR-98, DR-100, DR-101, DR-166

The metadata line under a title: time, read time, category or author, joined by the drawn dot.

**Variants.** items: 1 to 3, set by the parent.

| Part | Spec |
| --- | --- |
| `MetaLine.item` | type-metadata at weight 400, --color-meta. BN 15px, EN 14px (CPT-12). Plain text, no links |
| `MetaLine.separator` | 4px square, no radius, --color-meta, 10px each side, centered, aria-hidden (CPT-10, DR-166) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Line | Same at every width; wraps between items | Same | Same |

**Content.**

- Times use the page language numerals.

**Accessibility.**

- time element with datetime for times.

**Checks.**

- No pipes, typed dots or round dots.
- One size per language on the page.

#### C-11 Chip

**Status:** Approved · **Decisions:** DR-112, DR-140, DR-163, DR-222, DR-279

A short square label or a filter button. Three variants.

**Variants.** variant="label" | "filter". No live variant (DR-279).

| Part | Spec |
| --- | --- |
| label | Opinion chip মতামত: brand fill (light) / interactive (dark), on-interactive text, type-eyebrow, padding 2px 8px (py-0.5 px-2). Not a link |
| filter | Region tabs on phones: button 44px, padding 0 16px, type-ui-sm 15px 500. Outline 1px border-interactive, ink text; selected = interactive fill, on-interactive; no hover color and no pressed color (DR-222); focus ring |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| filter | Phones only (DR-140) | Not used | Not used |

**Content.**

- One or two words.

**Accessibility.**

- filter chips are tabs (role tab, aria-selected) in a tablist.
- label is text, not a control.

**Checks.**

- border-radius 0.
- No white chips (DR-140).

#### C-12 Button

**Status:** Approved · **Decisions:** DR-133, DR-138, DR-140, DR-163, DR-165, DR-167, DR-168, DR-169, DR-208, DR-225, DR-227, DR-235, DR-237, DR-303, DR-349

Button (text) and IconButton (icon only). Square, no border, no shadow.

**Variants.** Button variant="primary" | "text"; fullWidth. One size: 48px (no size prop). IconButton variant="filled" | "ghost"; ghost: --icon-button-size-ghost, 32 under 768, 36 from 768 (DR-349); filled: size 44 (default) | "field" (fills the inner height of its field). ThemeButton at every width (DR-349). No outline or secondary button: a second action is a MoreLink. One filled button per block.

| Part | Spec |
| --- | --- |
| Button primary | interactive fill, on-interactive label. Height --button-height 48px, padding 0 --button-padding (20px). Label type-button 600 (BN 15px, EN 14px), one line, no wrap. Width = label + padding, or fullWidth = the column. hover interactive-hover; pressed interactive-pressed; focus: the 2px outline with 2px offset from the base rule (COL-13, DR-225); pointer cursor (base rule, DR-235); disabled surface-alt + ink-disabled, aria-disabled |
| Button text | Search clear button মুছুন / Clear. No fill, ink-secondary label, type-button 600, padding 0 14px (px-3.5), height = its slot (44px or more). hover interactive-hover; pressed interactive-pressed; no underline (DR-199) |
| Button + icon | Icon 20px after the label, gap --button-icon-gap 8px. Not used on the homepage; for later pages |
| Busy | While a form sends (NewsletterSignup, after prototype run 2, DR-239): the fill stays, the label or icon is hidden (width does not change), three 4px squares (CPT-10 shape) show in the center, aria-busy true, a second press does nothing |
| Motion | Colors change over 200ms on every button (theme default transition, DR-227); no transition with reduced motion |
| IconButton filled | Slider buttons (44 x 44): interactive fill, on-interactive icon; at an end surface-alt + ink-disabled (DR-140). Attached submit (size field): square, fills the field inner height (46 in a 48 field: Drawer search, NewsletterSignup after run 2; 54 in the 56 SearchDialog field), same states |
| IconButton ghost | TopBar (menu, search, theme) and the Drawer and SearchDialog close buttons: 32 x 32 under 768 (size bar), 36 x 36 from 768 (size-9), 20px icon, no fill, no wash. Icon ink in both themes; hover interactive-hover, pressed interactive-pressed; focus ring (base rule). The tap area is the button (WCAG 2.5.8, 24 minimum) (DR-349) |
| Icon | --icon-size 20px at every width, Lucide shapes, 2px stroke, square caps, miter joins (BRD-03; base rule svg.lucide, DR-235), currentColor, aria-hidden. 16px only for the MoreLink chevron. Every TopBar icon is 20px (DR-295) |
| PhoneBarButtons | Phone TopBar: the menu IconButton and the ThemeButton are both 32 x 32 (36 from 768, DR-349). Icons are Lucide at 20px, like every TopBar icon (DR-295, DR-301); check the optical center in the build. Language label text 1px lower (padding-top 2px) so its cap height centers on the bar like the icons (DR-177, DR-178) |
| ThemeButton | Every width (DR-349): IconButton ghost, 32 x 32 under 768, 36 x 36 from 768. 20px icon for the theme the press switches to: Lucide MoonStar in light, Sun in dark (DR-253, DR-349). Icon ink in both themes; hover interactive-hover, pressed interactive-pressed; focus ring. role switch, aria-checked = dark, name ডার্ক থিম (DR-167, DR-171). Light first on every device; dark only when the reader turns it on, then remembered; no system theme (DR-201, DR-165). Phone bar: the menu lines start on the 16px gutter and the icon ends on it (DR-176, DR-253) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Button | 48px | Same | Same |
| IconButton | Ghost 32 x 32; filled 44 x 44 | Ghost 36 x 36; filled 44 x 44 | Same |
| Label | type-button BN 15 / EN 14 | Same | Same |
| Icon | 20px | Same | Same |

**Content.**

- Verb labels, one line: ভোট দিন, মুছুন.

**Accessibility.**

- IconButton has aria-label.
- Disabled uses aria-disabled so focus stays (DR-140).

**Checks.**

- border-radius 0, no shadow.
- Tap area 44px or more, except IconButton ghost: 32 under 768, 36 from 768 (DR-349).

### Page chrome

#### C-17 TopBar

**Status:** Approved · **Decisions:** DR-21, DR-41, DR-42, DR-43, DR-165, DR-167, DR-170, DR-171, DR-174, DR-176, DR-177, DR-179, DR-180, DR-234, DR-265, DR-269, DR-287, DR-294, DR-295, DR-306, DR-349

The sticky bar at the top of every page. The top ad band is below the NavBar (below the TopBar under 1280), not above the TopBar (DR-295). Full page width with the page gutter (not the shell). Three groups: menu (and search from 768) at the start, logo in the center, language and theme at the end (DR-170).

**Variants.** None. Contents change at the page breakpoints 768 and 1024.

| Part | Spec |
| --- | --- |
| `TopBar.menu` | IconButton ghost, menu icon, opens the Drawer. All widths |
| `TopBar.search` | IconButton ghost, from 768. Opens the SearchDialog |
| `TopBar.logo` | Center column of a 1fr auto 1fr grid. Text stand-in until BRD-06: type-logo (serif 700, DR-306). At the page top: 32px from 1024, 28px at 768, 20px on phones. When the bar is stuck: 24px (20px phones). The bar height does not change; the logo scales down with a transform (zoom out), --duration-slide (450ms) ease-slide, so the page does not move (DR-295, DR-349). No motion with reduced motion |
| `TopBar.language` | Text link, type-ui-sm weight 600 (typography §7; the size follows the link lang, DR-359), ink, 32px tall under 768, 36px from 768, the same as the icon buttons (DR-349). Bangla pages: En on phones (under 768), English from 768; English pages: বাংলা (T-27, DR-174). UI link: hover interactive-hover, pressed interactive-pressed, no underline (COL-06, DR-349) |
| `TopBar.theme` | ThemeButton (one icon button) at every width (C-12, DR-349) |
| Layout | Flex row, full page width, padding --top-bar-inset (page gutter minus the controls inner space, DR-294). Start and end groups flex: 1 1 0, logo group auto, so the logo stays centered. The gap between menu and search is the same as the gap between language and theme (DR-295). End group gap 4px (EN padding 4px on phones) |
| Surface | background (page color), 1px border rule at the bottom when the bar is stuck, both themes, every width (DR-295). Under 1280 the NavBar is hidden, so the bar is stuck once the page scrolls (DR-348), no shadow. Height --bar-height 56px, 64px from 1024. The site header (TopBar and, from 1280, the NavBar) is sticky at every width: sticky top-0 z-(--z-bar) (DR-234, DR-265, DR-349). Stuck state: past the NavBar the html gets data-bar-stuck; the NavBar slides up under the TopBar and the logo scales (C-18, DR-349); the TopBar shows its rule through the bar-stuck variant in components.css (DR-287) |
| SkipLink | The first focusable element of the page, before the top ad band. Hidden until it gets focus, then shown at the page start with the base focus outline. Text মূল খবরে যান / Skip to main content. Target <main id="main" tabindex="-1"> (the hero; tabindex so Safari moves focus). scroll-padding-top keeps the sticky bar off the target (DR-269) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Contents | menu \| logo \| En, ThemeButton | 768 to 1023: menu, search \| logo \| English, ThemeButton; 56px | from 1024: same, 64px |

**Content.**

- Never shows story content or ads.

**Accessibility.**

- header landmark. Every icon button has an aria-label. ThemeButton is role switch.

**Checks.**

- Logo stays centered at every width.
- No shadow, no radius.
- At 200% browser text size the bar wraps to two lines (row 1 menu and logo, row 2 the controls at the end), stays sticky and never scrolls sideways (DR-81, DR-265).

#### C-18 NavBar

**Status:** Approved · **Decisions:** DR-41, DR-157, DR-223, DR-287, DR-295, DR-349

The row of section links under the TopBar, from 1280 only. Sticky with the TopBar; hides past its row (DR-349, DR-357).

**Variants.** None.

| Part | Spec |
| --- | --- |
| `NavBar.item` | type-nav (typography §7.4, DR-346): Bangla 16px weight 600 (DR-295), English 14px weight 600. The role changes by :lang; no lang-bn variant. Ink, 28px apart (gap-7), centered in the shell (DR-170), row min-h-11 (44px, --nav-row-height; LAY-17, DR-349). The 44px row does not include the 1px bottom rule: 45px in total (DR-349). UI link: hover interactive-hover, pressed interactive-pressed, no underline (COL-06, DR-199) |
| `NavBar.rules` | No rule between TopBar and NavBar: the TopBar drops its bottom rule while the NavBar shows below it; the NavBar keeps a 1px rule at its bottom. When only the TopBar shows, its 1px bottom rule returns (DR-173). Hide (DR-349): the NavBar is part of the sticky site header. When the page scrolls past it, html gets data-bar-stuck and the NavBar slides up under the TopBar (transform, --duration-slide (450ms) ease-slide, DR-346) and is hidden (inert, not in the tab order); it shows again only at the page top. No motion with reduced motion (the NavBar hides at once). The TopBar reads data-bar-stuck (DR-287) |
| `NavBar.current` | interactive text + 3px line (border-b-3, --color-bar) at the row bottom, aria-current page (aria-[current=page]:text-interactive) |
| Surface | Band full width in the page color; the items and the 1px border rule at the bottom are in the shell (DR-357). The item list is one row tall (max-height --nav-row-height, overflow hidden), so the page does not move when the items that do not fit are hidden (LAY-17 exception, DR-359) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Shown | No | No | From 1280 only; only the items that fit, no More item |

**Content.**

- One label per category, the same in the NavBar, the section heading and the Drawer, from the IA label table (U-01, DR-282). Until that table is approved, use the working labels as built (bn.ts). No ফ্যাক্টচেক (DR-18), no চীন (DR-19).

**Accessibility.**

- nav landmark with a label; a list of links.

**Checks.**

- Sticky with the TopBar; hidden past the page top, shown at the page top (DR-349).
- No hidden overflow menu.

#### C-19 Drawer

**Status:** Approved · **Decisions:** DR-21, DR-41, DR-56, DR-170, DR-181, DR-182, DR-185, DR-188, DR-223, DR-226, DR-227, DR-228, DR-280, DR-295, DR-302, DR-306, DR-331, DR-349

Modal menu from the start edge with every section. Opens from TopBar.menu at every width.

**Variants.** None. Phones add the search field first. The pinned social band ends the panel at every width; no সাবস্ক্রাইব (DR-188).

| Part | Spec |
| --- | --- |
| `Drawer.panel` | shadcn Sheet side left, restyled (CPT-16, DR-228). surface-elevated, --drawer-width (320px, or viewport minus 48), full height, no shadow, overlay backdrop behind, z-(--z-overlay). Opens and closes with a --duration-slide (450ms) ease-slide slide from the start edge, the one motion duration (DR-280, DR-346). Panel inset 20px (px-5, LAY-21, DR-223) on the panel content wrapper (the shell); rows, links and dividers do not set their own side padding (DR-295) |
| `Drawer.head` | 56px: logo at the start (type-logo-sm, 24px, DR-306), close IconButton ghost at the end, no rule below (DR-181). Phones (under 768): close button 32 x 32, from 768: 36 x 36; its 20px icon on the 20px panel inset like the logo (DR-209, DR-349) |
| `Drawer.search` | Phones only, first: 44px (h-11) search field, background, 1px border; text at the start; 20px search icon inside the field at the end, ink-muted, aria-hidden (DR-349); no attached button, Enter runs the search (DR-295). On focus-within the border and the icon fade to interactive over 200ms; the base focus outline stays (DR-225). No motion with reduced motion. SearchDialog.field is unchanged |
| `Drawer.item` | type-ui 600 16px, ink, rows min-h-13 (52px; LAY-17, DR-223), 1px rule (rule color) under every category row, inside the shell (not the full panel width) (DR-181, DR-295). For a row with children the rule sits under the parent row; the open child group follows it (DR-295). UI link: hover interactive-hover, pressed interactive-pressed, no underline (COL-06, DR-199). Current page: interactive text, aria-current page (aria-[current=page]:text-interactive), no line (DR-226) |
| `Drawer.accordion` | shadcn Collapsible (CPT-16). The child group opens and closes with a height animation and the caret turns, --duration-slide (450ms) ease-slide (DR-346, DR-349); no motion with reduced motion. Category with children: the label links to the category page; a 44px caret IconButton at the end (20px caret, down when closed, up and interactive color when open; aria-expanded, aria-controls) opens the child list below the row. Child group on a tint (page surface) inside the shell, the same width as the rules (amends DR-185, DR-295), padding 8px top and bottom; children indented 16px, 15px 500, ink-secondary, 44px rows, no rules between children (DR-185). All closed when the Drawer opens; the current category opens (DR-181) |
| `Drawer.social` | Pinned to the panel bottom (stays in view while the list scrolls): surface-alt band, padding 12px 20px, social links centered, 44px taps, 8px apart, ink icons; UI link states: icon interactive-hover, pressed interactive-pressed, no wash (DR-220). Same 5 links as the Footer (DR-182, DR-184) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Contents | search, items \| social band | items \| social band | items \| social band |

**Content.**

- Sub-items: regions under অঞ্চলসমূহ (DR-345); বিশ্লেষণ and মতামত under বিশ্লেষণ ও মতামত, in accordions (Drawer.accordion). No অপ-এড item (DR-302). Both sub-items link to #analysis-opinion-title (the P-4 heading); every # target in the nav must exist (DR-331).

**Accessibility.**

- Modal dialog, page inert (aria-hidden on the page plus the focus trap counts as inert, DR-348). Focus to the drawer panel itself (tabindex -1, DR-249); back to the menu button on close. Escape, close button, backdrop press close it (DR-228). No slide with reduced motion.

**Checks.**

- No shadow, no radius.

#### C-20 SearchDialog

**Status:** Approved · **Decisions:** DR-21, DR-186, DR-187, DR-189, DR-190, DR-191, DR-192, DR-227, DR-228, DR-231, DR-280, DR-349

Search panel from TopBar.search, from 768. Phones search inside the Drawer.

**Variants.** None.

| Part | Spec |
| --- | --- |
| `SearchDialog.panel` | shadcn Drawer from the top, restyled (CPT-16, DR-280); opens and closes with a --duration-slide (450ms) ease-slide slide from the top, the one motion duration (DR-346). surface-elevated, full width at the top, overlay backdrop behind, z-(--z-overlay); padding 96px top, 56px bottom (the height sets the field group apart from the close icon); contents in the shell (DR-190) |
| `SearchDialog.trending` | Below the field, 24px gap, one wrapping line: label ট্রেন্ডিং (Trending on English pages; 15px 600, ink-muted, h2, 24px before the first term), then up to 6 term links that run a search: plain text, type-ui-sm 600 (DR-216), link color (interactive), no underline (hover interactive-hover, pressed interactive-pressed; COL-06, DR-199), 44px tall targets, one wrapping row split by the 4px square separator (DR-166) with 16px each side. Editorial or analytics list, later (DR-190..192) |
| `SearchDialog.field` | 56px (h-14, DR-231), 1px border-interactive, input type="text" with enterKeyHint="search" inside a role="search" form (DR-246: one Escape closes the dialog), hidden label, square submit button attached (interactive fill) |
| `SearchDialog.close` | IconButton ghost, 36 x 36 (DR-349), in the panel top right corner, 12px from the top, glyph on the page gutter (same edge as the TopBar controls), apart from the field group. The field starts below it (DR-186, DR-189). In the source the close button comes after the field group, so one Tab from the panel reaches the field; its corner place is set by position (DR-348) |
| `SearchDialog.clear` | Button variant text (C-12, DR-208): মুছুন (Clear on English pages), type-button 600, ink-secondary, 14px side padding (px-3.5), full field height; shows inside the field while it holds text, before the submit button. It empties the field and keeps focus (DR-186, DR-187) |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Shown | No (Drawer) | From 768 | Same |

**Content.**

- Placeholder খুঁজুন. Results page is IA-10, later.

**Accessibility.**

- Modal, page inert (aria-hidden plus focus trap, DR-348). Focus to the panel itself (tabindex -1, no visible ring), as in the Drawer (DR-249, DR-280); one Tab reaches the field. Escape, the close button and a backdrop press close it, focus back to the search button. No slide with reduced motion.

**Checks.**

- No radius.

#### C-21 Footer

**Status:** Provisional · **Decisions:** DR-59, DR-157, DR-193 (provisional; extension after run 2, CMP-33), DR-224, DR-264, DR-306, DR-314

The minimum footer (DR-59) after the last ad band. Wireframe V2 look: everything centered.

**Variants.** None.

| Part | Spec |
| --- | --- |
| `Footer.panel` | Panel band (layout §5.3, DR-264): surface-elevated across the full viewport width; contents in the shell, so they align with the page gutter (288px at 320). Block inset only: 40px under 600px, 48px from 600px; no inline inset. Contents centered. CPT-15 exception |
| `Footer.logo` | Same stand-in as TopBar.logo: type-logo-sm, 24px (DR-306) |
| `Footer.social` | 5 links 44 x 44 in this order: Facebook, YouTube, X, Instagram, LinkedIn. Filled brand marks (Simple Icons 13.21.0, CC0), drawn in code (SocialIcon), no icon package (DR-301, DR-314), 20px, ink color, each with a text name for screen readers (DR-184). UI link states: icon interactive-hover, pressed interactive-pressed, no wash (DR-220). Placeholder targets: each network front page until the real account URLs are known (DR-278) |
| `Footer.links` | আমাদের সম্পর্কে /about, যোগাযোগ /contact, সংশোধনী /corrections, গোপনীয়তা নীতি /privacy, শর্তাবলি /terms (same paths under /en; 404 until the pages exist, DR-278): type-ui-sm 600 (DR-216) ink-secondary, 24px apart, wrap centered. UI link: hover interactive-hover, pressed interactive-pressed, no underline (COL-06, DR-199) |
| `Footer.copyright` | metadata size, ink-muted |

| Part | Phone or narrow | Tablet or medium | Desktop or wide |
| --- | --- | --- | --- |
| Links | Wrap to 2 centered lines | One line | One line |

**Content.**

- Labels in the page language.

**Accessibility.**

- footer landmark; links in a list.

**Checks.**

- Not surface-alt (ad look).

### Article page

These sheets come from the accepted page spec log `docs/spec-log/article.md`, checkpoint 1 (DR-385, DR-390). The code is in `src/components/reader/` and `src/styles/reader.css`. Layout, widths and spacing are in `spacing-layout-system.md` Section 7A. Colors are in `color-system.md` Section 2.9.

#### C-27 ArticleHeader

**Status:** Approved · **Decisions:** DR-386, DR-388, DR-389, DR-390

The article heading: the category, the title, the deck and the metadata line. The text is in the reading column, centered, left-aligned.

| Part | Spec |
| --- | --- |
| `ArticleHeader.category` | A link to the category page, drawn as a filled button: `--color-bar` fill, `on-interactive` text, `type-eyebrow`; min height 36px, inline padding 14px; hover `interactive-hover`, pressed `interactive-pressed` (`COL-04` exception, DR-389). The row that holds it is the Eyebrow row (`.rd-kicker` in the CSS) |
| `ArticleHeader.title` | `h1`, `type-article-title`, `ink`, `text-wrap: pretty` |
| `ArticleHeader.deck` | `type-deck`, `ink-secondary`, `measure-deck` |
| `ArticleHeader.meta` | Published, updated (when there is one) and reading time in one line, `type-metadata`, `--color-meta`, in a `dl`. The `CPT-10` separator (4px square, 10px on each side, `--color-meta`) comes before each item; a line never starts with a square when it wraps |

Gaps: layout Section 7A.3 (12px, 12px, `space-list-item`, `space-module`).

**Checks.**

- No border, no background on the heading.
- The reading time label is visually hidden; the value shows.

#### C-28 Byline

**Status:** Approved · **Decisions:** DR-386, DR-390

The author under the lead image, in the reading column, after a 1px `border-soft` rule.

| Part | Spec |
| --- | --- |
| `Byline.avatar` | 48px square, `--color-bar` fill, initials in `type-button`, `on-interactive`. `aria-hidden` |
| `Byline.name` | "By" in `ink-muted`, the name in `ink`; `type-ui` |
| `Byline.role` | `type-metadata`, `ink-muted`, 2px below the name |

The avatar and the text are 14px apart.

#### C-29 LeadMedia

**Status:** Approved · **Decisions:** DR-386, DR-390

The lead image with its caption and credit. The lead image is required.

| Part | Spec |
| --- | --- |
| `LeadMedia.image` | Own ratio, centered in `--rd-wide`, up to `--rd-lead-media-max` (32rem) tall; never cropped or stretched (layout Section 7A.5). Loaded first (`preload`, high fetch priority) |
| `LeadMedia.caption` | `type-caption`, `ink-muted`, in the reading column, `space-media-caption` below the image. No caption bar |
| `LeadMedia.credit` | After the caption on the same line, `ink-secondary`, no wrap |

The alt text is the image alt, else the caption.

#### C-30 KeyPoints

**Status:** Approved · **Decisions:** DR-386, DR-388, DR-390

A numbered summary panel at the top of the body.

| Part | Spec |
| --- | --- |
| Panel | `surface-elevated`, `--rd-panel-inset`, no border (`CPT-06`) |
| `KeyPoints.title` | `h2`, `type-article-h3` × reader scale, `ink`, with a 20px `--color-bar` icon |
| `KeyPoints.note` | `type-metadata`, `ink-muted`, at the end of the title row |
| `KeyPoints.item` | Number (two digits in the page language, `type-article-body`, `--color-bar`, `aria-hidden`) in a 40px column, 12px gap, then the text (`type-article-body`, `ink-secondary`). A 1px dotted `border` rule under the text only, 8px on each side |

The list is an `ol`, so the numbers are read once.

#### C-31 ContextCard

**Status:** Approved · **Decisions:** DR-386, DR-388, DR-390

Background to the story, inside the body. A shadcn `Card` (`CPT-16`).

| Part | Spec |
| --- | --- |
| Card | `surface-elevated`, `--rd-panel-inset`, no border and no top bar. Body text `ink-secondary` |
| `ContextCard.icon` | 40px square tile, `--color-bar`, 20px icon in `accent-subtle`. `aria-hidden` |
| `ContextCard.title` | `h2`, `type-article-h3` × reader scale, `ink`. Fixed label প্রেক্ষাপট / Context (DR-383) |
| `ContextCard.teaser` | `type-metadata`, `ink-muted` |
| `ContextCard.part` | Label `h3` in `type-eyebrow`, no uppercase, `--color-bar`, 8px above the text; text `type-article-body` × reader scale. Parts: why, and background when there is one. `--grid-row-gap` between parts |

`space-module` above and below; the anchor target `#context` clears the top bar.

#### C-32 PreferredSourceAlert

**Status:** Approved · **Decisions:** DR-386, DR-389, DR-390

A standing prompt to add Fact Lens as a preferred source on Google. A shadcn `Alert` with `role="note"` (not urgent).

| Part | Spec |
| --- | --- |
| Panel | `surface-alt`, `--rd-panel-inset`, no icon column |
| Title, text | `type-ui` 600 `ink`; `type-ui-sm` `ink-secondary` |
| Button | Outline link: 1px `--color-bar` border and text; hover and pressed fill `--color-bar` with `on-interactive` text. Min height 44px. The Google mark in the text color (no brand colors), the label, an arrow icon. Opens in a new tab (`noopener noreferrer`) |

The button is below the text under 600px and beside it from 600px.

#### C-33 ArticleBody

**Status:** Approved · **Decisions:** DR-386, DR-387, DR-388, DR-390

The article text: paragraphs, `h2` headings, figures, lists, `ContextCard` and `ad-inline` slots.

| Part | Spec |
| --- | --- |
| Paragraph | `type-article-body` × reader scale, floor `--type-body-min`, `ink-secondary`, gap 1.1em, `text-wrap: pretty` |
| `h2` | `type-article-h2` × reader scale, `ink`; `space-module` before, `space-section-title-after` after; clears the top bar as an anchor target |
| `SectionAnchor` | A button after each `h2` that copies the link to the heading. Shows on heading hover or focus; 60% visible on touch screens. `ink-muted` icon; on hover an `accent-subtle` fill and an `interactive` icon (stated exception, DR-391) |
| List | `ul` with a filled square bullet in the text color (0.35em, the shape of the `CPT-10` separator), centered on the first line; 0.55em between items |
| Figure | Full column width, own ratio, `space-module` above and below |
| `ad-inline` | `AdSlot variant="inline"` between two paragraphs only (`LAY-22`) |

#### C-34 Tags

**Status:** Approved · **Decisions:** DR-390

The story tags after the body, below a 1px `border` rule with `space-module` on each side.

| Part | Spec |
| --- | --- |
| Label | `type-eyebrow`, `ink-muted` |
| `Tags.item` | A shadcn `Badge` link, variant outline: 1px `border`, `type-eyebrow` no uppercase, `ink`; hover `interactive-hover`, pressed `interactive-pressed`. 8px gap. Links to `/tag/<tag>` (the tag page is not built yet) |

#### C-35 ReadingTools

**Status:** Approved · **Decisions:** DR-386, DR-390

The reading tools: progress and back to top, minutes left, text size, share, copy link and save. One component with `layout="rail" | "dock"` (`CPT-02`).

| Part | Spec |
| --- | --- |
| Rail (from 1280) | In the start column of the body grid, sticky (layout Section 7A.6). `Toc`, then three groups, each with a `type-eyebrow` `ink-muted` title: reading (`ProgressButton`, percent read, minutes left), text size (the `TextSize` steps inline), share (`ShareDialog` button, `CopyLinkButton`, `SaveButton`). 36px after `Toc`, 28px between groups |
| `Toc` | Contents of the `h2` headings, a `nav`. Links `type-nav`, `ink-muted`, `ink` on hover and when current (`aria-current`). A 2px `border` track on the start side with a `--color-bar` read part and a 10px square marker that glide to the current item |
| Percent read and minutes left (rail) | Percent `type-ui-sm` `ink`; minutes left `type-metadata` `ink-muted` |
| Dock (below 1280) | Fixed bar at the bottom edge, `surface-elevated`, 1px `border-soft` top rule, opaque, no blur. Slides in after the reader starts. `ProgressButton`, minutes left (`type-ui-sm`, `aria-hidden`), a 1px separator, then `TextSize` (in a `Popover`), the `ShareDialog` button and `SaveButton` |
| Icon buttons | `--icon-button-size-ghost`, icon `--icon-size`, `ink`; hover `interactive-hover`, pressed `interactive-pressed`, no wash. Open state (`aria-expanded`): `ink` fill, `background` icon |

#### C-36 ProgressButton

**Status:** Approved · **Decisions:** DR-390

A square frame that fills clockwise from the top start corner as the reader scrolls, with the percent read. A press goes back to the top.

| Part | Spec |
| --- | --- |
| Button | `--icon-button-size`, `surface-elevated`, `ink`. The name says "back to top" and the percent read |
| Frame | SVG, 3px stroke: track `border`, fill `--color-bar` |
| Percent | `type-ui-sm`, tabular digits in the page language. On hover or focus it fades out and an up arrow fades in |
| Done (100%) | `--color-bar` fill, `on-interactive` tick |

#### C-37 TextSize

**Status:** Approved · **Decisions:** DR-388, DR-390

The reader size control: three steps A, A+, A++ (`typography-system.md` Section 4). A radio group; arrow keys move between the steps. The setting is kept on the device.

| Part | Spec |
| --- | --- |
| Step | `--icon-button-size` square, 1px `border`, glyph `type-button` `ink`. Selected: `ink` fill and border, `background` glyph. Hover on a step that is not selected: `surface-alt`, `ink` border |
| `Popover` | In the dock, the steps open from an icon button; in the rail they show inline. Panel `surface-elevated`, 1px `border-soft`, 8px padding, min width 248px; label `type-eyebrow` `ink-muted`. Opens above or below its button. Escape and an outside press close it |

#### C-38 ShareDialog

**Status:** Approved · **Decisions:** DR-389, DR-390

A shadcn `Dialog` (`CPT-16`) to share the article: a network grid and a copy field.

| Part | Spec |
| --- | --- |
| Panel | `surface-elevated` over the scrim, no radius, shadow, ring or blur. Phones: at the bottom edge, full width, slides up. From 600: centered, rises 16px and fades in (`dialog-panel` utility, `--duration-slide`) |
| Network grid | WhatsApp, Facebook, X, LinkedIn, Telegram: 3 per row, 4 from 600. Each option: icon in a `--icon-button-size` box, `ink`; on hover the option fills `surface-alt` and the icon turns `interactive-hover`. No network colors |
| Copy field | 48px tall, 1px `border-interactive`; the URL field and a copy button |

#### C-39 CopyLinkButton and SaveButton

**Status:** Approved · **Decisions:** DR-390

Two icon buttons of `ReadingTools`, with the `ReadingTools` icon button look.

| Part | Spec |
| --- | --- |
| `CopyLinkButton` | Copies the article link and shows a toast |
| `SaveButton` | Saves the article on the device (local storage). `aria-pressed` shows the state; the icon changes when saved; shows a toast |

#### C-40 Popover

**Status:** Approved · **Decisions:** DR-390

The small panel that opens from an icon button (`TextSize` in the dock, `C-37`). Its own component, so later tools can share it (`N-04`). Layer `--z-popover`.

#### C-41 SelectionShare

**Status:** Approved · **Decisions:** DR-386, DR-390

A bar over selected article text to copy the quote or share it on X or WhatsApp. `role="toolbar"`.

| Part | Spec |
| --- | --- |
| Bar | Fixed above the selection (layout Section 7A.6), `ink` fill, `background` text, 4px padding, a 12px pointer below. Fades in |
| Button | 38px tall, 12px inline padding, `type-ui-sm` with the button weight, 20px icon; hover `interactive` fill, `on-interactive` text |

#### C-42 Toaster

**Status:** Approved · **Decisions:** DR-386, DR-390

A short confirmation (link copied, saved). `role="status"`, `aria-live="polite"`.

| Part | Spec |
| --- | --- |
| Toast | Fixed, bottom center, 100px above the bottom edge. `ink` fill, `background` text, `type-ui-sm`, a 20px `--color-bar` icon. Fades in and rises 16px |

## 8. Open items

| Item | What to do now |
| --- | --- |
| Footer (C-21) | Provisional. Run 2 builds the drawn look. The design extension comes after run 2 (CMP-33). |
| SearchDialog Trending terms | The term source (editorial or analytics) is not decided. Use mock terms. |
| RegionSlider region list | The editorial team sets the regions and their order (U-07). Use the 7 working regions as built (bn.ts). The final list and order go in the IA label table (DR-342). |
| English labels | Working labels until IA-06. |
| Logo | Text stand-in until the logo file exists (BRD-06). |
| ArticleHeader category row | The CSS name is `.rd-kicker`; the row is the Eyebrow row. Rename it when the heading is rebuilt (spec log SL-22). |
| Tag pages | Not built; `Tags` links lead to a 404 page for now. |
