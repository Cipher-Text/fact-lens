# Homepage Prototype Sprint

This is a small sprint for a simple prototype: one homepage, mock data, Bangla and English. It is not a full website.

## How it works

- Claude does one ticket at a time: plan, build, test, verify.
- Claude asks tajmin before a command that needs permission.
- At the end of a ticket, Claude stops and gives tajmin the test steps.
- tajmin tests the ticket. tajmin replies with problems, or types `/accept`.
- Claude starts the next ticket only after `/accept` and a new `/ticket`.

| Command | Who | Does |
| --- | --- | --- |
| `/ticket` | tajmin | Claude starts the next ticket that is "To do" |
| `/accept` | tajmin | Claude marks the ticket "Done", commits and pushes |

## Board

Claude keeps this table current. Status values: To do, In progress, In review, Done.

| Ticket | Title | Status |
| --- | --- | --- |
| FL-01 | Project setup | Done |
| FL-02 | Design foundations | Done |
| FL-03 | Layout parts | Done |
| FL-04 | Mock content | Done |
| FL-05 | Header | Done |
| FL-06 | Hero | To do |
| FL-07 | বিশ্লেষণ ও মতামত | To do |
| FL-08 | Featured categories | To do |
| FL-09 | Grouped categories | To do |
| FL-10 | Most read | To do |
| FL-11 | Regions | To do |
| FL-12 | Footer | To do |
| FL-13 | Final check | To do |
| FL-14 | Preview deploy (optional) | To do |

## Every ticket is done when

1. The acceptance criteria of the ticket are true.
2. `pnpm check` passes (from FL-01 on), and `pnpm test:e2e` passes (from FL-02 on).
3. The `design-reviewer` subagent reports no blockers.
4. `docs/PROGRESS.md` is current.

---

## FL-01 Project setup

**Goal:** an empty Next.js 16 project with the kit, tests and a GitHub repository, so that the next tickets can build on it.

**Acceptance criteria**

- Node.js is 20.9 or later and pnpm works. If not, Claude stops and tells tajmin the one command to run.
- Next.js 16 with TypeScript strict, Tailwind CSS 4, ESLint, App Router and `src/`. The kit files are unchanged.
- The scripts in `AGENTS.md` Section 4 exist: `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`, `check`.
- Prettier, Vitest, Playwright with axe and shadcn/ui (init only) are set up.
- `.gitignore` has `.claude/settings.local.json`, `CLAUDE.local.md`, `test-results/` and `playwright-report/`.
- A private GitHub repository `fact-lens-web` exists with an SSH remote, and the first commit is pushed to `main`.

**tajmin tests:** opens the repository on GitHub, and opens `http://localhost:3000` to see the Next.js start page.

<details><summary>Original prompt</summary>

```text
Set up the project in this folder. The folder already has the Claude Code kit (AGENTS.md, CLAUDE.md, .claude/, docs/). Do not change those files.
- Check node -v (20.9 or later) and pnpm -v.
- Run git init if needed.
- Scaffold Next.js 16 with create-next-app into a temporary folder (.scaffold) with TypeScript, Tailwind, ESLint, App Router, src/ and pnpm, then move its files here without overwriting the kit files, merge .gitignore, and delete .scaffold.
- Add the package.json scripts from AGENTS.md Section 4, Prettier with the Tailwind plugin, Vitest with Testing Library and jsdom, Playwright with @axe-core/playwright and one smoke test for /, shadcn/ui init for Tailwind 4 (no components yet), TypeScript strict.
- Add .claude/settings.local.json, CLAUDE.local.md, test-results/ and playwright-report/ to .gitignore.
- Create a private GitHub repository named fact-lens-web with gh, using the SSH remote (git@github.com:...), commit and push main.
Tell me each package you add and why. Use the next-devtools MCP server for Next.js 16 questions.
```

</details>

## FL-02 Design foundations

**Goal:** the Fact Lens colors, fonts, themes and the two languages work, before any section is built.

**Acceptance criteria**

- `src/styles/colors.css`, `typography.css` and `layout.css` are copies of the CSS in the three specs. `globals.css` only imports Tailwind and these files.
- The fonts load with `next/font` (`typography-system.md` Section 8).
- Bangla is at `/`, English at `/en`. The language choice is kept in a cookie. There is no redirect by browser language (`DR-17`).
- The theme switch has system, light and dark, with no flash on load.
- `src/i18n/bn.ts` and `en.ts` exist with the same keys.
- A temporary page shows every type role and color token in both languages.

**tajmin tests:** opens the temporary page in Bangla and English, light and dark, and compares it with the color and typography visual pages.

<details><summary>Original prompt</summary>

