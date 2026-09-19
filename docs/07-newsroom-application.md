# 07 — Newsroom application

The newsroom is a separate Next.js app using the same contracts and design primitives as the public web where useful. It is not a customized Strapi Admin replacement; it is task-oriented around editorial decisions.

## Primary screens

- **Desk queue:** assigned stories, due dates, workflow state, locale completeness and blockers.
- **Story workspace:** Tiptap/ProseMirror editor, revision timeline, autosave draft, side-by-side locale view, sources, entities, SEO and publish controls.
- **Source inbox:** ingested items, deduplication candidates, source metadata, retrieval status and triage actions.
- **Review/fact-check:** comments, claims/evidence checklist, unresolved issues and approval history.
- **Media library:** search, upload, rights/attribution, crops/variants and attachment context.
- **Publishing calendar:** schedules, locale/channel readiness, conflicts, failed jobs and cancellation.
- **Taxonomy/entities:** controlled vocabulary, aliases, merge/archive workflows and impact preview.
- **Analytics:** publication and distribution metrics with access controls; operational metrics remain in observability tooling.
- **Advertising:** advertiser/campaign/placement management, targeting rules, redirect-token health and ad-event delivery status; gated by `ads.manage`.
- **Audit/admin:** capability assignments, audit search, redirect registry, provider/config health.

## Editor behavior

Use structured blocks where possible, sanitize on input and render, preserve source embeds as explicit safe types, and store an editor schema/version. Autosave creates draft revisions or checkpoints without making them publishable. The UI must show whether a field is human-authored, imported or AI-proposed.

## Collaboration and realtime

Start with optimistic saves, revision conflict detection and comments. Add SSE for job progress, publish results and queue updates. Add WebSocket/live collaborative editing only if concurrent editing is a proven workflow requirement; it carries significant conflict and presence complexity.

## Public/newsroom boundary

The public app consumes only a read model/API that exposes published translations, approved media, SEO and redirect behavior. The newsroom can access drafts and audit data through authenticated endpoints. API DTOs should prevent accidental leakage of private source notes, contributor email or internal comments.
