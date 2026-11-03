# analysis progress

Branch `page/analysis` · Brief `docs/briefs/analysis.md` · Issue IMP-18 (`/analysis` part) · Started 2 Nov 2026

This file is the memory of the work. tajmin clears the context often; a new session knows only what this file, the brief and the code say. The session-start hook prints the "Now" section and the last log entry on this branch.

## How to keep it

- Update it **before you stop**: after each checkpoint, after each batch of tajmin's tweaks, and before a long command or a question to tajmin. Do not wait for "next".
- Write everything the work adds, changes or decides, also what is not a spec item: files, components, props, tokens, CSS classes, strings (`bn.ts` and `en.ts`), mock data, tests, renames, removed code, helpers.
- Name the code by `file` and symbol (component, function, token, class). Do not write line numbers: they move. `/checkpoint` adds them in the spec log.
- Write tajmin's words for each decision and tweak, with the date. "Next" or "go on" is not an approval (`AGENTS.md` Section 8).
- If a later step undoes an earlier one, change the earlier entry and say so. The file says what is true now.
- At the final checkpoint, `/checkpoint` makes the spec log and the spec updates from this file.

## Now

- State: PR #23 open to `dev`. The PR 23 review fixes (spec changes) are uncommitted, waiting for tajmin's commit yes.
- Next step: on tajmin's yes, one commit and push to PR #23. After the merge: AGENTS.md Section 9 step 6.
- Open: U-60 (English NavBar at 1280).
- Uncommitted: the spec changes below.

## Decisions

| Date | Decision | Source |
| --- | --- | --- |
| 2 Nov 2026 | Page order: header, ad-top, PageTitle band (same as the other pages), hero (no rail), mosaic with the ad rail, ad-band, More stories as on the category page | tajmin, the /task request (then "create page/analysis branch", run as a page) |
| 2 Nov 2026 | A short description below the page title | tajmin: "Add a short description below page title." |
| 3 Nov 2026 | Description text: bn "ফ্যাক্ট লেন্স টিমের বিশ্লেষণ, ব্যাখ্যামূলক প্রতিবেদন ও বিস্তারিত ফিচার", en "In-depth analysis, explanatory journalism and long-form narratives by Fact Lens Team"; no measure cap | tajmin: "text summary after page title. add it. dont wrap the text" |
| 2 Nov 2026 | Hero (replaced, see the next row): the homepage P-2 feature card. Title, deck, meta, plus the category Eyebrow | tajmin: "its the same as feature card in the category sections in homepage ... For below 768 i agree with you." / "Title, deck, metadata, except it also has category eyebrow" |
| 4 Nov 2026 | Hero image 3:2 | tajmin: "image: keep 3:2 for the hero." |
| 4 Nov 2026 | Hero title: type-story-lead (StoryCard size `lead`), `text-wrap: pretty`, text : image stays 1 : 2 | tajmin: "use the lead story/feature font sizes from category page" / "Keep pretty as is" |
| 3 Nov 2026 | Hero back to text left, image right: the P-2 feature card (StoryCard `row-from-md`, `feature` split), text : image = 1 : 2, no image cap | tajmin: "no. will revert the lead story card. lets go back to image right, text left." / "lets go with 1:2 ratio for text to image there" |
| 2 Nov 2026 | Hero (replaced by the 3 Nov row): the category page feature card, OverlapCard `feature`, across the shell, no rail; with the category Eyebrow, title, deck, meta | tajmin: "change of plan. use the overlap panel card as used in every category hero, except we wont have a rail here." |
| 2 Nov 2026 | Mosaic: 2x2 grid as the homepage grouped categories, with the homepage hero top story cards (OverlapCard, C-02): eyebrow, title, deck, meta | tajmin: "Like the grouped categories in the homepage. 2x2 grid. eyebrow, title, deck, metadata all. ... use the top story cards from the home here." |
| 2 Nov 2026 | No section headings. The hero and mosaic are either featured/top stories or the most recent: not decided yet; the page should stand out from the news page | tajmin: "no headings. these are either featured/top story or most recent. Not decided yet, but the idea is to make the page stand out from news page." |
| 2 Nov 2026 | More stories: MoreStoriesSection, dated rows, 10 then 10, category Eyebrow, analysis only, newest first, no repeats | tajmin: "yes." (question 6) |
| 2 Nov 2026 | Sparse: 1 story shows the hero only; 2 to 4 fill the mosaic as far as they go; no list stories removes More stories and its ad band. No noindex rule | tajmin: "yes" (question 7) |
| 2 Nov 2026 | Mosaic rail: the ad rail from 1280 only; from 1024 to 1279 the rail column stays empty. Flag U-54, High | tajmin: "Keep empty rail, open a flag in the issue file as high because i think this is absurd. will fix it later." |
| 2 Nov 2026 | The বিশ্লেষণ / Analysis nav child is the current item in the dropdown and the drawer | tajmin: "yes" (question 8) |

## Log

### Checkpoint 1: route, data, nav current item, title band (2 Nov 2026)

