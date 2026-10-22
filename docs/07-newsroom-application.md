# 07 — Newsroom application

The newsroom is a separate Next.js app using the same contracts and design primitives as the public web where useful. It is not a customized Strapi Admin replacement; it is task-oriented around editorial decisions.

## Primary screens

- **Desk queue:** assigned news items, due dates, workflow state, locale completeness and blockers.
- **News item workspace:** Tiptap/ProseMirror editor, revision timeline, autosave draft, side-by-side locale view, sources, entities, SEO and publish controls.
- **Source inbox:** ingested items, deduplication candidates, source metadata, retrieval status and triage actions.
- **Review/fact-check:** comments, claims/evidence checklist, unresolved issues and approval history.
- **Media library:** search, upload, rights/attribution, crops/variants, attachment context, and branded photocard/poster generation from a photo using FactLens templates.
- **Publishing calendar:** schedules, locale/channel readiness, conflicts, failed jobs and cancellation.
- **Taxonomy/entities:** controlled vocabulary, aliases, merge/archive workflows and impact preview. Built so far (`/taxonomy`, gated by `taxonomy.manage`): the menu sections (order, show or hide, a name and description per language), tags (search in any language, a name per language), archive, and a warning where a language has no name. Tags are picked per news item in the Details panel. Merge and impact preview are not built.
- **Analytics:** per-item performance (first-party view counts, "most read"/trending rankings), publication and distribution metrics with access controls; operational metrics remain in observability tooling.
- **Advertising:** advertiser/campaign/placement management, targeting rules, redirect-token health and ad-event delivery status; gated by `ads.manage`.
- **Configuration:** workflow-transition policy per desk, AI provider/model/budget per use case, rate limits, retention rules, supported locales (add or switch off a language), and module feature flags; gated by `config.manage` and audited like any other privileged action (see [configuration and feature flags](./21-configuration-and-feature-flags.md)).
- **Audit/admin:** capability assignments, audit search, redirect registry, provider/config health.

## Editor behavior

Use structured blocks where possible, sanitize on input and render, preserve source embeds as explicit safe types, and store an editor schema/version. Autosave creates draft revisions or checkpoints without making them publishable. The UI must show whether a field is human-authored, imported or AI-proposed.

## Collaboration and realtime

Start with optimistic saves, revision conflict detection and comments. Add SSE for job progress, publish results and queue updates. Add WebSocket/live collaborative editing only if concurrent editing is a proven workflow requirement; it carries significant conflict and presence complexity.

## Public/newsroom boundary

The public app consumes only a read model/API that exposes published translations, approved media, SEO and redirect behavior. The newsroom can access drafts and audit data through authenticated endpoints. API DTOs should prevent accidental leakage of private source notes, contributor email or internal comments.

## Implementation notes (apps/newsroom)

- **Sign-in:** a server-side authorization code flow with PKCE, state and nonce against any OIDC provider (`OIDC_ISSUER`); the provider choice (open question 7) is still open, so nothing provider-specific is assumed. The access token is kept in an AES-GCM encrypted, HttpOnly, SameSite=Lax cookie that lives exactly as long as the token; there is no refresh yet, so an expired token sends the person through sign-in again. Locally, `pnpm dev:idp` provides a fake provider.
- **API access:** the browser never sees the API or the token. `/api/*` adds the bearer token and forwards only newsroom routes (not `/internal`, `/public` or health), refuses writes whose `Origin` is not this site, and accepts JSON only. The API still decides every request.
- **Screens built** (in the layout, colours and status pills of the Admin UI design, [docs/design](./design/newsroom-admin-ui.html)): desk queue with four numbers, stage tabs with counts, a table and "my assignments"; new news item; news item workspace (rich-text translation editing with version-conflict detection, workflow next steps, desk, section and credits, comments, sources, assignments, timeline, revision and correction forms, and an image picker); media library with upload, search, rights form and delete; configuration (supported languages, and feature flags with a required reason); sections and tags (menu order, show or hide, a name and description per language, tag pictures, archive); a tag picker on the news item page. Source inbox and publishing calendar are placeholders.
- **Editing:** a Tiptap editor limited to the news item body contract (paragraphs, headings 1 to 4, bold, italic, underline, strike, code, links to web and mail addresses, bulleted and numbered lists, quotes, dividers, hard breaks). Code blocks, tables, embeds and anything else a paste brings are dropped because the schema has no place for them. Images are references to media assets, inserted from the library picker (which prefills the asset's alt text) and shown as the real picture; the picker sits outside the news item form so its Enter key cannot save the news item. Before saving, the document is stripped of editor bookkeeping and checked against the strict contract, and the page warns before it is closed with unsaved changes. Locked revisions are shown with a read-only renderer that builds elements from the validated JSON and never injects markup.
- **Theme:** System, Light or Dark from a control in the header (and on the signed-out and sign-in problem pages). The choice is kept in local storage under `nr-theme`; "System" follows the operating system and is the default. A small script in `<head>` sets the `dark` or `light` class on `<html>` before the first paint, and both the colour variables and Tailwind's `dark:` classes follow that class. The public site (`apps/web`) is separate: it starts light on every device by design and has its own switch.
- **Not built:** the design's fact-check verdict panel and checklist (open question 15), global search, assignee and due columns on the desk queue, autosave checkpoints, comments on a selection, side-by-side locale view, source creation and validation screens, an assignment creation screen, comment replies in the screen, audit search, configuration values (rate limits, AI budgets), Bangla interface text, token refresh, automated browser tests.

