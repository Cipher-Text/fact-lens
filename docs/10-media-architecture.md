# 10 — Media architecture

## Storage flow

1. API creates an upload intent with allowed MIME/size/context.
2. Client uploads to Cloudflare R2 using a short-lived signed URL or controlled proxy.
3. Worker verifies MIME by content, scans where required, extracts dimensions/metadata, strips unsafe metadata as policy requires, and creates variants.
4. PostgreSQL records immutable object key, checksum, dimensions, rights, attribution, source URL, crop/focal point and processing status.
5. CDN serves approved variants with immutable/versioned URLs.

Store originals separately from public derivatives. Never trust a filename or client-provided MIME. Isolate image tooling and cap decompression/processing resources.

## Variants

At minimum: original, article hero, card, thumbnail, social/OG, and responsive widths. Prefer on-demand transformation only when the provider guarantees predictable caching and abuse limits; otherwise precompute editorially important sizes.

## Branded cards and posters

FactLens generates branded photocards/posters from a raw photo (e.g. for social sharing) using **deterministic template compositing**, not a generative image model. A `CardTemplate` defines fixed slots — logo/watermark position, frame/gradient, headline/byline text region, aspect ratio (square, vertical/story, landscape) — and a worker job composites a selected `MediaAsset` plus story text into that template using standard image-processing tooling (e.g. Sharp/node-canvas). The result is stored as a `GeneratedCard`, itself a `MediaAsset` variant linked back to its source photo, template id/version, and the story revision it was generated for.

This keeps card generation fast, free of per-call AI cost, and visually consistent with FactLens's brand every time — an editor picks a photo and template, the system renders the composite, and the editor can regenerate with a different template or crop before publishing. AI is not part of the base image; if AI-assisted crop/focal-point or headline-fit suggestions are added later, they only ever produce a *suggested* input to this same deterministic pipeline (see [AI architecture](./11-ai-architecture.md)), never the pixels themselves.

Validate template assets (SVG/font files) the same way as any upload — no active content, size/dimension caps, isolated rendering.

## Rights and attribution

Capture owner, license/rights status, credit line, embargo/expiry, source attribution and permitted channels. A media asset can be attached to multiple revisions only when rights permit. Prevent publication when required rights fields are incomplete.

## Migration

Inventory local `apps/cms/public/uploads` and any S3 objects, map Strapi media IDs/URLs to checksums, copy before content import, generate variants, and preserve old URLs through CDN/origin redirects during the transition.
