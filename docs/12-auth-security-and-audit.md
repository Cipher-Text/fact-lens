# 12 — Authentication, security, and audit

## Authentication and authorization

Use OIDC with short-lived access/session tokens, secure HTTP-only cookies for browser sessions, PKCE where applicable, issuer/audience validation, logout/revocation policy and MFA support for privileged users. Evaluate managed versus self-hosted OIDC based on residency, uptime, admin lifecycle, SCIM/ directory needs and cost.

Map identity claims to capabilities, desk membership and scoped resources. Keep role definitions configurable; authorization checks must be enforced in API services, not only hidden in UI.

## Controls

- Validate and sanitize Tiptap/HTML server-side and at rendering boundaries; apply CSP and safe link/image policies.
- Rate-limit login, public search, ingestion, uploads, ad redirects, the story-view tracking beacon, the newsletter subscribe endpoint, media/card-generation processing and expensive AI operations with shared Redis counters.
- Newsletter subscription requires double opt-in and a working unsubscribe link in every send; treat the subscriber list as personal data under the same minimize/retain/delete policy as other personal data.
- De-duplicate story-view beacon hits per session per story per time window to resist "most read"/trending manipulation; apply basic bot/UA heuristics on the beacon endpoint.
- CSRF protection for cookie-authenticated state-changing requests; strict CORS and origin checks.
- SSRF protection for source fetches: allowlists, private-IP blocking, DNS re-checks, redirects/size/time limits.
- Upload controls: extension/MIME/content verification, size limits, malware-scanning option, isolated image processing and safe SVG policy.
- Validate canonical/redirect URLs and block open redirects.
- Store secrets in managed secret storage; scan commits/CI artifacts. Rotate the credential risk identified at `cipher-press/docs/metabase/scripts/metabase_config.env`.
- Encrypt in transit/at rest where available; minimize personal data; define retention/deletion for IP hashes, source snapshots and AI logs.
- Back up PostgreSQL and object storage; test restore, not just backup creation.
- Pin dependencies, run dependency/container scanning, least-privilege CI tokens and protected deployment environments.

## Audit

Audit authentication, authorization changes, story/revision state, publish/correct/archive, source/media changes, AI acceptance/rejection, redirects, exports and administrative configuration — including every runtime configuration/feature-flag change (see [configuration and feature flags](./21-configuration-and-feature-flags.md)). Audit records include actor, time, request/trace ID, object/revision, action, reason and before/after references without logging secrets.

## Status

Built and tested:

- **Authentication:** the API accepts bearer tokens only, validates signature (asymmetric algorithms only), issuer, audience and expiry, and refuses everything not marked public (default deny). With no provider configured, protected routes answer 401; production refuses to start without one.
- **Authorization:** capabilities, never role names; roles are rows in `app_role`. Privileged capabilities need a multi-factor sign-in when `OIDC_REQUIRE_MFA` is on (the default). A denied attempt by a signed-in person is audited; anonymous failures are not, so they cannot flood the log.
- **Browser sessions:** an encrypted, HttpOnly, SameSite=Lax cookie holding the token; writes need a matching `Origin`; the proxy reaches only the newsroom's routes; the internal worker endpoint uses a separate shared secret compared in constant time.
- **Audit:** append-only in the database. Covered: story create, transitions, revise, correct, metadata and source changes, assignments, source creation and validation, contributor creation, media upload, rights change and delete, feature-flag changes (with reason), and authorization denials.
- **Input:** story bodies are checked against an allowlist (no unknown nodes, marks or attributes; links only to web and mail addresses); uploads are sniffed, size-capped, pixel-capped and re-encoded; source and ad URLs must be http or https; untrusted text lengths are capped in the database.
- **Public data:** public routes return only published content and derivatives, never contact details, internal comments, source notes or originals.

Secrets locally live in one root `.env`, which git ignores and `pnpm env:init` creates with `0600` permissions and random values for the session and internal secrets. That file is for development; a deployment must give each service only its own variables, so the newsroom never holds the database password.

Not built: token refresh, rate limiting (limits are seeded, nothing enforces them), CSP for the public site, secret scanning, dependency and container scanning, malware scanning of uploads, a real identity provider, and CSRF protection beyond the origin check and SameSite. See [implementation status](./22-implementation-status.md).
