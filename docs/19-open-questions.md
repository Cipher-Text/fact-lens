# 19 — Open questions

These require product, editorial or business input; they are not unresolved merely because implementation detail remains.

1. Which desks and editorial roles exist at launch, and who may approve/fact-check/correct each desk’s work?
2. What are the canonical public locale policies for English and Bengali, including whether localized slugs may diverge?
3. What correction display policy is required: inline notice, correction history page, or both?
4. Which source types may be ingested automatically (including which specific Telegram channels), and what copyright/terms/robots policy governs retrieval and raw snapshot retention?
5. Which contributor contact fields may migrate and who can view them?
6. What publishing SLA, RPO/RTO, traffic baseline and peak-event assumptions should set capacity targets?
7. Which OIDC provider constraints apply: managed tenancy, self-hosting, region, MFA, directory integration and lifecycle automation?
8. Which distribution channels are launch requirements versus later experiments?
9. What analytics consent, retention and newsroom access policy applies to public readers and internal users?
10. IP-hash retention window and IP-hashing algorithm for AdEvent records: what policy governs how long hashed IPs are kept and how they may be used?
11. What editorial transformation-threshold policy applies to AI-drafted rewrites of ingested source articles before they may be approved — e.g. minimum original reporting/editing, mandatory attribution wording, and any source types excluded from rewrite entirely?

Resolved: advertising is confirmed part of the Phase 1 launch scope, carrying forward CipherPress's current Advertiser/Campaign/Placement/Ad/Event design as-is (see [product and platform scope](./02-product-and-platform-scope.md) and [domain model](./05-domain-model.md)).

Resolved: Telegram channels are a named ingestion source type, using the Bot API (see [ingestion and automation](./08-ingestion-and-automation.md)); which specific channels remains covered by open question 4.
