# 17 — Architecture decisions

## Accepted

1. **ADR-001: PostgreSQL is authoritative.** Editorial truth, revisions, audit, source metadata and outbox live here; caches/search are projections.
2. **ADR-002: Modular monolith first.** NestJS modules share a deployable runtime and explicit boundaries; no microservices initially.
3. **ADR-003: Separate public web and newsroom.** Their security, UX and caching needs differ.
4. **ADR-004: REST-first contracts.** Use OpenAPI/typed DTOs; reserve realtime protocols for measured needs.
5. **ADR-005: Revisioned editorial model.** Published content points to an approved revision/translation; corrections create new revisions.
6. **ADR-006: Transactional outbox.** Async consumers never depend on dual writes from a request handler.
7. **ADR-007: Central AI Gateway.** Provider/model/prompt/cost/provenance policy is centralized and human approval is mandatory. Google Gemini is the initial provider, reached only through the Gateway's adapter pattern, never called directly from domain modules.
8. **ADR-008: Cloudflare R2 plus CDN.** Object storage is separate from database and public delivery is cache-friendly. R2 is confirmed over generic S3; no egress fees when paired with Cloudflare's CDN.
9. **ADR-009: Capability authorization over role branching.** Roles compose capabilities and scopes.

## Deferred with revisit triggers

- **OpenSearch:** advanced faceting/autocomplete/semantic or measured scale/latency.
- **Temporal:** long-running, durable, human-interrupted workflows that need workflow history beyond BullMQ.
- **Kafka:** high-volume replayable streams with independently operated consumers.
- **Kubernetes:** actual scheduling/autoscaling/multi-service needs beyond managed containers.
- **Microservices:** a module needs independent scaling/security/release/failure isolation and has stable contracts.
- **ClickHouse:** analytics facts and concurrency make PostgreSQL/external BI insufficient.
- **WebSocket collaborative editing:** concurrent editors require presence/real-time merging.

Each revisit must include measured load, operational cost, failure model and migration path.