- Built: `/analysis` and `/en/analysis` (no longer a 404): header, ad-top, the PageTitle band with the description, footer.
- Code: `src/app/[lang]/analysis/page.tsx` (`AnalysisRoute`, `generateMetadata`: title, description, hreflang alternates); `src/components/analysis/AnalysisPageView.tsx` (`AnalysisPageView`, h1 id `analysis-title`); `src/content/types.ts` (`AnalysisPage`: `lead`, `top`, `more`); `src/content/index.ts` (`getAnalysisPage`: every analysis story newest first, lead = newest, top = next 4, more = the rest).
- Code: `src/components/layout/PageTitle.tsx` (`PageTitle`): new optional `description` prop, a `p` with `data-page-title-description`, `type-deck text-ink-secondary` (now `type-summary`, see 3 Nov), `mt-3` (12px, as the article title to deck). Spec item: new part `PageTitle.description` for C-43 (the sheet says "No description" today in the code comment only).
- Code: `src/components/header/navItems.ts` (`getNavItems`): the Analysis child is `current` on `/analysis`. `src/components/header/Drawer.tsx` (`DrawerItem`): child links get `aria-current="page"` and `aria-[current=page]:text-interactive`; the বিশ্লেষণ ও মতামত accordion opens on its own (the existing current-child rule). Spec item: C-19 Drawer child current state. The NavBar has no dropdown, so only the Drawer shows it.
- New tokens: none.
- New components or parts: `AnalysisPageView` (page view), `PageTitle.description` (part, C-43).
- Rules used: TYP-14, TYP-18, COL-05, COL-13, COL-17, LAY-14.
- Strings: `analysisPage.description` in `bn.ts` and `en.ts` (draft text, tajmin to confirm). Title is `analysisOpinion.analysis`.
- Checks: `pnpm typecheck`, `pnpm lint` pass. Browser: bn at 800, en at 1280, Drawer current item shows; no console errors.
- Tests: none yet (checkpoint 5).
- Gaps and flags: no type role names a page description; `type-deck` is the neutral choice (Section 8). U-54 (empty rail) is open.

### Checkpoint 2: hero (2 Nov 2026)

- Built: the hero, the newest analysis story across the shell, no rail, as the category page feature story.
- Code: `src/components/analysis/AnalysisHeroSection.tsx` (`AnalysisHeroSection`): a `Shell` `section` (`data-section="analysis-lead"`, hidden `h2` `analysis-lead-title`), `OverlapCard` (C-02) `feature` (title `type-story-lead`, ends with `--space-lead-panel`), `eyebrowMode="category"`, `eager`; image 16:9 across the shell; title `h3`, summary, meta. `AnalysisPageView`: the hero after the PageTitle (`mb-(--space-module)`), `pb-(--space-section)` after it.
- New tokens: none. New components: `AnalysisHeroSection` (section of the page). Spec item: C-02 `feature` place on the analysis hub, with the `category` Eyebrow and across the shell (on the category page it sits in the wrapper, no Eyebrow).
- Rules used: DR-325 (eager hero image), DR-417 (category Eyebrow in the hub), DR-338 (no-image placeholder), CPT-04, CPT-09.
- Strings: `analysisPage.lead` (hidden h2): প্রধান বিশ্লেষণ / Lead analysis.
- Checks: typecheck, lint pass. Browser: bn at 360 (no side scroll) and 1280 (image 1217 x 685). The newest mock analysis story has no image, so the hero shows the no-image placeholder (a hard case, DR-338).
- Space after the hero: `space-section` (my choice; tajmin to confirm).
- Tweaks from tajmin (2 Nov 2026), in order:
  1. "the image of the lead story should be bigger. any solution in the existing design?" The first build was the P-2 feature card (StoryCard `row-from-md`, 3:2, `feature` split, text start, image end); its image is capped at `--story-feature-media-max` (557px, DR-297).
  2. "option 1 could be a solution. but i dont want 3:2 aspect ratio for image." / "use 16:9, i want check visually first." → tried 16:9 with a new token `--story-analysis-lead-media-max` and utility `story-feature-uncapped` (about 711 x 400 at 1280).
  3. "does not look good i guess. change of plan. use the overlap panel card as used in every category hero, except we wont have a rail here." → the OverlapCard `feature` above. The token and the utility of step 2 are removed; the StoryCard version is gone. This replaces the 2 Nov decision "Hero: the homepage P-2 feature card".

### Checkpoint 3: mosaic and ad rail (2 Nov 2026)

- Built: the 4 stories after the hero as a 2 x 2 grid of OverlapCards, with the ad rail beside it from 1280.
- Code: `src/components/analysis/AnalysisTopSection.tsx` (`AnalysisTopSection`): a `Shell` `section` (`data-section="analysis-top"`, hidden `h2` `analysis-top-title`), `WithRail`: `Wrapper` (`data-analysis-top-wrapper`) with a `PeerRow` (`data-analysis-top`, `items-start`; 1 per row below 600, 2 from 600, as the hero top stories and `groupedRow`) of `OverlapCard` (C-02, not `feature`, `eyebrowMode="category"`, lazy images); `Rail` (`data-analysis-top-rail`, `max-xl:hidden`) with `AdSlot variant="rail"`. `AnalysisPageView`: the mosaic after the hero, `pb-(--space-module)` (the ad band follows, LAY-12).
- The Rail is not drawn below 1280, so below 1024 it adds no `space-module` row; from 1024 to 1279 the `with-rail` grid keeps the 304px column empty (U-54). Wrapper width at 1024: 633px.
- Column rule and row rules: see "Mosaic rules" (4 Nov 2026) at the end.
- New tokens: none. New components: `AnalysisTopSection` (section of the page). Spec item: C-02 place on the analysis hub (2 x 2, category Eyebrow), C-16 `rail` place beside it.
- Rules used: LAY-05, LAY-07, LAY-09 to LAY-13, LAY-14, DR-99, DR-240, DR-245, DR-417.
- Strings: `analysisPage.top` (hidden h2): শীর্ষ বিশ্লেষণ / Top analysis.
- Checks: typecheck, lint pass. Browser en: 1280 (4 cards, rail ad 304px), 1024 (empty rail column), 360 (1 per row, no side scroll).
- Mock data: of the 4 mosaic stories only one has a summary, so three cards show no deck (OverlapCard shows the summary when the story has one).

