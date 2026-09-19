# FactLens rebuild documentation

This set of documents plans a rebuild of FactLens as a digital newsroom platform. The evidence base is the read-only sibling repository `../../cipher-press` from this file’s location. Statements about the existing system are marked **CURRENT**; recommendations are **TARGET**, **PROPOSED**, or **DEFERRED**.

## Summary

**CURRENT:** CipherPress is a pnpm workspace containing a Next.js 14 public site, a Strapi 4 CMS backed by PostgreSQL, shared UI/utility packages, seed JSON, Docker deployment, and CI/CD. Editors work in Strapi Admin. The public site supports bilingual English/Bengali articles, categories, tags, authors, search, ads, SEO metadata, sitemap/robots, analytics tags, and signed revalidation.

**TARGET:** FactLens should be a TypeScript platform with separate public web and purpose-built newsroom apps, a NestJS/Fastify modular-monolith API, PostgreSQL as source of truth, Redis plus BullMQ for asynchronous work, S3-compatible media storage, OIDC and capability-based authorization, and a centralized AI Gateway. The public site remains Next.js and CDN/cache-first. Advertising (Advertiser/Campaign/Placement/Ad/AdEvent) is confirmed in Phase 1 launch scope, carried forward from CipherPress's current design as a separate commercial module.

**Major migration challenges:** preserve published URLs and timestamps; convert Strapi localization links and HTML into a revisioned bilingual story model; migrate media and attribution; reproduce SEO/sitemap/analytics behavior; replace Strapi Admin workflows without losing editorial continuity; and validate every imported relation and redirect.

**Recommended first implementation milestone:** Phase 0/1 foundation with a migration inventory fixture, canonical URL registry, PostgreSQL schema for Story/Revision/Translation/Taxonomy/Media, API contracts, OIDC integration, audit events, and a minimal newsroom shell. Do not cut over public traffic yet.

**Intentionally deferred:** OpenSearch, Temporal, Kafka, Kubernetes, microservices, ClickHouse, generalized entity intelligence, and advanced distribution automation. Triggers are documented in [technology decisions](./04-technology-decisions.md) and [architecture decisions](./17-architecture-decisions.md).

## Reading order

1. [Current system assessment](./01-current-system-assessment.md)
2. [Product and platform scope](./02-product-and-platform-scope.md)
3. [Target architecture](./03-target-architecture.md)
4. [Technology decisions](./04-technology-decisions.md)
5. [Domain model](./05-domain-model.md)
6. [Editorial workflow](./06-editorial-workflow.md)
7. [Newsroom application](./07-newsroom-application.md)
8. [Ingestion and automation](./08-ingestion-and-automation.md)
9. [Search and discovery](./09-search-and-discovery.md)
10. [Media architecture](./10-media-architecture.md)
11. [AI architecture](./11-ai-architecture.md)
12. [Auth, security, and audit](./12-auth-security-and-audit.md)
13. [Observability and operations](./13-observability-and-operations.md)
14. [Data migration plan](./14-data-migration-plan.md)
15. [Repository structure](./15-repository-structure.md)
16. [Implementation roadmap](./16-implementation-roadmap.md)
17. [Architecture decisions](./17-architecture-decisions.md)
18. [Risk register](./18-risk-register.md)
19. [Open questions](./19-open-questions.md)
20. [Phase 1 backlog](./20-phase-1-backlog.md)

## Scope note

No application code is implemented by this plan. `cipher-press` must remain unchanged until a separately approved migration or compatibility project begins.
