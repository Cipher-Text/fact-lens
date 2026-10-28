# Task: URL format, home and article (run 1 of 2)

Status: Ready, waiting for tajmin's "go" · Issue: IMP-97 · Asked by tajmin, 28 October 2026

This is a task file, not a brief. Start the work with `/page url-format`. Draft the brief (`docs/briefs/url-format.md`) from this file (`AGENTS.md` Section 9). Run 2 (category page formats) is a separate task. It starts after this branch merges (Section 9 below).

The decision register is not in this repository. This file gives each rule in full. The DR IDs are for reference only.

## 1. Goal

Change the site to the approved URL format and content model. Do it on every page, but change the layout only on the homepage and the article page:

- One article URL, `/story/<slug>-<id>`, for every format.
- Three formats: news, analysis, opinion.
- No Bangladesh category. South Asia takes its place in the nav and on the homepage.
- Topics, not tags. Regions get their own URLs.
- The Eyebrow shows the format where the rules below say so.

## 2. Branch

Use the existing branch `page/url-format` (`git fetch`, then check it out). It already holds the spec updates of Section 5 (tajmin, 28 Oct 2026): build the code to match them. Use a `page/` branch because the spec hook allows spec edits only there (`AGENTS.md` Section 10).

## 3. Rules to build

### 3.1 Article URLs (DR-413, amends DR-397)

- Every format uses `/story/<slug>-<id>`. English adds `/en` in front: `/en/story/<slug>-<id>`. There is no `/opinion/<slug>-<id>` article root.
- `<id>`: 6 to 8 base36 characters (`0-9a-z`). It is fixed for the article's life, and both languages share it. Mock data gets made-up ids.
- `<slug>`: lowercase Latin and hyphens. Both languages use the same slug (the Bangla page uses the English slug). The backend makes slugs later; mock data keeps its current slugs.
- No trailing slash, no date, no category in the path.
- The page finds the article by `<id>` only. A wrong or old slug gets a **301** to the current URL. Use a status of 301, not 307 or 308. The Next.js `permanentRedirect()` sends 308, so do the redirect in the proxy or a route handler, and say in your summary where you put it.
- Bare `/story` and `/en/story` give a 404. An unknown `<id>` gives a 404.

### 3.2 Formats (DR-414)

- `Format = "news" | "analysis" | "opinion"`. Remove `explainer`. There is no op-ed format.
- Hubs: `/latest` (news), `/analysis` (label বিশ্লেষণ / Analysis), `/opinion` (label মতামত / Opinion). They are flat: there is no `/analysis/<format>`, `/insight` or `/voices`.
- These hub pages are **not** built in this task. Their links lead to a 404 until their own page branch (IMP-18).

### 3.3 Categories and South Asia (DR-412, amends DR-399)

- Categories: `geopolitics`, `security`, `history`, `economy`, `technology`. Remove `bangladesh` from `categoryIds`, `bn.ts`, `en.ts` and every user.
- Fact Lens is an international outlet based in Bangladesh. It has no domestic news.
- South Asia (দক্ষিণ এশিয়া / South Asia, `/regions/south-asia`) replaces বাংলাদেশ in the nav and on the homepage.
- `/category/bangladesh` gives a 404. It needs no redirect, because it was only on the preview site.

### 3.4 Regions (DR-411)

- A region answers "where", a topic "what or who", a category "which beat".
- URLs: `/regions` is the hub, and each region is `/regions/<slug>`. Region pages are **not** built in this task (404 until their branch).
- A story has one or more regions: `regions: RegionId[]`, not one `region`. A region is what the story is about, not the dateline.
- Region list (tajmin 28 Oct, Q4): `americas`, `europe`, `russia`, `middle-east`, `south-asia`, `china`, `asia`, `oceania`, in this order. Remove `india`, `myanmar`, `southeast-asia` and `africa`. Countries are data under a region, not regions.
- Code must work with any number of regions. The backend owns the list later.
- Labels: চীন, ইউরোপ, মধ্যপ্রাচ্য and দক্ষিণ এশিয়া exist or are approved. The labels for americas, russia, asia and oceania are **not approved**. Propose bn and en labels at checkpoint 1 and wait for tajmin's yes.

### 3.5 Topics (DR-410)

