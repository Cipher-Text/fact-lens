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
