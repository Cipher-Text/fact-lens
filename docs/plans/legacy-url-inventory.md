# Legacy URL inventory (plan item 11)

The old cipher-press public addresses that a redirect registry must cover. The full list is in [legacy-url-inventory.csv](legacy-url-inventory.csv), one row per address. This file is the summary.

## How it was built

- **Routes:** the cipher-press web app (read only) has these public pages: `/`, `/news/[slug]`, `/category/[slug]`, `/tag/[slug]`, `/search`, `/about`, `/contact`, plus `/sitemap.xml` and `/robots.txt`. `/api/revalidate` is internal and is not listed. The ad routes (`/ads/serve`, `/ads/r/:token`) are served by the old CMS host.
- **Language:** the old site chose the language from a cookie (`cp_lang`), not the URL. Each slug therefore has one address, and the English and Bangla slugs of a category or tag are separate addresses.
- **Articles and tags:** the slugs come from the cipher-press export. Each article's new address comes from the seeded database (`/story/<slug>-<id>`, ADR-027).

## Counts

| Kind | Addresses | Redirect status |
|---|---|---|
| Articles | 2,196 | 2,186 redirect; 10 drafts have no redirect (they were never public) |
| Categories | 20 | 14 redirect to a site section; 6 need a decision (no site section) |
| Tags | 292 | all need a decision (topic pages, question 23) |
| Fixed pages | 6 | 2 redirect; 4 need a decision (about, contact, sitemap, and the apex host) |
| Ad routes | 2 | need a decision (see below) |

Total: 2,517 addresses.

## Findings to act on

1. **Ad redirect links are in the wild.** `/ads/r/:token` tokens are signed with the old CMS's secret. They cannot be reissued, so if the old CMS stops, those links stop working. The advertising module (Epic G) must either keep the old endpoint alive or accept the loss.
2. **Host.** The old canonical host was `www.factlensbd.com`, and the apex `factlensbd.com` redirected to it with a 308. The new target host is not decided.
3. **Tags need topic pages.** The 292 tag addresses have no target until question 23 (topic pages) is decided.
4. **Six categories have no site section.** Local, Sports and Analysis (and their English twins) have no section on the new site. Business maps to Economy.
5. **Search parameter unknown.** I did not find a URL parameter in the old `/search` page code, so its query cannot be mapped yet. Check the live site or the search component.

## Redirect status

Old-to-new redirects here are permanent in intent. The article page currently sends 307 (open decision 2 in [the pending plan](pending-work-and-priority.md)), so the registry's status code depends on that decision.

## Next

- Decide items 1 to 5 above, then build the redirect registry (plan item 12) from the CSV.
