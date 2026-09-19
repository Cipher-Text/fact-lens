# 01 — Current system assessment

## Executive finding

**CURRENT:** `cipher-press` is a working public news site with a Strapi-backed content system, but the architecture is centered on generic CMS CRUD rather than durable newsroom operations. It is a useful migration source and URL/content inventory, not a target domain model.

## Repository and runtime

Evidence:

- `cipher-press/package.json`, `pnpm-workspace.yaml`: pnpm `9.12.3`, workspaces `apps/*` and `packages/*`.
- `apps/web/package.json`: Next.js `14.2.35`, React 18, TypeScript, Tailwind, Vitest, DOMPurify, markdown-it.
- `apps/cms/package.json`: Strapi `^4.25.9` plus i18n, users-permissions, documentation, AWS S3 upload, import/export, PostgreSQL driver, rate limiting.
- `packages/ui` and `packages/shared`: small shared UI and formatter packages.
- `docker/docker-compose.yml` and `docker/docker-compose.prod.yml`: separate CMS and web containers; PostgreSQL is external in production.

The committed generated `apps/cms/dist` and `.strapi` material should be treated as build artifacts during migration inventory, not authoritative source. The authoritative schema is under `apps/cms/src/api/**/content-types/**/schema.json`.

## Current data model

| CURRENT content type | Evidence | Migration significance |
|---|---|---|
| Article | `apps/cms/src/api/article/content-types/article/schema.json` | Core source for Story, revision 1, translations, SEO, media and relations. Has title, UID slug, excerpt, richtext HTML, cover image, category, tags, author, feature/breaking flags, SEO fields, reading time. Draft/publish enabled. |
| Author | `.../author/.../schema.json` | Maps to Contributor; localized name/designation/bio/avatar/social links, but email is personal data and needs policy review. |
| Category | `.../category/.../schema.json` | Maps to Category/Desk candidate; localized, ordered, menu-visible, sync-key linked. |
| Tag | `.../tag/.../schema.json` | Maps to Tag; localized and sync-key linked. |
| Site Setting | `.../site-setting/.../schema.json` | Maps to localized publication settings/branding, not newsroom domain data. |
| Meta Data | `.../meta-data/.../schema.json` | Tracking IDs and social/contact settings; move secrets/configuration out of content data. |
| Advertiser, Ad Campaign, Ad Placement, Ad, Ad Event | corresponding `apps/cms/src/api/**` schemas/controllers | Preserve only if advertising remains in scope; model as commercial/distribution capability, not editorial Story. |

The existing API documentation describes `GET /articles`, categories, tags, authors, settings and metadata, with locale and `publicationState=live` parameters. Ads add `/api/ads/serve` and `/api/ads/r/:token` custom routes.

Coverage notes from the repository scan: no dedicated district/geography content type was found; district concepts appear as district-named Tag records in `apps/data/json/tag.json`. No Strapi component/dynamic-zone definitions were found. The only CMS extension under `apps/cms/src/extensions` is generated documentation. Authentication is Strapi users-permissions/local JWT-oriented, not OIDC. No application migration files were found under `apps/cms/database/migrations`; initialization relies on Strapi schema sync plus seed/link scripts. `apps/cms/src/types/dto.ts` provides a small DTO layer, while `apps/web/src/lib/strapi.ts` defines most frontend response types.

## Frontend behavior

Routes under `apps/web/src/app` are:

- `/`, `/news/[slug]`, `/category/[slug]`, `/tag/[slug]`, `/search`
- `/about`, `/contact`, plus error/not-found states
- `/sitemap.xml`, `/robots.txt`, `/api/revalidate`

`apps/web/src/lib/strapi.ts` is the main API adapter. It requests selected fields/populates, applies `en` or `bn-BD`, uses `publicationState=live`, and uses Next fetch caching with a default 60-second revalidation plus tags. `apps/web/src/app/api/revalidate/route.ts` invalidates tags/paths after a shared secret check. CMS lifecycle hooks in article/category/tag/site-setting/meta-data/ad call `apps/cms/src/utils/revalidate.js`.

The only discovered Next API route is the revalidation endpoint; no server-action-based editorial API was found. Image handling is Next remote-image configuration plus CMS upload provider behavior, not a dedicated transformation pipeline in the repository.

The site uses cookie-based presentation language (`cp_lang`) and theme (`cp_theme`), not URL-prefixed locales. Bengali is resolved as `bn-BD`; the UI dictionary is local in `apps/web/src/lib/i18n.ts`. Content localization relies on Strapi i18n plus a non-localized `syncKey`, with manual linking scripts in `apps/cms/scripts/link-localizations-*.js`.

SEO evidence:

- `apps/web/src/app/news/[slug]/page.tsx`: metadata and schema.org NewsArticle JSON-LD.
- `apps/web/src/app/sitemap.ts`: builds URLs from Strapi articles/categories/tags.
- `apps/web/src/app/robots.ts`: robots policy.
- `apps/web/src/lib/seo.ts`: canonical/site/OG URL helpers.
- No separate redirect registry is evident in the frontend routes; this is a migration gap.

## Media, analytics, and ads

`apps/cms/config/uploads.*` supports local uploads and AWS S3 provider configuration. Docker persists local uploads in a volume. Next image remote patterns are derived from `STRAPI_URL` and `NEXT_IMAGE_REMOTE_HOSTS` in `apps/web/next.config.js`.

Analytics/tracking fields live in `Meta Data`; components include `GoogleTag.tsx`, `tracking/GTM.tsx`, `tracking/MetaPixel.tsx`, and layout-level Microsoft Clarity loading. Share buttons generate Facebook/X URLs. The ad subsystem supports campaign dates/status, weighted/device/locale/category targeting, HMAC-signed redirect tokens, IP hashing for ad events, and sanitized HTML. Its implementation is in `apps/cms/src/api/ad/controllers/ad.ts` and `apps/web/src/lib/sanitizer.ts`.

## Strengths to retain as patterns

- Explicit environment validation in `apps/cms/src/env-validator.ts`.
- Selected Strapi fields/populates rather than broad `populate=*` in the main client.
- Server-rendered Next App Router pages and tagged revalidation.
- Rich-text and ad sanitization with tests under `apps/web/tests`.
- Docker health checks, resource limits, multi-architecture CI builds, and image identity checks in `.github/workflows`.
- Existing seed/import scripts and bilingual fixture JSON provide migration test data.

## Constraints and technical debt

- Strapi Admin is the only editorial UI; no newsroom-specific assignment, review, fact-check, correction, or audit workflow exists.
- Article updates overwrite the current record; Strapi timestamps are not a story revision history.
- HTML richtext is not a structured editor document; conversion to Tiptap needs a parser/validation pass.
- `syncKey` localization linking is operationally separate and can fail or hang; `link-localizations-direct.js` performs direct SQL and uses development-like defaults if env vars are absent.
- Locale identity is partly implicit: cookies/UI use `en`/`bn`, CMS uses `en`/`bn-BD`, and localized slugs may differ.
- Search is Strapi filters over title/excerpt (`apps/web/src/lib/strapi.ts`), not indexed full-text search.
- Revalidation is a direct dual-system notification from Strapi to Next; there is no transactional outbox or durable retry.
- Rate limiting uses an in-memory Map in `apps/cms/src/middlewares/rate-limit.ts`; it is not shared across instances.
- Production deployment is container-based but Compose-oriented; there is no evidence of managed queueing, tracing, or Sentry/OpenTelemetry.
- Logging has a namespaced wrapper in `apps/cms/src/utils/logger.ts`, but the repository shows no end-to-end trace propagation or centralized error/metrics implementation. Analytics is primarily tag-based (GA/GTM/Meta Pixel/Clarity) with Metabase setup documentation, not a newsroom analytics domain.
- `apps/cms/src/api/**/controllers` are mostly generated core controllers, so domain policy is thin and dispersed into lifecycles.
- Some docs and generated files appear out of sync with manifests (for example the docs say Strapi `4.26.1` while package range starts at `4.25.9`). Pin versions during migration inventory.

The codebase scan did not identify a material TODO/FIXME/HACK backlog in authoritative source files; that absence should not be interpreted as absence of architectural debt. The more important risk is implicit behavior in generated Strapi APIs, seed/link scripts, deployment docs and production environment files.

## Security-sensitive findings

- **Credential exposure risk:** `cipher-press/docs/metabase/scripts/metabase_config.env` contains a value that resembles a live API credential. Do not copy it. Revoke/rotate it, remove it from history if confirmed live, and add secret scanning.
- Secrets are passed through env files and CI secrets; the target should use managed secret storage and prevent `.env*` publication.
- `apps/cms/src/api/ad/controllers/ad.ts` validates signed redirect tokens, but the target still needs strict target-URL validation and abuse controls.
- Richtext sanitization is a good baseline but must be centralized server-side as well as at rendering boundaries.

## Migration-sensitive functionality

1. Article URL shape `/news/[slug]`, category `/category/[slug]`, tag `/tag/[slug]`.
2. Article `publishedAt`, `createdAt`, `updatedAt`, author attribution, locale, SEO title/description, cover image and related taxonomy.
3. Featured/breaking flags and homepage ordering behavior.
4. Bengali/English localization pairs and localized slugs.
5. Sitemap, robots, canonical/OG metadata, schema.org output, analytics IDs and social links.
6. Ads and click/impression redirects, if advertising is retained.
7. Revalidation behavior and media URLs during dual-run.

See [data migration](./14-data-migration-plan.md) for field-level mapping.