- Do not use the word "tag" in code, CSS, strings or specs. Use "topic".
- URL: `/topic/<slug>` and `/en/topic/<slug>`, flat. Bare `/topic` is a 404. Topic pages are **not** built in this task.
- A topic has one key, one Latin slug, a bn label and an en label. It exists in both languages. Change `tags: string[]` in `reader-articles.ts` to topic keys, with a topic table that holds the slug and labels.
- The article-end list (`ArticleParts.tsx` around line 188, spec `Tags.item`) becomes `Topics` / `Topics.item`. It looks the same as now. Each link goes to `/topic/<slug>`.

### 3.6 Menu (DR-414, replaces DR-331 for these items)

- The বিশ্লেষণ child goes to `/analysis` and the মতামত child to `/opinion` (`src/components/header/navItems.ts`). They no longer link to `#analysis-opinion-title`.
- The South Asia item goes to `/regions/south-asia`, in the place of the Bangladesh item.
- The Regions children go to `/regions/<slug>`. The Regions parent goes to `/regions`.
- **Flag (no rule):** the parent item বিশ্লেষণ ও মতামত still links to the homepage section `#analysis-opinion-title`. Keep it as it is and raise a flag in your checkpoint 2 note.
- Update the comment at the top of `getNavItems` to match.

### 3.7 Card and list Eyebrow (DR-417)

- C-08 `Eyebrow` gets one more mode. In `format` mode it shows বিশ্লেষণ / Analysis and links to `/analysis`. The default mode shows the category and links to the category page, as now.
- Use `format` on analysis cards in **mixed** lists: the homepage lead, top stories, the region columns and More stories.
- Inside an analysis section or the `/analysis` hub, analysis cards show the category (as now; `component-system.md` P-4 Eyebrow row, line ~704: "not the word বিশ্লেষণ on every item").
- News cards show the category. Opinion keeps the quote rows (OpinionList.item) with no Eyebrow.
- A parent still leaves the Eyebrow out when the section heading already names the category (DR-114).

### 3.8 Article page Eyebrow (DR-416, tajmin Q1)

- **News:** one category link to the category page.
- **Analysis and opinion:** two C-08 text links with a separator, for example বিশ্লেষণ · অর্থনীতি ও বাণিজ্য. The format links to `/analysis` or `/opinion`, and the category to its page.
- No filled button. This replaces the `ArticleHeader.category` filled button (`--color-bar` fill, DR-389) on **every** article, news included. Use the C-08 text link style: `type-eyebrow`, `interactive`, hover `interactive-hover`, pressed `interactive-pressed`, no underline.
- Separator: a middle dot `·`, in `ink-muted`, `aria-hidden="true"`, with an inline gap on each side. If no spacing token fits, propose one (`CPT-07`) in your note.
- Wrap: each part wraps as a whole unit, and the separator stays with the first part.
- Article pages only. Cards and list items keep the one-part Eyebrow (3.7).
- SL-22 can come in the same step: rename `.rd-kicker` / `.rd-cat` to Eyebrow names.
- A later, optional format description line under the Eyebrow is **not** in this task.

### 3.9 Homepage (DR-412, tajmin Q3; an exception to the homepage lock DR-370)

- The P-2 featured section বাংলাদেশ becomes দক্ষিণ এশিয়া. Its stories are the stories with region `south-asia`. Its আরও দেখুন link goes to `/regions/south-asia`. The section id becomes `region-south-asia`.
- `FeaturedCategorySection` must accept a region as well as a category. Do not copy the component.
- The region slider/columns use the new region list (3.4). Regions with no stories do not show, as now.
- Change nothing else on the homepage.

### 3.10 Mock data (DR-412, tajmin Q4)

- 22 stories have `category: "bangladesh"` (`stories.ts`, `category-stories.ts`, `category-stories-older.ts`). Remap each one:
  - When it is about South Asia beyond domestic news, give it the beat that fits its content and region `south-asia`.
  - When it is domestic-only, remove it. `chattogram-rain-warning` is removed.
  - `river-data-framework` gets a beat and region `south-asia`.
- At checkpoint 1, show the remap as a table (slug, old category, new category, regions, or "removed") for tajmin's check.
- The 5 `explainer` stories become `analysis`.
- Give every story an `id` and `regions`. Update `category-most-read.ts`, `homepage.ts` (featured, region order, sparse plans) and `content.test.ts`.
- Keep the sparse and long-headline test cases working (`spacing-layout-system.md` Section 7.3 and 13).

### 3.11 Missing translation (DR-401)

Check what the code does now, and report it. If an article is missing in the other language, do not emit an hreflang to that language. The language switch goes to the article's category page in the other language, with a short note, for example "This story is in Bangla only". The note text goes in `bn.ts` and `en.ts`. Build it only if it is missing.

