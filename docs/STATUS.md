# Fact Lens: Status

Version 1.7 · 30 October 2026

The current state of the repository. It replaces `PROGRESS.md`, `HANDOVER.md`, `SPRINT.md`, the run logs and reports, and `prototype-findings.md` (removed 24 October 2026). Their open items are in `docs/ISSUES.md`. The session-start hook shows the "Now" section to Claude Code.

## Now

- Branch: `page/analysis`, page analysis: PR #23 open to `dev`. The analysis hub `/analysis` and `/en/analysis` (layout 7F, spec log AN-01 to AN-16). After the PR review tajmin approved the six changed rules (4 Nov 2026: "Add the spec changes"). Specs on the branch: typography 2.22, layout 2.33, component-system 1.29, agent-contract 2.23. Open: U-60 (the English NavBar hides Analysis at 1280). Checks: `pnpm check` (356 unit tests) and the full Chromium e2e (977 passed) after the fourth review.
- Pages done: homepage (P-5 most read: PR #14; the homepage changes like any page, DR-434), article page `/[lang]/story/[slug]` (PR #8, hotfixes PR #9 and #10), category page `/[lang]/category/[id]` (PR #11), url-format (PR #15), category-formats (PR #16) the Latest page `/[lang]/latest` (PR #18) and the topic page `/[lang]/topic/[slug]` (PR #20).
- Specs in `docs/design-system/`: color 2.18, typography 2.21, layout 2.32, component-system 1.28, agent-contract 2.22.
- url-format (IMP-97, run 1 of 2) merged (PR #15, 28 Oct 2026): `/story/<slug>-<id>` with 301 and 404s, formats, South Asia, 8 regions, topics, C-08 `format` and `two-part`, missing translation (DR-401). Full Chromium e2e on `dev`: 806 passed.
- category-formats (IMP-118, DR-415, run 2 of 2) merged (PR #16, 28 Oct 2026): news-only main stream, the analysis and opinion row above Most read (P-3 blocks, Opinion as P-4 quote rows), More stories without opinion and repeats with the `format` Eyebrow on analysis rows, and the C-43 PageTitle `surface` band (block inset `--space-page-title-band` 24 / 32 / 40px). Full Chromium e2e on `dev`: 813 passed.
- dev-process (task) merged (PR #17, 28 Oct 2026): the progress file `docs/progress/<name>.md` as the work memory, `/task` for changes that are not a page on `task/<name>`, the spec log made from the progress file at the final checkpoint (agent-contract 2.18 Sections 3 and 11). Full Chromium e2e on `dev`: covered by the run after PR #18.
- latest (page) merged (PR #18, 29 Oct 2026): the Latest page `/latest` and `/en/latest` (layout 7D): news of every category, newest first, 10 then 10, the category Eyebrow; load more rows and their images fade in; story time after load more. U-51 fixed: the reused parts are `MoreStoriesSection`, `MoreStoriesList` in `components/more-stories`. Full Chromium e2e on `dev` (29 Oct 2026): 870 passed.
- docs-cleanup (task) merged (PR #19, 28 Oct 2026): the briefs, progress files and task files of merged work deleted; the spec logs are kept in `docs/spec-log/` as the record of what each work changed in the specs (AGENTS.md Section 9 step 6, agent-contract 2.20 Section 11). Full Chromium e2e on `dev`: covered by the run after PR #20.
- topic (page) merged (PR #20, 30 Oct 2026): the topic page `/topic/<slug>` and `/en/topic/<slug>` (layout 7E): news and analysis of a topic, newest first, no opinion; the C-08 `format` Eyebrow (category on news, Analysis on analysis); 10 then 10. The topics belong to the story (`StoryDef.topics`). Full Chromium e2e on `dev` (30 Oct 2026): 918 passed.
- reader-size-script (task) merged (PR #21, 30 Oct 2026): no console error "Encountered a script tag while rendering React component" on a client link to an article. The reader size script runs once from the root layout `<head>`, on `/story/` and `/en/story/` only; after a client link `ReaderRoot` sets the size (TYP-15). Full Chromium e2e on `dev` (30 Oct 2026): 922 passed.
- xc-fixes (task) merged (PR #22, 30 Oct 2026): the 30 Oct cross-check fixes (DR-424, DR-425, DR-432 to DR-437). The homepage lock is lifted (DR-434); `--color-page-title-band` for the PageTitle band; the `two-part` Eyebrow separator is the CPT-10 square, in the color of its line; the homepage region columns show the C-08 `format` Eyebrow on every story (DR-433 amended); `CategoryFormatsSection` keeps fixed halves (DR-436); topic pages below 3 stories are noindex, follow (DR-432); the article and category spec logs are full again. The amendments are recorded as DR-438 (homepage Eyebrow: hero and region columns, news the category, analysis the format; More stories news none; amends DR-433 and DR-417) and DR-439 (the `bg-(--color-page-title-band)` form, wording of DR-425). Full Chromium e2e on `dev` (30 Oct 2026): 928 passed.
- Open items: `docs/ISSUES.md` (article page: IMP-100 to IMP-114, U-08; most read: U-47, DOC-56, IMP-115; url-format: U-48, IMP-119; xc-fixes: U-53, IMP-123; category-formats: IMP-120, IMP-121, DOC-58; latest: IMP-122, DOC-59). Open spec items are rows there too; the spec logs in `docs/spec-log/` are the record of what each page or task changed in the specs.

## Issues

Every open item, flag and decided issue is in `docs/ISSUES.md`.

WebKit failures: `docs/webkit-failures.md`.
