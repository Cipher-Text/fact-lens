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

## Implementation notes (apps/api, apps/newsroom)

- **Upload path:** the "controlled proxy" option. The newsroom sends the image's own bytes to `POST /media` (through its `/api` proxy, which accepts JPEG, PNG and WebP up to the configured limit, 10 MB by default and never above 25 MB). The API decides the type from the bytes (magic numbers), never from the filename or header, so a PNG sent as JPEG is stored as a PNG and an SVG, PDF or script is refused. Identical bytes return the existing asset, and the checksum is unique in the database, so two simultaneous uploads of one file make one asset.
- **Sanitizing and variants:** each upload is decoded (capped at about 40 megapixels) and re-encoded, which drops EXIF, GPS and anything hidden after the image, and applies the recorded rotation. The API makes a thumb (320 px), card (800 px) and hero (1600 px) as WebP, never enlarged, and stores the sanitized original under `originals/` and derivatives under `derivatives/`. This happens during the request, so an asset is `ready` as soon as the upload returns; the `pending`, `processing` and `failed` states and the worker's `media.variant` job are unused until processing moves to the worker.
- **Storage:** `STORAGE_DRIVER=fs` (a local folder, development) or `s3` (any S3-compatible store: R2, MinIO, S3). Production requires `s3`. The S3 client is tested against a stand-in HTTP server, which proves the wiring but not request signing.
- **Rights:** owner, credit line (`attribution`), licence, source address, expiry, permitted channels (web, social, print) and notes. Publishing is refused for an image with no licence or credit, expired rights, a missing web permission, or an image in the body without alt text. Rights are checked again on every public read, so an image whose rights lapse after publication stops being served and stops appearing in the public story's `media` list.
- **Who sees what:** the newsroom may fetch any variant, including the original, with a signed-in token. Readers get only derivatives, only of an image used by a live story, through `/public/media/:id/:variant`; the original is never public. Deleting an image used by a story, ad or card is refused; deleting an unused one removes its stored files.
- **Editor:** the library picker lives outside the story form (so its Enter key cannot save the story), prefills the asset's alt text, and inserts an image node that holds only the asset id and alt text.
- **Not built:** moving variant generation to the worker, malware scanning, upload rate limits, crop and focal point, social cards from the library, a sweep for orphaned stored files, migration of cipher-press uploads, and a CDN in front of `/public/media`.