## 4. Checkpoints

Stop after each one, post a short note, and wait for "next" (`AGENTS.md` Section 9).

1. **Content model and mock data** (3.2, 3.3, 3.4, 3.5 data part, 3.10). Show the remap table and the proposed region labels.
2. **URLs and nav** (3.1, 3.5 links, 3.6, 3.11). Update `storyHref`, the story route and every hard-coded `/story/` and `/tag/`.
3. **Card Eyebrow** (3.7).
4. **Homepage South Asia** (3.9).
5. **Article Eyebrow** (3.8).
6. **Final checkpoint** (`/checkpoint`): the checks, the spec log, design-reviewer, the spec check (Section 5), STATUS and ISSUES.

## 5. Spec and doc updates

The spec items below are **already written** on `page/url-format` (spacing-layout 2.27, component-system 1.22, typography 2.20, `AGENTS.md` Section 7, color-system wording). At the final checkpoint, check that the code matches them, fill in the open values (region labels, separator token) once tajmin approves them, and report any spec that the code shows to be wrong. Still to do at the final checkpoint: the label rows in `bn.ts` / `en.ts`, `docs/STATUS.md`, and closing or narrowing IMP-97.


- `spacing-layout-system.md`: add a short **URLs** section (tajmin Q5) with the rules in 3.1 to 3.6 and the hub, region and topic paths. Line 304: `/story/<slug>` becomes `/story/<slug>-<id>`. Line 237: the P-2 example becomes দক্ষিণ এশিয়া. Bump the version and add a changelog row.
- `component-system.md`: C-08 `format` mode and the article two-part variant; `ArticleHeader.category` (line ~1430) to the two-part text links; `Tags.item` (line ~1539) becomes `Topics.item` with `/topic/<slug>`; C-18 nav order and targets; the RegionSlider list (line ~1635); examples with বাংলাদেশ (lines ~98, ~652, ~1109).
- `typography-system.md` line ~372: the example becomes দক্ষিণ এশিয়া.
- `AGENTS.md` Section 7: one line that points to the new URLs section. Line 9 stays.
- Labels বিশ্লেষণ, মতামত and দক্ষিণ এশিয়া go in the label table and `bn.ts` / `en.ts` (some exist under `analysisOpinion`; do not duplicate them, reuse the keys).
- `docs/ISSUES.md`: rewrite IMP-97 to this task, then close it or narrow it to what is left. Add an open row: "Category page lists opinion and analysis in its main stream until run 2 (DR-415)".
- `docs/STATUS.md`: current state.

## 6. Test files

- Unit: `src/content/content.test.ts`, `src/components/home/featured/featured.test.tsx`, `src/components/home/most-read/most-read.test.tsx`, `src/components/home/regions/regions.test.tsx`, `src/components/story/small-parts.test.tsx`, `src/i18n/i18n.test.ts`.
- e2e: `tests/e2e/header.spec.ts`, `article.spec.ts`, `featured.spec.ts`, `category.spec.ts`, plus new tests for: the 301 from a wrong slug, the 404 for bare `/story` and an unknown id, the Eyebrow modes and the two-part article Eyebrow (bn and en).
- `src/i18n/` changes, so run the full `pnpm test:e2e:chromium` (`AGENTS.md` Section 11).
- Do not skip, disable or delete a test. Change a test only where a rule above changes the expected result, and name each one in the summary.

## 7. Done when

- Section 11 of `AGENTS.md` is met.
- `grep` finds no `bangladesh` category, no `explainer`, no `/tag/` and no "tag" wording in `src/` and `docs/design-system/`, except history rows.
- Every story link is `/story/<slug>-<id>` (with `/en` in English).
- The flags (3.4 labels, 3.6 parent item, any new token) are in the summary and in `docs/ISSUES.md` as "Open (flag)".

## 8. Not in this task

- The pages `/latest`, `/analysis`, `/opinion`, `/regions`, `/regions/<slug>` and `/topic/<slug>`. Each one gets its own page branch.
- The noindex rule for topics with fewer than 3 stories (on the topic page branch).
- Any homepage change beyond 3.7 and 3.9.
- The category page layout (run 2).

## 9. Run 2 (separate task, after this branch merges)

Use `page/category-formats` (DR-415, tajmin Q2):

- On the category page, the main stream is news only.
- Analysis and opinion get their own sections, **before Most read**.
- More stories (load more) lists news and analysis, never opinion.
- The Latest rail is news only on every page.

Write that task file when run 1 merges.
