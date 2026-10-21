# 21 — Configuration and feature flags

## Principle

FactLens should be configurable by editorial and ops staff wherever a value legitimately varies by desk, market, time or policy — without a code deploy. Configurability is not free: every configurable surface adds validation, admin UX and testing cost, and a config change bypasses the code-review gate a deploy would otherwise force. Configure what changes without engineering involvement; keep what is a genuine architecture decision as code and an ADR, not a runtime toggle. "Highly configurable" means precise about *where*, not configurable everywhere.

## Configuration tiers

1. **Architectural decisions (ADRs, [architecture decisions](./17-architecture-decisions.md)):** compile-time, changed by code review and a new/amended ADR, never a runtime toggle. E.g. NestJS/Fastify, PostgreSQL as source of truth, Cloudflare R2, deterministic (not generative) card compositing.
2. **Environment/deployment config (`packages/config`, [repository structure](./15-repository-structure.md)):** per-environment values that differ between staging/production but are not editorial policy — DB connection strings, OIDC issuer, provider API keys, default feature-flag state. Set at deploy time by engineering, not by editors.
3. **Editorial/runtime configuration (PostgreSQL-backed, admin-editable):** values editors or ops should be able to change without engineering. This is where "highly configurable" mostly lives — see the list below.
4. **Feature flags:** independent boolean/staged-rollout switches for entire modules or capabilities, letting ops disable something per environment or per desk without a deploy. Particularly valuable here given how many newly-scoped features in this plan carry real risk (AI rewrite's copyright exposure, the ad-redirect abuse surface, Telegram ingestion's ToS dependency) — each should be flaggable off independently of the others.

## What should be editorial/runtime-configurable, and why

- **Workflow transition policy per desk** ([editorial workflow](./06-editorial-workflow.md)): whether fact-check is mandatory, which capability gates each transition. Already specified as policy-driven, not hardcoded — store it as desk-scoped configuration, not a single global rule.
- **AI provider/model/budget per use case** ([AI architecture](./11-ai-architecture.md)): the AI Gateway's adapter pattern already supports multiple providers; which provider/model/budget serves each use case (headline suggestions vs. rewrite vs. translation) should be an admin-editable policy record, not a code constant — lets ops react to cost, quality regressions or a provider outage without a deploy.
- **Prompt templates** (doc 11): already specified as versioned, stored records — reaffirmed here as the general pattern for editorial-facing generated text.
- **Ingestion source allowlist** ([ingestion and automation](./08-ingestion-and-automation.md)): already a data-driven allowlist (RSS feeds, Telegram channels, approved URLs). Adding, pausing or removing a source is a reviewed configuration change, not a deploy.
- **CardTemplate definitions** ([media architecture](./10-media-architecture.md)): already versioned, admin-editable design records.
- **Ad targeting rules, campaigns and placements** ([domain model](./05-domain-model.md)): already fully data-driven through the newsroom Advertising screen.
- **Rate limits and AI budgets per desk/use case** (doc 11, [auth/security](./12-auth-security-and-audit.md)): configurable thresholds, not hardcoded constants — ops should be able to tighten or loosen them without a deploy, especially given the number of abuse surfaces added this session (ad redirects, the story-view beacon, the Telegram webhook, AI rewrite).
- **Retention policies** (open questions 4, 9, 10 in [open questions](./19-open-questions.md)): once each is answered, store the answer as a configurable retention rule (entity type → days), not a hardcoded constant — retention obligations can change with law or a provider's ToS, and shouldn't require a deploy to update.
- **Supported locale set** (doc 05): canonical locales (`en`, `bn-BD` today) should be a configurable record (code, display name, direction, active/inactive), not a hardcoded enum, so adding a third language later is a configuration change, not a schema migration. This does not reopen the decision to launch with two locales — it only changes how a third would be added later.
- **Distribution/ingestion connectors** (doc 08, [implementation roadmap](./16-implementation-roadmap.md) Phase 5/6): follow the same adapter-plus-configuration-record pattern as ingestion sources; each connector is independently enable/disable-able and credential-configurable per environment.

## What should stay code, not configuration

- Domain invariants — revision append-only, a public URL resolves only to an approved revision/translation, etc. These are correctness guarantees, not policy toggles; making them configurable would let a misconfiguration corrupt editorial trust.
- The deterministic-vs-generative choice for card images (ADR-010) — a genuine architecture decision, not a runtime toggle.
- Core workflow *states* — the shape of the state machine itself. Transition *permissions* are configurable per desk (see above), but adding or removing states is a product decision needing a new ADR/migration; a fully configurable state machine risks desks inventing incompatible workflows that break auditability.
- Infra choices already governed by ADRs and revisit triggers (doc 17) — deliberately not feature flags; each has a stated trigger and a real migration cost attached.

## Where this lives technically

`packages/config` holds typed environment/deployment config (tier 2) only. Editorial/runtime configuration and feature flags (tiers 3-4) are PostgreSQL-backed records owned by the API, edited through a newsroom Configuration screen (see [newsroom application](./07-newsroom-application.md)), gated by a `config.manage` capability, and audited like any other privileged action ([auth/security](./12-auth-security-and-audit.md)). A config change that bypasses code review is still a production change — validate it server-side, and prefer staged/canary rollout for anything that can cause an outage or a policy violation (see the risk register).

## Status

Built:

- **Tables and validation:** `configuration` (one value per key and scope) and `feature_flag`; each configuration key has a value schema in `packages/contracts`, and the seed validates before it inserts.
- **Seeded and used:** `workflow.transition_policy` (global, with a per-desk override that the workflow reads on every move).
- **Seeded, not yet used:** nine `rate_limit.*` rows, six `ai.use_case.*` rows (budget zero). Nothing enforces or reads them yet. No `retention.*` rows exist because the policies are open ([19](./19-open-questions.md), 16).
- **Locales** are rows in `locale`, as the plan asks.
- **Feature flags:** 11, all off, with a screen to turn them on or off. Nothing reads a flag yet except that screen.
- **Admin screen:** feature flags only, gated by `config.manage`, MFA-protected, with a required reason, an audit row and an outbox event on every change. Editing configuration values has no screen or endpoint.

See [implementation status](./22-implementation-status.md).