```text
Do the foundations.
- Copy the token CSS from color-system.md Section 5, typography-system.md Section 8 and spacing-layout-system.md Section 12 into src/styles/colors.css, typography.css and layout.css. Copy, do not retype. globals.css imports only Tailwind and these files.
- Load the fonts with next/font as typography-system.md Section 8 says.
- Routes: src/app/[lang]/ with bn and en. Bangla at /, English at /en, the choice kept in a cookie, no browser-language redirect (DR-17). Use the Next.js 16 proxy.
- Theme switch logic: system, light, dark, set before the first paint (spacing-layout-system.md Section 6).
- String tables src/i18n/bn.ts and en.ts.
- A temporary page that shows every type role and color token in both languages, so I can check them.
List any CSS block in the specs that does not work as written.
```

</details>

## FL-03 Layout parts

**Goal:** the shared layout parts that every section uses.

**Acceptance criteria**

- `Shell`, `Wrapper`, `Rail`, `AdRow`, `SectionHeading` and the peer-row grid exist in `src/components/layout/`.
- At 1920 wide, the shell is 1280. From 1024, the rail is 304 wide and beside the wrapper. Below 1024, it is under the wrapper.
- `AdRow` takes `ad-band-top`, `ad-band` or `ad-inset`, reserves the height per width, shows the label line and a placeholder, and has no padding or margin.
- Playwright tests check these widths: 360, 768, 1024, 1280, 1440, 1920.

**tajmin tests:** opens the temporary layout page and makes the browser window narrow and wide.

<details><summary>Original prompt</summary>

```text
Build the layout parts Shell, Wrapper, Rail, AdRow, SectionHeading and the peer-row grid (spacing-layout-system.md Sections 2 to 5, 8 and 9). AdRow takes a slot name (ad-band-top, ad-band, ad-inset), reserves the height for each tier and shows the label line and a placeholder creative. Add a temporary layout test page and Playwright tests for the shell width and the rail at 360, 768, 1024, 1280, 1440 and 1920.
```

</details>

## FL-04 Mock content

**Goal:** realistic sample news for every homepage section, in both languages.

**Acceptance criteria**

- The data follows the `mock-content` skill: types in `src/content/types.ts`, read through `getHomepage(lang)`.
- Every section in `spacing-layout-system.md` Section 7.1 has enough stories.
- The data has long Bangla headlines, stories with no image, and a region with no stories.
- No fact-check content (`DR-18`). চীন is a region, not a category (`DR-19`).
- Placeholder images are local SVG files in `public/mock/`.

**tajmin tests:** reads some Bangla and English headlines in the data files.

<details><summary>Original prompt</summary>

```text
Make mock content for the whole homepage in Bangla and English. Follow the mock-content skill. Include the hard cases: long Bangla headlines, stories with no image, sparse variants, a region with no stories. Add placeholder SVG images in public/mock/.
```

</details>

## FL-05 Header

**Goal:** the top ad, top bar, nav row, drawer and search.

**Acceptance criteria**

- The top ad is above the header. The top bar sticks when the top ad scrolls away (`LAY-15`).
- Phones: menu left, logo center, theme and language right. Search is in the drawer.
- From 768: menu and search left, logo center, language, theme and Subscribe right. Search opens a dialog.
- The nav row shows from 1280 only, with the items that fit. No ফ্যাক্টচেক, no চীন.
- The drawer and the search dialog work with the keyboard: focus moves in, Escape closes, focus returns.

**tajmin tests:** at a phone width and at full width, opens the menu and search with the mouse and with the keyboard (Tab, Enter, Escape), then scrolls down.

<details><summary>Original prompt</summary>

```text
Build the header: top ad, top bar, nav row, drawer and search dialog (spacing-layout-system.md Sections 6 and 9).
```

</details>

## FL-06 Hero

**Goal:** the first section: lead story, two top stories and the Latest rail (P-1).

**Acceptance criteria**

- From 1024: wrapper with the lead and two top stories, Latest in the 304 rail beside it.
- 600 to 1023: lead full width, Latest in 2 columns below. Phone: all stacked.
- From 768 the lead text panel overlaps the bottom of the image (`spacing-layout-system.md` Section 7.4).
- Two top-story cards only (`DR-44`). The sparse cases of Section 7.3 work.
- An ad row follows the hero.

**tajmin tests:** looks at the hero at phone, tablet and full width, in Bangla and English.

<details><summary>Original prompt</summary>

```text
Build P-1 Hero with the Latest rail (spacing-layout-system.md Sections 7.2 to 7.4).
```

</details>

## FL-07 বিশ্লেষণ ও মতামত

**Goal:** the analysis and opinion section (P-4).

**Acceptance criteria**

- Shell width, `surface-elevated` background inside the shell (`DR-76`).
- Two equal columns from 768: analysis left, opinion right. Stacked below 768.
- Only the opinion column has the plain মতামত chip. Each column has আরও দেখুন below its last item (`LAY-18`).
- If one column is empty, the other spans the shell.

