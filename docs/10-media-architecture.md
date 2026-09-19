# 10 — Media architecture

## Storage flow

1. API creates an upload intent with allowed MIME/size/context.
2. Client uploads to R2/S3 using short-lived signed URL or controlled proxy.
3. Worker verifies MIME by content, scans where required, extracts dimensions/metadata, strips unsafe metadata as policy requires, and creates variants.
4. PostgreSQL records immutable object key, checksum, dimensions, rights, attribution, source URL, crop/focal point and processing status.
5. CDN serves approved variants with immutable/versioned URLs.

Store originals separately from public derivatives. Never trust a filename or client-provided MIME. Isolate image tooling and cap decompression/processing resources.

## Variants

At minimum: original, article hero, card, thumbnail, social/OG, and responsive widths. Prefer on-demand transformation only when the provider guarantees predictable caching and abuse limits; otherwise precompute editorially important sizes.

## Rights and attribution

Capture owner, license/rights status, credit line, embargo/expiry, source attribution and permitted channels. A media asset can be attached to multiple revisions only when rights permit. Prevent publication when required rights fields are incomplete.

## Migration

Inventory local `apps/cms/public/uploads` and any S3 objects, map Strapi media IDs/URLs to checksums, copy before content import, generate variants, and preserve old URLs through CDN/origin redirects during the transition.
