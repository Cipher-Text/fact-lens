# 22 — Implementation status

What exists in this repository today, how much of it has been checked, and what is not built. The other documents describe the plan; this one describes reality. Last reviewed 22 October 2026.

## How to read this

- **Tested** means automated tests that run in CI against a real PostgreSQL and Redis.
- **Hand-checked** means someone drove it in a browser and looked, with no automated test behind it.
- **Not built** means nothing exists beyond, at most, a database table or a configuration row.
- A **stand-in** is an in-process fake used in fast tests. The real service has not been used unless a line says so.

## Phases

| Phase | Status | What is there |
|---|---|---|
| 0. Inventory and migration prototypes | Not started | No inventory, importer, redirect registry prototype or HTML-to-editor spike. The locale and URL policy is open ([19](./19-open-questions.md), 2 and 14). |
| 1. Foundation and newsroom shell | Mostly done | Monorepo, API, migrations, OIDC bearer auth, capability checks, audit and outbox, worker, contracts, newsroom shell. Missing: OpenAPI generation, Docker images, deployment skeleton, tracing and metrics. See [20](./20-phase-1-backlog.md). |
| 2. Editorial core | Largely done | News item, revision and translation commands, workflow, Tiptap editor, sources, comments, assignments, corrections, timeline, scheduling and scheduled publishing, media library. Missing: branded card generation, taxonomy merge and impact preview, an assignment-creation screen, the advertising screens. |
| 3. Migration tooling and rehearsal | Not started | |
| 4. Public web and cutover | Early | `apps/web` is the new design on mock data. The API has a published-news read model with slug redirects and public media, plus public per-language navigation and category and tag lists. `apps/web` calls none of it. There is no search route, sitemap, legacy redirects, view beacon, newsletter or ad serving. |
| 5. Ingestion and AI assistance | Not started | Feature flags and AI configuration rows exist and do nothing. The cache, search and notification jobs only log. |
| 6. Distribution and analytics | Not started | |
| 7. Advanced discovery | Not started | |

## What exists

**Applications**

- `apps/api`: NestJS on Fastify. Default-deny authentication, capability checks, audit, 15 SQL migrations.
- `apps/worker`: BullMQ worker with an outbox dispatcher, a job runtime, a due-schedule scanner and a health endpoint.
- `apps/newsroom`: Next.js editorial workspace with server-side OIDC sign-in.
- `apps/web`: the public site design, imported from `fact-lens-web`, on mock data. With `FACTLENS_API_URL` set, its header menu reads `GET /public/navigation/:locale`, its footer and menu social links are the ones in the API's settings (a network with none keeps its default link), and its daily poll is the one the newsroom featured, voted through the site's own `/api/poll/:id/vote`; without it, or if the API is down, it keeps the static menu and the mock poll.
- `tools/dev-idp`: a fake sign-in provider for local use. It refuses to run in production.
- `packages/config` (environment validation) and `packages/contracts` (shared schemas and enums).

**API surface** (all require sign-in unless marked public)

