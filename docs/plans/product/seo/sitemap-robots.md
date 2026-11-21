# Sitemap and robots.txt for the public site (Codex)

Status: pending. Backlog item: sitemap and robots (docs/22, "Not built"). The public site's address is a new setting, `PUBLIC_SITE_URL`, decided with the lead: read from the environment like `FACTLENS_API_URL` (it is documented in `.env.example` and the README, not in `packages/config`, because `apps/web` reads its settings directly). It is blank by default. In development, when it is blank, use `http://localhost:3000`. In production, when it is blank, the sitemap lists no news (only the static pages), and robots.txt has no Sitemap line.

## Goal

`/sitemap.xml` lists the public pages a search engine should index, and `/robots.txt` says which parts are not for indexing and where the sitemap is.

## Workspace

`fact-lens-web` (filter name `fact-lens-web`), i.e. `apps/web`. Read `apps/web/AGENTS.md` and `apps/web/CLAUDE.md` first. Do not edit `apps/web/docs/design-system/`, anything in `fact-lens-web`, or any file under `docs/`.

## Read first

- `src/i18n/config.ts`: `langs`, `localizedPath(lang, path)` (Bangla is the root path, English is `/en`).
- `src/content/types.ts`: `categoryIds` and `regionIds` (the section and region addresses).
- `src/lib/api/client.ts` (`apiBase`, `apiGet`, `apiLocale`, `ApiUnavailable`, `ApiNotFound`) and `src/lib/api/pages.ts` (how the site reads a list from the API).
- The public list endpoint: `GET /public/news/:locale?limit=&cursor=` returns `{ filter, items, nextCursor }`. Each item has `slug`, `shortId` and `publishedAt`. The address of a story is `/story/<slug>-<shortId>`. The regions list is `GET /public/regions/:locale` (items have `slug`).
- Next.js App Router: `app/sitemap.ts` and `app/robots.ts` (metadata routes).

## Files

Create:
- `src/lib/site-url.ts`: `export function siteUrl(): string | null` reads `process.env.PUBLIC_SITE_URL`, trims the trailing slash, returns null when blank or not an http(s) URL. `export function siteOrigin(): string` returns the value, or `http://localhost:3000` when blank and `NODE_ENV !== "production"`, or `null` in production when blank (callers then omit the absolute pages).
- `src/lib/site-url.test.ts`: tests for blank, invalid, trailing slash, and the development fallback.
- `src/lib/sitemap.ts`: `export async function sitemapEntries(origin: string): Promise<MetadataRoute.Sitemap>`:
  - Static pages, for each language in `langs`: the home page, `/analysis`, `/regions`, `/latest`, and each `categoryIds` entry as `/category/<id>`, all through `localizedPath`.
  - Each region in `regionIds` as its region page (check the route in `src/app/[lang]/regions` for the path shape).
  - Stories: for each language, read every page of `GET /public/news/<apiLocale(lang)>?limit=50` following `nextCursor`, and add `/story/<slug>-<shortId>` with `lastModified` from `publishedAt`. Stop after 5000 stories per language (one sitemap file is limited to 50,000 URLs; the cap keeps a build bounded). If the API is unavailable, return the static pages only, do not throw.
  - Every URL is absolute: `origin` plus the localized path. No query strings, no search pages.
- `src/app/sitemap.ts`: `export const revalidate = 300;` and `export default async function sitemap()` that returns `sitemapEntries(origin)`, or `[]` when `siteOrigin()` is null.
- `src/app/robots.ts`: returns `{ rules: [{ userAgent: "*", allow: "/", disallow: ["/search", "/api/"] }], sitemap: origin + "/sitemap.xml" }`; omit `sitemap` when the origin is null.
- `src/lib/sitemap.test.ts`: with stubbed `fetch`: static pages for both languages, a story URL built from slug and short id, pagination followed to the last page, the API unavailable gives static pages only, and every URL starts with the origin.

Edit:
- `.env.example`: add `# PUBLIC_SITE_URL=` near `FACTLENS_API_URL`, with a comment: the public address of the site, for example `https://example.org` (no trailing slash), needed for the sitemap and robots.txt.
- `README.md`: one bullet beside the `FACTLENS_API_URL` bullet (line ~55) for `PUBLIC_SITE_URL`.

## What NOT to touch

- `apps/api`, `packages/contracts`, `packages/config`, `apps/newsroom`, `apps/worker`.
- The page components and the route files other than the two metadata routes.
- `docs/` (the lead updates the docs).

## Acceptance criteria

- `/sitemap.xml` lists the static pages in both languages, every category and region, and every published story in both languages, with absolute URLs under `PUBLIC_SITE_URL`.
- `/robots.txt` disallows `/search` and `/api/`, and points to the sitemap when the address is set.
- With the API down, the sitemap still returns the static pages and the build does not fail.
- With `PUBLIC_SITE_URL` blank in production, the sitemap has no absolute URLs and robots has no Sitemap line.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```
