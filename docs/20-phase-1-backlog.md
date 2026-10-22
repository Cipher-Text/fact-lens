# 20 — Phase 1 backlog

This is a capability backlog, not an estimate. Each item is tagged with where it stands as of 21 October 2026; [implementation status](./22-implementation-status.md) has the summary.

## Epic A — Repository and delivery foundation

- Create pnpm workspace and app/package boundaries. *Done.*
- Add TypeScript config, lint/test/build conventions, environment validation and secret scanning. *Partial: all but secret scanning.*
- Add Docker images, local PostgreSQL/Redis emulators, an R2-compatible local object-storage emulator (e.g. Miniflare/Wrangler R2 or MinIO in S3-API mode), GitHub Actions CI and managed deployment skeleton. *Partial: local PostgreSQL, Redis and MinIO (compose) and CI are done; Docker images and a deployment skeleton are not.*
- Add OpenAPI generation and contract compatibility checks. *Not started (see ADR-018).*

## Epic B — API and persistence

- Bootstrap NestJS with Fastify, request IDs, error envelope and health endpoints. *Done.*
- Add PostgreSQL migrations, connection pooling and transaction helpers. *Done.*
- Implement News item, NewsRevision, NewsTranslation, Contributor, Category, Tag, Desk and MediaAsset tables. *Done.*
- Implement Source/NewsSource, Assignment, Comment, Correction, AuditEvent and Outbox tables. *Done.*
- Implement CardTemplate and GeneratedCard tables. *Tables done; no endpoints or generation job.*
- Implement Configuration and FeatureFlag tables (workflow-transition policy, AI provider/model/budget, rate limits, retention rules, supported locales; see [configuration and feature flags](./21-configuration-and-feature-flags.md)).
- Add slug/canonical/redirect registry and publication read models. *Partial: the slug registry, redirects between a news item's own slugs and the published news item read model are done; a registry of legacy URLs is not.*

## Epic C — Authentication and authorization

- Integrate OIDC callback/session flow. *Done in the newsroom (server-side code flow with PKCE); no refresh; only the fake provider tried.*
- Map identities to capabilities/scopes and enforce in API guards/services. *Done (roles table, default-deny guard); desk-scoped roles not modeled.*
- Add privileged-action audit events and MFA/provider configuration checks. *Done for audit and the MFA rule; no provider configuration checks.*

## Epic D — Editorial core

- News item/revision/translation commands and queries. *Done.*
- Tiptap document schema, sanitization and HTML import compatibility fixture. *Partial: schema, validation and the editor are done; the HTML import fixture is not.*
- Workflow transition policy and publish/schedule validation. *Done.*
- Categories and tags in every supported language (menu order, descriptions, tag pictures), language administration, and per-language public navigation and lists. *Done in the API and the newsroom; `apps/web` does not use them yet.*
- Source attachment, comments, assignments, correction record and revision timeline. *Done in the API; the newsroom lacks screens to create assignments and sources.*

## Epic E — Async and operations

- Add Redis/BullMQ worker scaffold and idempotent job envelope. *Done.*
- Add transactional outbox dispatcher with retries/dead-letter visibility. *Done; dead letters show as counts on the worker health endpoint, no dashboard.*
- Add cache invalidation, search projection, media-variant and branded photocard/poster generation (`media.card_generate`) job stubs. *Done as stubs: cache and search log and succeed; media jobs fail as "not implemented".*
- Add structured logs, traces/metrics baseline, Sentry integration and queue/database dashboards. *Partial: JSON logs and health endpoints; no traces, metrics, Sentry or dashboards.*

## Epic F — Newsroom shell

- Desk queue (numbers, stage tabs, table) and news item workspace in the Admin UI design ([docs/design](./design/newsroom-admin-ui.html)). *Done; the design's fact-check panel is not built (open question 15).*
- Revision/history and comments panels. *Partial: timeline and comments done; no revision list or comparison screen.*
- Source inbox placeholder and media library, including branded photocard/poster generation from a photo using FactLens templates. *Partial: placeholder and media library done; card generation not.*
- Publish/schedule review screen with capability-aware controls. *Partial: next steps (including scheduling) are on the news item page; no separate review screen or calendar.*
- Configuration screen (workflow policy, AI budgets, rate limits, retention rules, feature flags), gated by `config.manage`. *Partial: feature flags and supported languages only.*

## Epic G — Advertising module

- Implement Advertiser, AdCampaign, AdPlacement, Ad and AdEvent tables, carrying forward CipherPress's current design. *Tables done; no endpoints.*
- Ad serving and HMAC-signed redirect endpoints with strict target-URL validation and abuse controls. *Not started.*
- Weighted/device/locale/category targeting rules. *Columns only; no selection logic.*
- IP-hashed ad-event tracking with a reviewed retention policy (see [open questions](./19-open-questions.md)). *Table only; no capture, and the retention policy is open.*
- Newsroom admin screens for campaign/placement management, gated by an `ads.manage` capability. *Not started (the capability exists).*

## Recommended sequence

A → B → C → D → E → F, with contract tests and migration fixtures introduced during B rather than postponed. Configuration/FeatureFlag tables (part of B) land before D, since D's workflow-transition policy and E's rate limits/budgets read from them rather than hardcoding values. Epic G is an independent commercial domain module; it can proceed in parallel with D/E once B and C land, since it does not extend the editorial workflow. Do not begin public cutover work until D can publish a complete bilingual news item, E can invalidate/update derived projections safely, and G's ad-serving/redirect endpoints pass abuse-control review.