### Checkpoint 4: ad band, More stories, sparse cases (2 Nov 2026)

- Built: the `ad-band` after the mosaic, then More stories as on the category page.
- Code: `AnalysisPageView`: `AdSlot variant="band"`, then `MoreStoriesSection` (`stories={page.more}`, `eyebrow`: the `category` Eyebrow on every row; its own SectionHeading আরও পড়ুন / More stories, `data-section="category-more"`, `h3` titles; `pt-(--space-module)` after the ad row, LAY-12). 10 first, then 10 per press, focus to the first added title (checked: 14 rows after one press, the button goes).
- Sparse (tajmin, 2 Nov 2026): no list stories → no ad band and no More stories; the mosaic shows what there is (`PeerRow`, 1 to 4 cards); no mosaic stories → the hero is followed by the ad band (hero `pb-(--space-module)`) or ends the page (no padding: `main` ends with `space-section`). With the mosaic, the hero has `pb-(--space-section)`; the mosaic has `pb-(--space-module)` only before the ad band.
- New tokens: none. New components: none. Reused: `MoreStoriesSection` (no change).
- Rules used: LAY-09 to LAY-13, DR-417, Section 7.3.
- Checks: typecheck, lint pass. Browser bn 1280: main order header (title band), analysis-lead, analysis-top, ad-band, category-more; load more works; no console errors. The sparse cases are not shown in the browser (no sparse mock for this page); unit tests at checkpoint 5 cover them.

### Tweaks after checkpoint 4 (3 Nov 2026)

- Tweak from tajmin: "\"Fact Lens টিমের বিশ্লেষণ, ব্যাখ্যামূলক প্রতিবেদন ও বিস্তারিত ফিচার/ In-depth analysis, explanatory journalism and long-form narratives by Fact Lens Team\" text summary after page title. add it. dont wrap the text" → `analysisPage.description` in `bn.ts` and `en.ts` replaced (the draft text of checkpoint 1 is gone). `PageTitle.description` adds `max-inline-none`: the `type-deck` measure (`measure-deck`, 36rem) no longer caps it, so it runs the shell width. One line from 1024 in both languages (en at 1280: 1217px wide, one 32px line); it still wraps where the shell is narrower (en at 360: 3 lines), as TYP-09 and LAY-17 need (no clamp, no smaller text).
- Rules: TYP-12 (line length in the measures): the description has no measure now. Spec item, needs tajmin's yes at /checkpoint. T-27: the bn text had the Latin "Fact Lens"; tajmin: "in bangla, replace with ফ্যাক্ট লেন্স" → bn now starts "ফ্যাক্ট লেন্স টিমের".
- Other: the stale `next start` server on port 3000 (PID 1478) was stopped on tajmin's yes ("Yes, stop it"); the dev server runs again.

### Hero back to the feature split, text : image = 1 : 2 (3 Nov 2026)

- Tweaks from tajmin: "no. will revert the lead story card. lets go back to image right, text left." Then, after the text : image numbers (the P-2 split is image 60% of the row minus the gap, clamped 420 to 557px; on the homepage the wrapper is narrow, so the cap never applies and P-2 reads 2 : 3): "lets go with 1:2 ratio for text to image there".
- Code: `src/components/analysis/AnalysisHeroSection.tsx`: `OverlapCard` replaced by `StoryCard` `layout="row-from-md"`, `ratio="3:2"`, `size="md"`, `split="feature"`, `eyebrowMode="category"`, `eager`, `className="story-split-lead"`. This replaces checkpoint 2 step 3 (the OverlapCard hero).
- New tokens (`src/styles/components.css` `:root`, CPT-07): `--story-analysis-lead-media-share` = calc(2 / 3); `--story-analysis-lead-media-max` = 100% (no cap). New utility `story-split-lead` sets `--story-feature-media-share` and `--story-feature-media-max` to them on the hero card; the 420px min stays. Spec item: C-24 feature split, analysis hub hero place.
- Ratio 3:2: confirmed by tajmin (4 Nov 2026): "image: keep 3:2 for the hero." First my choice from tajmin's question "if i want to display image in 3:2 aspect ratio and the editorial board uploads a 16:9 image -how will we address that?" (answer: `object-cover` crops about 8% from each side; a focal point field later).
- Measured (en): text | image (image height): 1920: 416 | 832 (555); 1280: 395 | 790 (527); 1024: 312 | 625 (416); 768: 227 | 454 (303); 360: stacked, 328 wide (219). No side scroll. At 768 the text column is narrow (227px): the title wraps to many lines.

### Description size (3 Nov 2026)

- Tweak from tajmin: "Summary text - decrease size" (the PageTitle description, which tajmin calls the text summary after the page title) → `PageTitle.description` role `type-deck` (18 to 22px, 400) replaced by the next smaller role `type-summary` (BN 17px, EN 16px, 500; typography 3.1). `max-inline-none` stays (no measure). Measured at 1280: bn 17px, one 27px line; en 16px, one 24px line.
- Spec item: the C-43 `PageTitle.description` part takes `type-summary`, ink-secondary, 12px (`mt-3`) after the title.

