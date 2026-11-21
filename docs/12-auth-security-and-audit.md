# 12 — Authentication, security, and audit

## Authentication and authorization

Sign-in is managed by the backend (ADR-046, plan in docs/plans/auth-in-app.md): accounts are created by admin invitation; passwords are hashed with Argon2id; MFA is authenticator-app codes (TOTP) with recovery codes, required for privileged capabilities; an editor's sign-in lasts 8 hours, with 15-minute access tokens and single-use, rotating refresh tokens (reuse ends the sign-in and is audited); five failed sign-ins in 15 minutes lock the account for 15 minutes; sign-in attempts are rate limited per address. Browser sessions use secure HTTP-only cookies. The API verifies its own signed tokens with the same checks as before (issuer, audience, expiry). Until the email provider is chosen, invitations and reset links are passed on by an admin.

Map identity claims to capabilities, desk membership and scoped resources. Keep role definitions configurable; authorization checks must be enforced in API services, not only hidden in UI.

## Controls

- Validate and sanitize Tiptap/HTML server-side and at rendering boundaries; apply CSP and safe link/image policies.
- Rate-limit login, public search, ingestion, uploads, ad redirects, the news view tracking beacon, the newsletter subscribe endpoint, media/card-generation processing and expensive AI operations with shared Redis counters.
- Newsletter subscription requires double opt-in and a working unsubscribe link in every send; treat the subscriber list as personal data under the same minimize/retain/delete policy as other personal data.
- De-duplicate news view beacon hits per session per news item per time window to resist "most read"/trending manipulation; apply basic bot/UA heuristics on the beacon endpoint.
- CSRF protection for cookie-authenticated state-changing requests; strict CORS and origin checks.
- SSRF protection for source fetches: allowlists, private-IP blocking, DNS re-checks, redirects/size/time limits.
- Upload controls: extension/MIME/content verification, size limits, malware-scanning option, isolated image processing and safe SVG policy.
- Validate canonical/redirect URLs and block open redirects.
- Store secrets in managed secret storage; scan commits/CI artifacts. Rotate the credential risk identified at `cipher-press/docs/metabase/scripts/metabase_config.env`.
- Encrypt in transit/at rest where available; minimize personal data; define retention/deletion for IP hashes, source snapshots and AI logs.
- Back up PostgreSQL and object storage; test restore, not just backup creation.
- Pin dependencies, run dependency/container scanning, least-privilege CI tokens and protected deployment environments.

## Audit

Audit authentication, authorization changes, news item/revision state, publish/correct/archive, source/media changes, AI acceptance/rejection, redirects, exports and administrative configuration — including every runtime configuration/feature-flag change (see [configuration and feature flags](./21-configuration-and-feature-flags.md)). Audit records include actor, time, request/trace ID, object/revision, action, reason and before/after references without logging secrets.

## Status

Built and tested:

- **Authentication:** the API accepts bearer tokens only, validates signature (asymmetric algorithms only), issuer, audience and expiry, and refuses everything not marked public (default deny). Protected routes answer 401 without a valid backend-managed token; production requires the backend signing and encryption keys, issuer, and newsroom URL.
- **Authorization:** capabilities, never role names; roles are rows in `app_role`. Privileged capabilities need a multi-factor sign-in when `OIDC_REQUIRE_MFA` is on (the default). A denied attempt by a signed-in person is audited; anonymous failures are not, so they cannot flood the log.
- **Browser sessions:** an encrypted, HttpOnly, SameSite=Lax cookie holding the token; writes need a matching `Origin`; the proxy reaches only the newsroom's routes; the internal worker endpoint uses a separate shared secret compared in constant time.
- **Audit:** append-only in the database. Covered: news item create, transitions, revise, correct, metadata and source changes, assignments, source creation and validation, contributor creation, media upload, rights change and delete, feature-flag changes (with reason), and authorization denials.
- **Input:** news item bodies are checked against an allowlist (no unknown nodes, marks or attributes; links only to web and mail addresses); uploads are sniffed, size-capped, pixel-capped and re-encoded; source and ad URLs must be http or https; untrusted text lengths are capped in the database.
- **Public data:** public routes return only published content and derivatives, never contact details, internal comments, source notes or originals.

Secrets locally live in one root `.env`, which git ignores and `pnpm env:init` creates with `0600` permissions and random values for the session and internal secrets. That file is for development; a deployment must give each service only its own variables, so the newsroom never holds the database password.

Built: sign-in inside the backend with refresh, MFA and lockout (ADR-046, ADR-047). Not built: rate limits beyond sign-in, public search and the view beacon (other seeded limits are not enforced), CSP/security-header review for the public site, secret scanning, dependency and container scanning, malware scanning of uploads, the external security review, and CSRF protection beyond the origin check and SameSite. See [implementation status](./22-implementation-status.md).
