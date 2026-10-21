# 18 — Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Published URL/slug loss | SEO and reader traffic loss | Full URL inventory, immutable redirect registry, crawl/diff tests, staged cutover |
| Localization pairs mislinked | Wrong language/duplicate stories | Validate syncKey + locale + title/slug; manual exception queue |
| HTML conversion changes meaning/layout | Editorial/content loss | Preserve raw source, parser fixtures, visual/text diff, manual sample review |
| Media objects missing or rights unknown | Broken pages/legal exposure | Checksum inventory, copy/variant validation, rights blocking and old-URL fallback |
| Timestamp/attribution drift | Trust and audit loss | Preserve source timestamps/legacy IDs; compare exports and display attribution |
| Workflow too complex for desks | Adoption failure | Phase 1 minimal transitions, capability rules, pilot with editors |
| AI hallucination/prompt injection | Editorial/reputational harm | Proposal-only policy, provenance, source isolation, human review and audits |
| AI rewrite insufficiently transformed from source | Copyright/plagiarism exposure, reputational harm | Proposal-only rewrite drafts, mandatory human rewrite/edit before review, retained source attribution, editorial transformation-threshold policy |
| Queue duplication or stuck jobs | Duplicate posts/distribution | Idempotency keys, leases, retries, dead-letter inspection and alerts |
| PostgreSQL search bottleneck | Slow newsroom/public search | Index/rank benchmarks, caching, read replica later, OpenSearch trigger |
| Dual-run divergence | Inconsistent public truth | Read-only old source, reconciliation IDs, controlled delta import and rollback |
| Secret exposure | Account/data compromise | Rotate identified metabase credential, secret scanning, managed vault, least privilege |
| In-memory current rate limits do not scale | Abuse/uneven protection | Redis-backed limits in target and edge/WAF controls |
| Ad redirect abuse/open-redirect surface carried forward from CipherPress | Click fraud, malicious redirects, reputational harm | Strict target-URL allowlisting, HMAC-signed tokens, Redis-backed rate limits on ad redirects, abuse-control review before Phase 4 cutover |
| Strapi undocumented behavior | Import surprises | Inspect schemas/lifecycles/routes, staging export, fixture-based comparison |
| Operational overload from premature infra | Delivery slowdown/cost | Modular monolith, managed services, explicit revisit triggers |
| Unreviewed runtime configuration change (rate limit, AI budget, retention rule, feature flag) causes an outage or policy violation | Availability/compliance exposure | Narrow `config.manage` grant, server-side validation, audit trail, staged/canary rollout for high-risk flags (see [configuration and feature flags](./21-configuration-and-feature-flags.md)) |
| Undefined data-retention policy (IP hashes, AI/rewrite logs, source snapshots) | Privacy/compliance exposure | Define retention/deletion policy before cutover (see [open questions](./19-open-questions.md) 4, 9, 10) |
| Story-view/"most read" ranking manipulated by bot traffic or spam | Misleading editorial signal, reputational harm | Per-session/story/window de-duplication, rate limits on the beacon endpoint, bot/UA heuristics, anomaly monitoring |

Added while implementing:

| Risk | Impact | Mitigation |
|---|---|---|
| Only a fake identity provider has been used | Sign-in may fail against the real provider (claims, MFA claim name, token size, logout) | Provider-neutral code, claims names are configuration; test against the chosen provider before any launch (open question 7) |
| The fake identity provider reaches a deployed environment | Anyone could sign in as an admin | It refuses to start with `NODE_ENV=production`, listens on loopback only, and is a dev dependency; keep it out of images |
| Placeholder role capabilities are mistaken for policy | People can do more or less than the desks intend | Roles are data, marked provisional in the seed; settle open question 1 before launch |
| Storage behaviour differs on the real object store | Uploads or serving fail in production | CI runs the storage tests against MinIO; run them against R2 in staging; the client avoids SDK defaults some stores reject |
| No rate limits yet, though limits are seeded | Upload, sign-in and public-route abuse | Build Redis-backed enforcement before any public exposure; the upload size cap and image pixel cap exist now |
| Synchronous image processing during upload | Slow requests, memory spikes on large images | 40-megapixel and configured size caps; move to the worker (`media.variant`) before heavy use |
| Screens are hand-checked only | Regressions in the newsroom go unnoticed | Add browser tests (Playwright) before the newsroom has real users |
| Rights fields complete on paper but wrong in fact | Unlicensed images published | Rights are required and checked at publish and on every public read; a person still has to enter true values |
