# 13 — Observability and operations

## Baseline

- Structured JSON logs with request ID, trace ID, actor scope, route, status, latency and error class; redact tokens, source secrets and personal data.
- OpenTelemetry traces across web/API/DB/Redis/worker where supported.
- Sentry or equivalent for frontend/API/worker exceptions with source maps and release IDs.
- Metrics for API latency/error rate, DB pool saturation, cache hit rate, queue depth/age/failure/retry, ingestion failure, AI latency/cost/error, publish failure, search-index lag, media processing and storage.
- Dashboards for public SLOs, newsroom health, queue operations, database health and migration/cutover.

## Alerts

Alert on sustained 5xx/latency, DB connection exhaustion, queue age/backlog, repeated connector/provider failures, publish job failures, indexing lag, storage failures, auth anomalies and backup/restore failures. Alerts should point to runbooks and include safe correlation IDs.

## Backups and recovery

Use managed PostgreSQL PITR plus scheduled snapshots, object-storage versioning/lifecycle and encrypted off-site backup where required. Test a restore into an isolated environment on a schedule and record RPO/RTO results. Redis can be rebuilt; outbox/audit/story data cannot.

## Operations

Docker images are built by GitHub Actions with pinned Node/pnpm and dependency scans. Prefer managed PostgreSQL/Redis/object storage and a managed container runtime initially. Deploy API/web/worker independently only when release and scaling benefits justify it, while preserving one repository and shared contracts.
