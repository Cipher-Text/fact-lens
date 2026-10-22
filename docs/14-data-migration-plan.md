# 14 — Data migration plan

## Source inventory

Authoritative source files are Strapi schemas under `cipher-press/apps/cms/src/api/**/content-types/**/schema.json`, seed/fixture inputs under `cipher-press/apps/data/json`, lifecycle behavior under `cipher-press/apps/cms/src/api/**/lifecycles.*`, and media in local uploads or configured object storage. Do not migrate generated `dist` as schema truth.

## Mapping

| CipherPress source | FactLens target | Treatment |
|---|---|---|
| Article `id` | `legacy_source_id` plus new News item UUID | Preserve for reconciliation, not as public primary key. |
| Article title/excerpt/content | NewsRevision + NewsTranslation | Create imported revision 1; parse HTML into Tiptap-compatible document, retain raw HTML only as migration evidence until validated. |
| Article slug | Translation slug + redirect registry | Preserve exact live slug per locale where possible; record old/new URL and collision resolution. |
| `publishedAt`, `createdAt`, `updatedAt` | News item/revision timestamps | Preserve source timestamps; distinguish importedAt from editorial changedAt. |
| `syncKey`, locale/localizations | News item + NewsTranslation group | Use syncKey/localization links as evidence, but validate pairs and do not trust missing/duplicate keys. |
| Category | Category, possibly Desk | Normalize duplicates/aliases; do not infer Desk automatically without review. |
| Tag | Tag/Topic | Normalize case/slug/locale duplicates and retain legacy mapping. |
| Author | Contributor | Preserve display name/slug/attribution; move email to private field and review consent. |
| coverImage/avatar | MediaAsset + revision attachment | Copy object, checksum, dimensions, alt text, source URL and rights status. |
| seoTitle/seoDescription | Translation SEO metadata | Preserve values; validate length and canonical/OG fallback behavior. |
| isFeatured/isBreaking/readingTime | News item publication flags/read-time projection | Keep history in import metadata; make flags workflow-controlled in target. |
| Site Setting/Meta Data | Publication settings/tracking config | Separate public settings from secret/runtime config; carry forward the GA4 measurement ID and add GSC site verification; verify analytics consent behavior. |
| Ads/Advertiser/Campaign/Placement/Event | Advertising module (Phase 1 scope) | Approved for Phase 1: migrate Advertiser/Campaign/Placement/Ad/Event as-is, preserving HMAC redirect-token behavior and targeting rules; IP-hash event retention policy must still be reviewed against data-retention policy before cutover. |

## Stages

1. Freeze a read-only source export and schema/URL/media inventory.
2. Build a staging importer with deterministic source IDs, dry-run reports and a dead-letter file.
3. Import taxonomy/contributors/media metadata, then news items/translations/revisions, then relationships and settings.
4. Generate URL/redirect registry and public read-model fixtures.
5. Run dual-read comparison against Strapi for representative pages and all published URLs.
6. Rehearse delta import from a repeatable watermark; do not use timestamps alone where ties/clock drift exist.
7. Cut over writes with a short editorial freeze or controlled dual-write adapter; validate, then switch public traffic.

## Validation

Compare counts by locale/state, slug sets, canonical URL sets, timestamps, author/category/tag relations, media checksums, HTML/text rendering, SEO metadata, sitemap entries, schema.org output, redirects and search results. Sample bilingual pairs manually. Fail the migration on unexplained published news item loss, duplicate canonical URLs, broken media, missing attribution or redirect gaps.

## Rollback

Keep Strapi read-only and publicly available behind the old route for a defined window; preserve a reversible CDN/origin switch and redirect map. Roll back application traffic, not imported target data, unless a tested database restore is required. Record cutover version and reconciliation IDs.

## Status

Not started. The target tables exist, and so do some pieces the plan relies on: there are no legacy-identifier columns yet, the slug registry can hold redirects between a news item's own slugs but not legacy URLs, contributors can be created, and the body schema defines what imported HTML must be converted into. The HTML-to-editor conversion fixture, the exporter, the media copier and the URL inventory are all still to do, and the locale and URL decision (open question 14) comes first. See [implementation status](./22-implementation-status.md).