- News items: list, detail, revisions, timeline, create, translation save with version check, desk/section/credits, new revision, workflow transitions, corrections.
- Collaboration: comments (add, resolve, reopen), assignments (create, complete, cancel, "mine"), sources (create, validate, attach, detach).
- Media: upload, list, detail, rights, file, delete. Public: news item by locale and slug, media derivatives.
- Reference data and administration: desks, categories, tags, locales, feature flags, `/me`, and contributors (`/contributors/directory`, create and edit with a photo, bio, private email and social links; the newsroom's People menu, `news.edit`).
- Desk queue numbers: `GET /news/counts` (in progress, due today, stuck over 24 hours, published this week, and a count per stage); the list also carries each item's pending schedule time.
- Taxonomy (`taxonomy.manage`): regions (their own list, apart from the menu sections: create, rename per language, order, archive, delete when unused; a news item can be about several, `PUT /news/:id/regions`; public `GET /public/regions/:locale`, `?region=` on the news list, and `regions` on the news page), categories (create, rename per language, order, show or hide in the menu, archive, delete when unused), tags (the same, with search), tags on a news item (`PUT /news/:id/tags`), languages (`/config/locales`, `config.manage`). Tags carry a description per language and one picture. Public: `GET /public/navigation/:locale`, `GET /public/news/:locale?category=|tag=`; a news item keeps its primary section on the link (`news_category.is_primary`); old addresses of sections, regions and tags redirect (`taxonomy_slug_history`); a news item has a format (`news`, `analysis` or `opinion`; the public lists take `format` and `excludeFormat`), can be in several sections (`categoryIds`, with `categoryId` as the primary one); the public news item is read by `<slug>-<id>` (`GET /public/news/:locale/:ref`; the id is `shortId`, redirects for a wrong or old slug) and carries its primary `category`, all its `categories` and its tags in its own language, a section list includes every item in that section (and its sub-menus), and an item with no name in a language is left out of that language.
- Categories can have a parent (`parentId`): the menu has two levels, `GET /public/navigation/:locale` returns each menu with its `children`, and a parent's news list includes its children's news. The newsroom shows child menus under their parent and has a "Parent menu" choice.
- Writing help (`news.edit`, needs `GEMINI_API_KEY`, ADR-022): `POST /ai/news-suggest` (headline, standfirst, slug, search text and existing tags from a text) and `POST /ai/news-translate` (a language into another, keeping the body's structure). Nothing is saved by these; the newsroom has "Generate with Gemini" and "Translate with Gemini" buttons. Tested with a fake Gemini; not run against the real service.
- Source inbox (ADR-023, RSS only): feeds (`/feeds`, added and removed by `config.manage`, readable by editors), the inbox (`GET /inbox?status=`, `PUT /inbox/:id` put aside or bring back, `POST /inbox/:id/use` makes the item a source of a news item). The worker fetches each due feed and reports to `POST /internal/feeds/:id/ingest`; an item is stored once per feed, and the same address already in the inbox or sources is listed as a duplicate. Hand-checked against a real public feed and the running worker; automated tests use a fake feed.
- Polls (ADR-024): editors write a poll per language with two to four options (`news.edit`), managing editors open, close, archive and feature it (`news.publish`); wording is fixed once there are votes. Public: `GET /public/polls/featured/:locale`, `GET /public/polls/:id/:locale`, `POST /public/polls/:id/vote`. One vote per browser (a random cookie token, one row per token per poll in the database) plus a daily limit per network address; only keyed hashes are stored. Tested; hand-checked on the public site against the dev API.
- Site social links and contact details: deployment settings (`SITE_SOCIAL_FACEBOOK_URL`, `…_YOUTUBE_URL`, `…_X_URL`, `…_INSTAGRAM_URL`, `…_LINKEDIN_URL`, `SITE_CONTACT_EMAIL`, `SITE_CONTACT_PHONE`, `SITE_CONTACT_ADDRESS`), not editorial data: there is no editing in the newsroom and nothing in the database (migration 26 removes the old `site.social_links` row). A social address must be https and on the network's own domain, checked when the API starts, which refuses to start on a wrong one. Public, read only: `GET /public/site/social-links` (only the networks that have one) and `GET /public/site/contact` (a detail that is not set is null). A person's own social links (People) are editorial data and stay in the database.
- Internal (shared secret, for the worker): publish a due schedule; store what a feed fetch found.
- Health: liveness and readiness.

**Database**: locale, configuration, feature flag, desk, category, tag (with labels per language), contributor, media asset, news item, revision, translation, slug registry, news tags, news categories, regions, news regions and contributors, revision media, source, news item source, assignment, comment, correction and notice, publishing schedule, card template, generated card, advertiser, campaign, placement, ad, ad category target, ad event, role, role capability, audit event, outbox event, processed job. Not yet created: newsletter subscriber, news item performance, entities, claims, AI runs, prompt templates, ingestion sources.

**Seeded reference data** (`pnpm seed`): 4 provisional desks, the 5 menu sections of the public site (Geopolitics, Economy, Security, Technology, History) with English and Bangla names and the key as the address, the 8 regions (also English and Bangla; a database seeded with the old cipher-press menu is moved to the site's menu by migration 25, which archives the old sections that nothing uses), 146 tags with English and Bangla names (from cipher-press), 8 provisional roles, default workflow policy, 9 rate limits, 6 AI use cases (budget zero), 11 feature flags (all off), 9 RSS feeds (BBC, Al Jazeera, Guardian, DW, France 24; each fetched and parsed before listing) that start paused, so an administrator resumes the ones wanted.

**Worker jobs**: `news.publish_scheduled`, `schedule.scan`, `feed.scan` and `feed.fetch` work (RSS and Atom, with a guard against private addresses). `cache.invalidate`, `search.index` and `notification.send` log and succeed. `media.variant` and `media.card_generate` fail on purpose as "not implemented".

**Newsroom screens** (visual design from the Admin UI file: left sidebar, status pills, desk queue with numbers, stage tabs and a table, workflow steps on the news page; the design's fact-check verdict panel and checklist are not built, see open question 15): desk queue, new news item, news item workspace, media library and image page, configuration (languages, social links, feature flags), sections and tags (menu, tags, per-language names), and a tag picker in the news item workspace. The source inbox (feeds, new, used, put aside and duplicate items, create a news item from an item) and polls (write, open, close, archive, feature, results) are built; the publishing calendar is a placeholder.

## How much is verified

| Area | Verification |
|---|---|
| Taxonomy: menu, tags, per-language names and addresses, public navigation and lists, tag description and picture, adding a third language | Tested (database tests) |
| Workflow, readiness rules, slugs, corrections, scheduling | Tested (database tests, including concurrency) |
| Authentication, capabilities, MFA rule, audit | Tested with signed test tokens; sign-in flow tested against the fake provider |
| Outbox dispatcher, jobs, idempotency, scheduled publish | Tested against real PostgreSQL and Redis; a real API and worker run was also hand-checked |
| Media upload, sanitizing, variants, rights, public serving | Tested. Storage tests run against a stand-in S3 server; the real MinIO run is added to CI and **has not yet been seen to pass** |
| Newsroom screens and the editor | Libraries, renderer and proxy rules tested; the screens themselves are **hand-checked only**, there are no browser tests. The tag picture chooser has not been hand-checked |
| Public web | 251 tests in `apps/web`; it does not use the API |

## Not built, in one place

- **Delivery:** Docker images, deployment, secret scanning, dependency scanning, OpenAPI generation.
- **Operations:** tracing, metrics, Sentry, dashboards, backups, rate limits (the numbers are seeded, nothing enforces them).
- **Auth:** token refresh, desk-scoped roles, a real identity provider (only the fake one has been used).
- **Media:** variant generation in the worker, malware scanning, crop and focal point, social cards, orphan sweep, cipher-press upload migration, CDN.
- **Editorial:** HTML import fixture, autosave, side-by-side locales, comment replies in the UI, audit search, taxonomy merge.
- **Commercial:** ad serving, signed redirects, targeting logic, ad-event capture, advertising screens.
- **Public:** web pages for category and tag lists and search (the API lists exist), sitemap, legacy redirects, view beacon, newsletter, analytics tags.
- **Later phases:** other ingestion (partner APIs, single approved URLs, Telegram), AI classification of inbox items, the AI Gateway proper, distribution, search projection, entities and claims, migration from cipher-press.