### type-deck token change (3 Nov 2026)

- Tweaks from tajmin: "17px is too little, earlier it was 21px right?" → yes (type-deck at 1280: bn 21, en 22; no role between type-summary and type-deck). tajmin asked where a merge into type-deck at bn 18 to 20px would land (answer: only the article deck `.rd-summary` in `src/styles/reader.css`, `ReaderPage`; no test pins it). Then: "use 18-21 for english instead of 22. update it first. and add it as type-deck token".
- Code: `src/styles/typography.css`, `type-deck` role tokens changed by tajmin's decision: EN `--type-deck-size` clamp(1.125rem, 1.052rem + 0.326vw, 1.312rem) (18 to 21px, the old BN curve; was 18 to 22px, clamp(1.125rem, 1.027rem + 0.435vw, 1.375rem)); BN `--type-deck-size` clamp(1.125rem, 1.076rem + 0.217vw, 1.25rem) (18 to 20px, the `type-story-title-sm` curve; was 18 to 21px). Weight and line height unchanged (EN 400, 1.45; BN 400, 1.55).
- `PageTitle.description` back to `type-deck` (from `type-summary`), `max-inline-none` stays. Measured: 1280 bn 20px (one 31px line), en 21px (one 30px line); 360 en 18px.
- Impact: the article page deck (`.rd-summary`) is 1px smaller at the wide end in both languages, and scales from the new base with the reader size (TYP-15).
- Spec item (red until tajmin's yes at /checkpoint, though tajmin asked for it): `typography-system.md` 3.1 `type-deck` row (EN 18–21px, BN 18–20px) and the Section 8 CSS; rule note: `.claude/rules/styles.md` says token values come from the spec, so the spec must follow at /checkpoint. The full `pnpm test:e2e:chromium` run is needed (token CSS changed, AGENTS.md Section 11).

### Hero title size (4 Nov 2026; the `lg` step is replaced, see the end)

- tajmin asked whether the fixed 12px title to description gap is standard (answer: yes, gaps inside a component are fixed in this system; module and section gaps grow). Then: "got it. increase the title font size of the lead".
- Code: `src/components/story/StoryCard.tsx` (`StoryCard`): new `size` value `lg` → `type-story-title-lg` (typography 3.1: EN 26–34px, BN 26–32px, 600; "Second-level story in a lead group (not on the homepage)"), through a `titleClass` map (md and sm unchanged). `AnalysisHeroSection`: `size="lg"` (was md, `type-story-title` 22–26px).
- Measured: 1280 bn 32px (3 lines, 117px), en 34px (114px); 768 en 29.5px (165px, the 227px text column); 360 en 26px. No side scroll.
- Spec item: C-24 StoryCard size `lg` (Variants: size lg | md | sm), its place: the analysis hub hero.
- Other option not taken: `type-story-lead` (30–42px), the LeadStory role.
- Tweak from tajmin: "use the lead story/feature font sizes from category page" → the size `lg` is replaced by `lead` → `type-story-lead` (typography 3.1: EN 30–42px, BN 28–40px, 600), the role of the category page feature story (OverlapCard `feature`). `StoryCard` `size`: "lead" | "md" | "sm"; `lg` is gone (no other user). `AnalysisHeroSection`: `size="lead"`.
- Measured: 1280 en 42px (4 lines, 181px), bn 40px (144px), the same as the category feature title (bn 40px at 1280); 768 en 35.3px (229px in the 227px column); 360 en 30px. No side scroll. Story unit tests: 51 passed.
- Spec item: C-24 StoryCard size `lead` (type-story-lead), its place: the analysis hub hero.

### Hero title wrap (4 Nov 2026)

- Tweak from tajmin: "the lead story in analysis reaches 3 lines for title, and leaving a huge gap between it and the image regardless of 32px spacing. lets change the wrap." → `story-split-lead` (`src/styles/components.css`) sets `text-wrap: pretty` on the card title (`& :is(h2, h3, h4)`), in place of the `type-story-lead` `balance`. Exception to TYP-13 (balance on the lead story role): spec item, needs tajmin's yes at /checkpoint.
- Measured at 1280, space from each title line end to the image (the 32px gap included). bn: balance 119 / 59 / 82; pretty 39 / 91 / 130 (same as plain wrap). en: balance 107 / 166 / 118 / 85; pretty 107 / 73 / 118 / 178. Pretty fills the first lines and leaves the last short; the space stays large because a 40–42px title in a 395px column fits 2 or 3 words a line. Options given: text : image 2 : 3, a smaller title, or keep. tajmin: "Keep pretty as is" (4 Nov 2026).

### Rule below the hero (4 Nov 2026; the dotted rule is replaced, see the end)

- Tweak from tajmin: "use a dotted rule below lead story" → C-22 had no standalone dotted rule (Divider.item is for list rows only), so: new `Divider` variant `dotted` (`src/components/layout/Divider.tsx`, `data-divider="dotted"`, aria-hidden) with the new utility `divider-dotted` (`src/styles/components.css`: `--divider-rule` high, the Divider.item gradient: 1px dots, 2px gap, `--color-border`).
- `AnalysisPageView`: between the hero and the mosaic, in a `Shell` (`data-analysis-lead-rule`); the hero `pb-(--space-module)`, the mosaic `pt-(--space-module)` (was the hero `pb-(--space-section)`). No rule when the mosaic is empty (the ad band or the page end follows the hero).
- Measured at 1280: rule 1217 x 1px, 40px to the hero card and 40px to the mosaic (space-module).
- New tokens: none. New part: Divider.dotted (C-22). Spec item: C-22 gets a `dotted` variant; the Divider checks say "item rule 1px dotted; rule 1px solid" (line "No dashed or double rules" still holds).
- Tweak from tajmin: "change it to 1px solid rule" → the existing `Divider variant="rule"` (C-22 Divider.rule: 1px solid, `bg-border`). The `dotted` variant and the `divider-dotted` utility are removed again (`Divider.tsx` is back as on `dev`); no Divider spec item is left. Spacing unchanged: space-module on each side (40px at 1024 and up). Measured at the pane width (en): 961 x 1px, 40 / 40.

### Column rule in the mosaic (4 Nov 2026; removed again, see the end)

- tajmin: "keep the rule. lets use a vertical between rail and container below hero" → `AnalysisTopSection`: `WithRail className={dividerColumn.rail}` (C-22 Divider.column-inset, DR-351: a 1px solid rule in the middle of the column gap from 1024, `--divider-column-inset` 16px from the top and the bottom), as P-3. No new CSS.
- Measured (bn): 1280 rule at 896.5px of the grid (wrapper ends at 905 − 24 shell start = 881, gap 32 → middle 897); 1024 at 644.5px. From 1024 to 1279 the rule stands beside the empty rail column (U-54).
- The solid rule below the hero stays (tajmin: "keep the rule").
- tajmin: "remove the rule. not looking good." → the vertical column rule is removed (`AnalysisTopSection` back to a plain `WithRail`). The mosaic has no column rule. The solid rule below the hero stays.

### Mosaic rules (4 Nov 2026; the rules within the grid are removed, see the end)

- tajmin: "Here is the idea. Bring back the rule. But also use dotted rule within the grid horizontally."
- Code: `AnalysisTopSection`: `WithRail className={dividerColumn.rail}` again (the vertical column rule from 1024, C-22 Divider.column-inset, DR-351). The `PeerRow` gets `gap-y-0`; after each card but the last a `Divider variant="dotted"` with `col-span-full my-(--space-list-item)` (16px each side, the layout 3.1 "a rule between rows uses space-list-item on each side"); after an odd card (1st, 3rd) it is `sm:hidden`, so from 600 there is one rule between the two card rows and below 600 (1 per row) a rule after every card. The rules are aria-hidden divs inside the grid.
- `Divider` variant `dotted` and the utility `divider-dotted` (`src/styles/components.css`) are back (removed earlier the same day): `--divider-rule` high, the Divider.item gradient (1px dots, 2px gap, `--color-border`).
- Measured (bn): 1280 one dotted rule 881px wide, 16 / 16 to the cards, the column rule on; 600 one rule 552px, no column rule (below 1024); 360 three rules 328px, 16 / 16. No side scroll. The space is measured to the card boxes, not to the text ink (DR-350 trims lists to the ink; the OverlapCard has no ink trim).
- Spec item: C-22 Divider.dotted (a standalone dotted rule); the mosaic row rules.
- tajmin: "the vertical rule is inset variant. use the regular" → Divider.column-full (C-22 sheet: "column-full (full height)", no CSS until now). New utility `divider-column-rail-full` (`src/styles/components.css`, as `divider-column-rail` with `inset-block: 0`, from 1024) and `dividerColumn.railFull` (`Divider.tsx`). `AnalysisTopSection`: `WithRail className={dividerColumn.railFull}`. Measured at 1280: the rule runs the full 809px of the grid (top 0, bottom 0). Spec item: C-22 column-full gets its first place and its CSS.
- tajmin: "increase the current gap between two rows of the grid. 32px in 1280, 24px below 1280 and such." → the dotted row rule takes `my-(--grid-column-gap)` (was `my-(--space-list-item)`, 16px): 32px from 1280, 24px from 768, 16px below 768, on each side of the rule. The same token sets the horizontal gap the column rule sits in. Measured (bn): 1280 32 / 32; 1024 24 / 24; 600 16 / 16; 360 16 / 16 (3 rules). Not the layout 3.1 "space-list-item on each side" for a rule between rows: spec item.
- tajmin: "mistake. i meant to say total 32px between two lines" → new component token `--space-analysis-top-rule` = calc(var(--grid-column-gap) / 2) (`src/styles/components.css` `:root`, CPT-07); the rule takes `my-(--space-analysis-top-rule)`. Total between the card rows (rule included as 1px): 32px from 1280 (16 / 16), 24px from 768 (12 / 12), 16px below 768 (8 / 8). Measured (bn) 1280 16 / 16, 1024 12 / 12, 360 8 / 8. Before both of tajmin's changes it was 16 / 16 (space-list-item) at every width, so below 1280 the rows are now closer than at first.
- tajmin: "use two vertical inset rules" → asked where; tajmin: "Between the cards, per row" (the full-height rule to the rail stays). Code: `AnalysisTopSection` now renders the cards two by two (`pairs`): a `div[data-analysis-top]` with one `PeerRow` per row (`data-analysis-top-row`, `items-start gap-y-0`, `dividerColumn.pair` when the row has two cards); `RowRule` (Divider.dotted, `my-(--space-analysis-top-rule)`) between the rows, and inside a row before the second card with `sm:hidden` (the phone rule between stacked cards). New utility `divider-column-pair` (`src/styles/components.css`: Divider.column-inset, centered, `--divider-column-inset` 16px from the top and the bottom, from 600) and `dividerColumn.pair` (`Divider.tsx`).
- Measured (bn): 1280 two inset rules, each in the middle of its row gap (440.5px of a 881px row), 16px from the top and the bottom; 600 the same (275.5px); 360 no column rule, 3 dotted rules. No side scroll.
- Spec item: C-22 column-inset place: between the cards of a mosaic row, from 600.
- tajmin: "remove the rules and borders within the grid - all o them. just keep the rail rule." → the mosaic is a plain `PeerRow` again (`items-start`, the `--grid-row-gap` between the rows, 24px at 1280), no rules within the grid. Removed: the dotted row rules, the `pairs` rows and the inset column rules between the cards; the `Divider` `dotted` variant, the utilities `divider-dotted` and `divider-column-pair`, `dividerColumn.pair` and the token `--space-analysis-top-rule`. Kept: the full-height rail rule (`divider-column-rail-full`, `dividerColumn.railFull`). Measured at 1280: no `data-divider` in the mosaic, the rail rule on, no side scroll.
- What is true now for the mosaic: OverlapCard 2 x 2 (`PeerRow`), the rail with `ad-rail` from 1280, Divider.column-full between the wrapper and the rail from 1024. Spec items left from these rules: C-22 column-full (first place and CSS). The Divider.dotted and the row spacing items are gone.
- tajmin: "just increase the gap between two rows to 32px for 1280." → new component token `--space-analysis-top-row-gap` (`src/styles/components.css`, CPT-07): `var(--grid-row-gap)`, and 2rem (32px) from 1280; the mosaic `PeerRow` takes `gap-y-(--space-analysis-top-row-gap)`. Measured (bn): 1280 32px, 1024 24px, 360 20px (the row gap, unchanged below 1280). Spec item: the mosaic row gap.

### Rail ad from 1024 (4 Nov 2026)

- tajmin: "let the ad stay from 1024 whenever the rail is displayed." → `AdSlot` (`src/components/ads/AdSlot.tsx`): new prop `railFrom` ("xl" default, the homepage P-3 rail from 1280, DR-245; "lg" from 1024, row class `hidden lg:grid justify-items-center`). `AnalysisTopSection`: `Rail className="max-lg:hidden"`, `AdSlot variant="rail" railFrom="lg"`. Measured: 1024 the rail ad shows (304 x 624, the 600 reserve + the 24 label), 1023 rail and ad hidden; the homepage P-3 rail ad still hidden at 1024. No side scroll.
- U-54 (empty rail 1024 to 1279) is answered by this: at /checkpoint remove the row from `docs/ISSUES.md` and record the decision in the spec log. Spec item: C-16 rail variant from 1024 on the analysis hub (amends DR-240, DR-245 for this page); layout Section 9 ad-rail row.
- tajmin also asked about the phone lead title (28px bn, every other title 22px): answered in chat (the same role and size as the homepage LeadStory and the category feature on phones). No change.

### Lead title below 600 (4 Nov 2026)

- tajmin: "will change the category and homepage too. i think below 600 the difference is too visible. propose size below 600" → proposals (a lower curve; then a steeper curve below 600 only); tajmin: "I am fine with whatever we have above 600 currently. dont want to change that. propose below 600 only." then "use the same card titles instead below 600, so everything looks similar".
- Code: `src/styles/typography.css`: `@media (width < 37.5rem)` on `:lang(en), :lang(bn)` sets `--type-story-lead-size`, `-line` and `-tracking` to the `type-story-title` tokens. From 600 the lead keeps its curve (EN 30–42px, BN 28–40px). Applies to every `type-story-lead` user: the homepage LeadStory (P-1), the category feature (OverlapCard `feature`) and the analysis hub hero.
- Measured: en 360 lead 22px / 25.52 / -0.22px = the card title; 599 23.04px both; 600 lead 33.1px (the old curve), card 23px; 1280 42 / 26. bn 360 22px / 27.72 both. Homepage lead and category feature at 360: 22px. No side scroll. Token unit tests: 15 passed.
- The lead title jumps about 10px at 600 (23 → 33px EN, 23 → 31px BN): tajmin's choice; told in chat.
- Spec item: `typography-system.md` 3.1 `type-story-lead` below 600 = `type-story-title`, and the Section 8 CSS. Homepage change (DR-434): the P-1 lead on phones. Full `pnpm test:e2e:chromium` needed (hero.spec.ts and site.spec.ts check the lead role class, not its size).

### Checkpoint 5 and /checkpoint (4 Nov 2026)

- Tests: new `src/components/analysis/analysis.test.tsx` (page order, sparse cases, hero and mosaic parts, nav current child), `src/app/[lang]/analysis/metadata.test.ts`, `tests/e2e/analysis.spec.ts` (order, description, analysis only and newest first, 15 widths with hero split, 3:2, lead size below 600, mosaic columns, rail ad from 1024; load more; focus ring; Drawer current child; axe light and dark at 360 and 1280). Changed: `src/content/content.test.ts` (`getAnalysisPage`), `src/components/layout/layout.test.tsx` (PageTitle description), `src/components/story/story-units.test.tsx` (size lead, md, sm), `src/components/ads/AdSlot.test.tsx` (`railFrom`). The Drawer current-item test is in `analysis.spec.ts`, not `header.spec.ts` as the brief said.
- Review fixes: the `AnalysisPageView` mosaic comment says the rail ad shows from 1024; `PageTitle` comment rewrapped; `AGENTS.md` Section 5 lists `app/[lang]/analysis/` and `components/analysis/`.
- Spec log `docs/spec-log/analysis.md`: AN-01 to AN-15; green written into layout 2.33 (7F, 7C.2), component-system 1.29 (Section 3, Section 6, C-02, C-19, C-22, C-24), agent-contract 2.23. Red (flags): AN-07 (U-55), AN-11 (U-56), AN-12 (U-57), AN-13 (U-58), AN-14 (U-59). U-54 removed (answered by the 1024 rail ad). New U-60 (NavBar parent item). IMP-124 (editor picks) was added, then discarded by tajmin (see the log entry after the final checkpoint).
- Checks: `pnpm check` passes (lint, typecheck, 357 unit tests, build); full `pnpm test:e2e:chromium` 977 passed; design-reviewer: pass, 0 blockers.

### After the final checkpoint (4 Nov 2026)

- tajmin: "Remove IMP-124 - discard it." → the editor picks row (IMP-124 then) is removed from `docs/ISSUES.md`; the newest stays the stand-in. IMP-124 is now the DR-330 row below.
- tajmin, on U-60: "split the navbar item into analysis only. it will link to hub. opinion is on hold for now." → `src/components/header/navItems.ts` (`getNavItems`): the parent `analysis-opinion` (label `analysisOpinion.title`, `#analysis-opinion-title`, children Analysis and Opinion) is replaced by one item `analysis`: `analysisOpinion.analysis`, `/analysis`, `current` on `/analysis`, no children. No Opinion item. The `section` helper is gone (no # link left). The homepage P-4 heading and its id stay.
- Tests: `analysis.test.tsx` nav test (one item, no children, current on /analysis, no opinion); `header.spec.ts`: drawer 9 rows, 1 caret, 8 sub-links, no # link and no opinion link in the NavBar and the Drawer, nav targets end with `/analysis`; "a drawer link closes the drawer and moves focus to its target" became "a drawer link closes the drawer and opens its page"; `motion.spec.ts` --scroll-offset test follows an in-page # link made in the test. The DR-330 focus code in the Drawer has no user and no test now: IMP-124.
- Measured (en, 1280): the NavBar hides Analysis for lack of room, also on /en/analysis; from 1366 it shows. bn shows it at 1280. In U-60.
- Spec log: AN-15 amended (no child is current today), AN-16 new, Changed rule, red (U-60). `component-system.md` C-19 and layout 7F.1 no longer name the Analysis child.
- Checks after the nav change: lint, 357 unit tests; full `pnpm test:e2e:chromium` 975 passed, 2 failed: `article.spec.ts` "header section links point to targets on the homepage (DR-331)" (bn, en) needed a # link in the nav. It is now "header links go to pages: no # link is left (DR-331)"; `article.spec.ts` 50 passed. design-reviewer: pass.

### PR 23 review (4 Nov 2026)

- The automated review on PR 23 (`claude[bot]`, 1 summary, 6 inline comments) asked, for each of AN-07, AN-11 to AN-14 and AN-16: drop the code until tajmin approves, or approve and put the spec change in this PR. tajmin: "Check the review comments from the PR. Add the spec changes." → approved; written into the specs:
  - typography 2.22: 3.1 `type-deck` EN 18–21px, BN 18–20px and the Section 8 CSS (AN-13); 3.1 `type-story-lead` below 600 and the Section 8 media query (AN-14); TYP-12 exception for the PageTitle description (AN-12); TYP-13 exception for the hero title (AN-07).
  - component-system 1.29: C-16 `railFrom` (AN-11); C-18 `NavBar.item` link and `NavBar.current`, C-19 Sub-items (AN-16); C-43 `PageTitle.description` part (AN-12); Section 6 `story-split-lead` with `text-wrap: pretty` (AN-07); Section 3 PageTitle row.
  - layout 2.33: Section 9 `ad-rail` row (AN-11); 7F.1 header, page title and mosaic rows.
  - agent-contract 2.23: Sections 1 and 5 typography 2.22; Section 3 analysis row.
- Spec log: the six items green (tajmin's approval); no flag open. ISSUES: U-55 to U-59 removed; U-60 keeps only the English NavBar at 1280 (hidden up to about 1365px).
- Review points not changed: `mt-3` on the description is a scale class used by one component, which CPT-07 allows (a token only for shared or off-scale values); `37.5rem` in the media query is the `sm` breakpoint written as the specs write it (`@media (min-width: 37.5rem)` in the spec CSS); no overflow at 1024 and 1180 in bn is already in `analysis.spec.ts` (the 15 widths).
- tajmin asked where `mt-3` and `37.5rem` are and whether they follow the spec convention (answered: `PageTitle.tsx` description gap, a one-component scale step per CPT-07, the same 12px as the article `--rd-head-title-deck`; `typography.css` and typography Section 8, the rem breakpoint form of the spec CSS, `width <` as layout Section 12). tajmin: "Keep mt-3" (4 Nov 2026). No change.

### PR 23 second review (4 Nov 2026)

- tajmin: "Check comments again." Second review (1 fix, 2 notes):
  - Fix: `motion.spec.ts` --scroll-offset test used a link made in the test. Now it follows the real SkipLink (`#main`) with Tab and Enter; `main` stops at 80px, NavBar hidden. bn and en: 2 passed.
  - Note: the DR-331 article test and the DR-330 drawer test changes are now listed in the spec log section "Test changes from AN-16".
  - Note (AN-13): measured on the dev server, bn and en at 360 / 768 / 1280: article deck bn 18 / 18.9 / 20px, en 18 / 19.3 / 21px; the analysis description the same; lead title (category feature and analysis hero) 22px at 360, bn 33.3 / 40px, en 35.3 / 42px at 768 / 1280; no side scroll. The article (320 / 768 / 1280) and category (13 widths) e2e ran in the full Chromium run after AN-13 (977 passed).

### PR 23 third review: the rail ad (4 Nov 2026)

- Review blocker (`AdSlot.tsx`, LAY-10, LAY-19): with `railFrom="lg"` the rail row showed from 1024, but `--ad-rail-w` and `--ad-rail-h` were set only from 1280 (`layout.css`), so from 1024 to 1279 the creative box had no reserved size. The e2e only checked visibility.
- tajmin: "check the review comment. lets make this ad behavior available for any page at whatever breakpoint the rail is displayed fro" → the rail ad follows the rail column on every page:
  - `src/components/ads/AdSlot.tsx`: `rowClass.rail` is `hidden lg:grid justify-items-center` (was `xl:grid`); the `railFrom` prop and `railFromLg` are removed.
  - `src/styles/layout.css`: `--ad-rail-w` 300px and `--ad-rail-h` 600px move from the 80rem block to the 64rem block.
  - `AnalysisTopSection`: `<AdSlot variant="rail">` with no prop. `GroupedCategoriesSection` (homepage P-3): the rail ad now shows from 1024 below the poll (was 1280; amends DR-245). Comments updated in both.
  - Tests: `AdSlot.test.tsx` (the railFrom test removed with the prop; the rail test: hidden under 1024, `lg:grid`); `grouped.test.tsx` (`lg:grid`); `grouped.spec.ts` (rail ad 304 x 624 space-module below the poll from 1024); `page.spec.ts` (hidden under 1024); `ads.spec.ts` comment; `analysis.spec.ts` (from 1024 the reserved box is 300 x 600 and the row 624). Chromium: analysis, ads, page, grouped 176 passed.
  - Specs: layout 2.33 Sections 7.2 (hide list, P-3 row, P-3 rail), 9 (`ad-rail` row, notes), 12.2 CSS, the DR-245 note amended, 7F.1; component-system 1.29 C-16 (rail variant, creative), C-23 rail row, Section 3 P-3 `adRail`; agent-contract DR-239 row. Spec log AN-11 rewritten.
- Checks: lint, unit tests, full `pnpm test:e2e:chromium` 977 passed.
- tajmin: "you should have updated the outdated pr message" → the PR 23 description is rewritten to the current state (all items green, the rail ad on every page from 1024, the nav, specs incl. typography 2.22, the three review rounds, open U-60 and IMP-124). `pnpm check` passed after the rail ad change. From now on, update the PR description with each push that changes what it says.

### PR 23 fourth review (4 Nov 2026)

- tajmin: "check the review comments again. some of them are not marked outdated. a couple of items have been raised again, including test gap for TYP-12 exception AN-12". 13 review threads, none resolved; 3 outdated (code changed). The others stay "not outdated" because their lines did not change: the rule changes were approved in the specs, not in the code.
- New in this round:
  - Test gap AN-12 (`PageTitle.tsx`): `type-deck` and `max-inline-none` both set `max-inline-size`; only class names were tested. `analysis.spec.ts` layout test now asserts the computed `max-inline-size: none` and that the description is as wide as the shell content, at all 15 widths, bn and en.
  - DR-330 drawer test (`header.spec.ts`, raised again): the Drawer `onNavigate` focus code has no test (IMP-124). Waiting for tajmin: a component test of `onNavigate`, or remove the code.
  - Reuse note: `divider-column-rail-full` repeated the `::after` of `divider-column-rail`. Now `divider-column-rail` reads the helper `--divider-column-block` (fallback `--divider-column-inset`), and `divider-column-full` sets it to 0; `dividerColumn.railFull` = `divider-column-rail divider-column-full`. Spec CSS (component-system Section 6, C-22 row) and spec log AN-10 follow. `analysis.spec.ts` asserts the rule top 0, bottom 0, 1px from 1024; the homepage P-3 inset rule is checked by `grouped.spec.ts` (`columnRule`). Unit 164 passed; analysis and grouped e2e 116 passed.
- tajmin asked whether the DR-330 test is required (answered: only if the code stays). tajmin: "remove the code. we are not using any # link" → `src/components/header/Drawer.tsx`: `linkTarget`, `addedTabIndex`, the `onOpenChangeComplete` focus handler and `finalFocus` are removed; `onNavigate` only closes the Drawer (focus returns to the menu button as on any close); the doc comment says every nav item goes to a page. No spec text described the behaviour. IMP-124 removed from `docs/ISSUES.md`; spec log "Test changes from AN-16" says the code went with the test. Unit 356 passed; header, motion, analysis, article, small-parts e2e 253 passed; `pnpm check` passed.
- Full `pnpm test:e2e:chromium` after the fourth-review changes: 977 passed.