**tajmin tests:** looks at the section at phone and full width, and checks the background color.

<details><summary>Original prompt</summary>

```text
Build P-4 বিশ্লেষণ ও মতামত (spacing-layout-system.md Sections 7.2 to 7.4).
```

</details>

## FL-08 Featured categories

**Goal:** the বাংলাদেশ and ভূরাজনীতি sections (P-2).

**Acceptance criteria**

- Wrapper with the lead image and text, rail with one image story and two stories.
- Text under the image up to 1279, beside the image from 1280.
- With no rail stories, the wrapper spans the shell.
- An ad row follows each section.

**tajmin tests:** looks at both sections at 1024 and full width.

<details><summary>Original prompt</summary>

```text
Build P-2 Featured category for বাংলাদেশ and ভূরাজনীতি (spacing-layout-system.md Sections 7.2 to 7.4).
```

</details>

## FL-09 Grouped categories

**Goal:** the remaining categories in rows of two, with the newsletter and daily poll rail (P-3).

**Acceptance criteria**

- Two categories per row from 600, one on phones. An odd last category keeps its size.
- An `ad-inset` between rows, at wrapper width. Three insets or fewer.
- Rail: newsletter (with error, sending and done states) and a daily poll (one vote per browser, then result bars). Mock data only.

**tajmin tests:** submits the newsletter form with a bad and a good email, and votes in the poll.

<details><summary>Original prompt</summary>

```text
Build P-3 Grouped categories with the ad-inset, newsletter and daily poll (spacing-layout-system.md Sections 7.2 to 7.4 and 9).
```

</details>

## FL-10 Most read

**Goal:** the top 5 stories as a numbered list (P-5).

**Acceptance criteria**

- 4 per row from 1024 with item 5 on row 2. 2 per row from 600. 1 per row on phones (`DR-51`).
- Bangla pages show Bangla digits.
- An ad row follows the section.

**tajmin tests:** looks at the list at phone, tablet and full width.

<details><summary>Original prompt</summary>

```text
Build P-5 Most read (spacing-layout-system.md Section 7.2, DR-51).
```

</details>

## FL-11 Regions

**Goal:** the regions section as a slider, and as tabs on phones (P-3b).

**Acceptance criteria**

- From 600: a scroll-snap row with previous and next buttons that move one region and are disabled at each end. Swipe works. No autoplay.
- Below 600: tabs with arrow-key support. One region shows.
- A region with no stories is not shown. With 4 regions or fewer there are no buttons.
- No animation with reduced motion.

**tajmin tests:** uses the buttons, swipes on a phone, and uses the arrow keys on the tabs.

<details><summary>Original prompt</summary>

```text
Build P-3b Regions (spacing-layout-system.md Section 7.4).
```

</details>

## FL-12 Footer

**Goal:** the minimum footer.

**Acceptance criteria**

- Full-width row with the logo and social links. Each social link has a name for screen readers.
- Links to About, Contact, Corrections, Privacy and Terms, in the page language.

**tajmin tests:** checks the footer in Bangla and English.

<details><summary>Original prompt</summary>

```text
Build the minimum footer (spacing-layout-system.md Section 7.4).
```

</details>

## FL-13 Final check

**Goal:** the whole homepage works at every width, in both languages and both themes.

**Acceptance criteria**

- Remove the temporary pages from FL-02 and FL-03.
- `/verify` passes, and the `visual-qa` subagent reports no problems, or each problem is listed.
- The widths and cases in `spacing-layout-system.md` Section 13 are tested, including the 1366×768 first screen.
- The checks in `typography-system.md` Section 9 have a result.
- One results table is in `docs/PROGRESS.md`. Claude fixes only what tajmin picks from the table.

**tajmin tests:** reads the table and picks the fixes.

<details><summary>Original prompt</summary>

```text
Run /verify. Then test every case in spacing-layout-system.md Section 13 (all widths, the 1366×768 first screen, long Bangla headlines, no-image stories, sparse sections) and the prototype checks in typography-system.md Section 9. Give me one table with the results and screenshots. Do not fix anything until I pick the fixes.
```

</details>

## FL-14 Preview deploy (optional)

**Goal:** a preview link that tajmin can share.

**Acceptance criteria**

- The README is current and `git status` is clean.
- The repository is connected to Vercel and a preview deploy shows `/` in Bangla and `/en` in English.
- Claude asks before every command that deploys.

**tajmin tests:** opens the preview link on a phone.

<details><summary>Original prompt</summary>

```text
Check that git status is clean and the README is current. Then connect the GitHub repository to Vercel for a preview deploy. Ask me before each command that deploys.
```

</details>
