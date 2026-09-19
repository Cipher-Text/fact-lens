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
