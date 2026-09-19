# 20 — Phase 1 backlog

This is a capability backlog, not an estimate.

## Epic A — Repository and delivery foundation

- Create pnpm workspace and app/package boundaries.
- Add TypeScript config, lint/test/build conventions, environment validation and secret scanning.
- Add Docker images, local PostgreSQL/Redis emulators, an R2-compatible local object-storage emulator (e.g. Miniflare/Wrangler R2 or MinIO in S3-API mode), GitHub Actions CI and managed deployment skeleton.
- Add OpenAPI generation and contract compatibility checks.

## Epic B — API and persistence

- Bootstrap NestJS with Fastify, request IDs, error envelope and health endpoints.
- Add PostgreSQL migrations, connection pooling and transaction helpers.
- Implement Story, StoryRevision, StoryTranslation, Contributor, Category, Tag, Desk and MediaAsset tables.
- Implement Source/StorySource, Assignment, Comment, Correction, AuditEvent and Outbox tables.
- Add slug/canonical/redirect registry and publication read models.

## Epic C — Authentication and authorization

- Integrate OIDC callback/session flow.
- Map identities to capabilities/scopes and enforce in API guards/services.
- Add privileged-action audit events and MFA/provider configuration checks.

## Epic D — Editorial core

- Story/revision/translation commands and queries.
- Tiptap document schema, sanitization and HTML import compatibility fixture.
- Workflow transition policy and publish/schedule validation.
- Source attachment, comments, assignments, correction record and revision timeline.

## Epic E — Async and operations

- Add Redis/BullMQ worker scaffold and idempotent job envelope.
- Add transactional outbox dispatcher with retries/dead-letter visibility.
- Add cache invalidation, search projection and media-variant job stubs.
- Add structured logs, traces/metrics baseline, Sentry integration and queue/database dashboards.

## Epic F — Newsroom shell

- Desk queue and story workspace.
- Revision/history and comments panels.
- Source inbox placeholder and media library.
- Publish/schedule review screen with capability-aware controls.

## Epic G — Advertising module

- Implement Advertiser, AdCampaign, AdPlacement, Ad and AdEvent tables, carrying forward CipherPress's current design.
- Ad serving and HMAC-signed redirect endpoints with strict target-URL validation and abuse controls.
- Weighted/device/locale/category targeting rules.
- IP-hashed ad-event tracking with a reviewed retention policy (see [open questions](./19-open-questions.md)).
- Newsroom admin screens for campaign/placement management, gated by an `ads.manage` capability.

## Recommended sequence

A → B → C → D → E → F, with contract tests and migration fixtures introduced during B rather than postponed. Epic G is an independent commercial domain module; it can proceed in parallel with D/E once B and C land, since it does not extend the editorial workflow. Do not begin public cutover work until D can publish a complete bilingual story, E can invalidate/update derived projections safely, and G's ad-serving/redirect endpoints pass abuse-control review.
