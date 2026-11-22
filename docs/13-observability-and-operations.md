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

The decided platform runs PostgreSQL on the Hetzner VM and stores encrypted scheduled backups in Cloudflare R2 ([deployment plan](./plans/deployment.md)). Build a restore drill into an isolated environment and record RPO/RTO results before launch. Redis can be rebuilt; outbox, audit and news item data cannot.

## Operations

The target deployment builds Docker images with pinned Node/pnpm and deploys the public site, API, worker, newsroom, PostgreSQL and Redis in Compose on one Hetzner VM, with R2 for media ([deployment plan](./plans/deployment.md)). Images, dependency scans and deployment are not built yet. Scale services independently only when release or capacity needs justify it, while preserving one repository and shared contracts.

## Status

Built: request IDs on every API response (accepted from the caller when well-formed), JSON request logs from Fastify, JSON logs from the worker with job type, id, attempt and duration, API liveness and readiness endpoints (readiness checks PostgreSQL and Redis, with a timeout on each), a worker health endpoint with queue counts, outbox backlog, dead letters and oldest pending age, and GitHub Actions CI against real PostgreSQL and Redis, plus an S3-compatible server, RustFS (the storage step; it passes locally and runs in CI on the same image).

Not built: OpenTelemetry traces, Sentry, metrics, dashboards, alerts, Docker images, deployment, backups and restore tests, retention jobs (for `processed_job`, old outbox rows and orphaned stored files), and log redaction rules beyond not logging tokens. See [implementation status](./22-implementation-status.md).
