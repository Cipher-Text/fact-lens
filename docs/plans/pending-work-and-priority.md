# Pending work and implementation priority

Status as of commit `8e740a2` (pushed to `origin/main`). Each item says what is needed and what it depends on. Items keep their numbers across revisions; done items stay listed so the numbers do not move.

## Done since the previous revision

- The canonical public article address is `/story/<slug>-<id>` (ADR-027). Bare and old slugs redirect to it. Open question 14 is decided in part: the locale and prefix policy is still open.
- Imported cipher-press articles without a picture show on the public site with no hero image (ADR-051).
- An old `/news/<slug>` address redirects to `/story/<slug>` (301, same language).
- Item 11: the full legacy URL inventory is committed (`docs/plans/legacy-url-inventory.csv`, 2,517 addresses).
- Item 16: the Chromium browser suite runs in CI after `pnpm check` (`96c3918`).
- Item 18: search runs without its per-address limit when Redis is unreachable (ADR-050).
- Item 22: `SITE_TRUST_PROXY` is validated in `packages/config` (`loadWebEnv`).
- Architecture review (see the section below): all high and medium findings are fixed and pushed, from ADR-052 to ADR-059.

## Architecture review: what is still open

- **Tests for the newsroom proxy and logout route.** The proxy's body cap and the logout origin check are covered only by typecheck.
- **End-to-end 503 tests.** The sign-in and upload refusals during a Redis outage are covered by reading the code, not by a test with a broken Redis.
- **Health count per probe.** The outbox count runs on every probe. Not measured; the retention job should keep the table small.

## Decisions needed

1. **Design rule for pictures.** `apps/web/docs/design-system/spacing-layout-system.md` §7A.5 says the lead image is required. The exception for imported articles is recorded in ADR-051 but not in the design system, which the web app's rules do not let us edit. The design owner must record it.
2. **Redirect status.** The article page sends a 307, and the spec asks for a 301. The old `/news/<slug>` path therefore goes 301 then 307. Search engines treat 307 as temporary.
3. **Roles and fact-checking (Q1, Q15).** The seeded roles are provisional. `DR-18` forbids a fact-check feature, while docs 02 and 05 list one.
4. **Retention and consent (Q9, Q10, Q16).** The operational retention for the outbox and job keys is decided (ADR-057). Consent and retention for analytics, GA4 and ad events are still needed.
5. **Section mapping.** About 1,540 imported articles sit under Geopolitics. The mapping was approved but has not been checked on the live site.
6. **Email provider.** Needed for the newsletter. Not yet in the open questions.

## Verify

7. **CI on the latest commits.** The browser suite and the RustFS storage job are wired into `.github/workflows/ci.yml`, but a green run on the latest commits has not been confirmed here. `gh` is not installed locally.
8. **Imported articles in a browser.** One no-picture article was checked at desktop and 375px. The rest have only typecheck and unit tests.

## Known gaps

9. **Re-publishing imported articles.** The API still requires a lead image to publish, so an editor who re-publishes one is stopped until a picture is added.
10. **Lead-image rule in the newsroom.** Only the API enforces it, not the editor's interface.

## Migration (Phases 0 and 3)

12. **Redirect registry.** Maps old addresses to new ones. Item 11 is done, so this is unblocked, but the five decisions in the inventory (ad redirect links, canonical host, tag topic pages per Q23, six unmapped categories, the search parameter) and open question 14 come first.
13. **Media copy.** Pictures from the old site, with rights checks. The export has no images yet.
14. **Dual-read comparison, delta import and rehearsal.**
15. **Cutover plan.** Editorial freeze or dual-write, rollback switch, monitoring.

## Before launch

16. **Browser tests in CI.** Done for `apps/web`: Chromium only, against the dev server. WebKit is not in CI yet, and the newsroom has no browser tests.
17. **Rate limits.** Enforced: uploads (per account, ADR-052), search, the view counter and sign-in. Readers go through during a Redis outage and sign-in and uploads are refused (ADR-058). Still unread, each waiting for its endpoint: `rate_limit.ad_redirect` (no ad redirect endpoint until the advertising module exists), `ingestion`, `newsletter_subscribe`, `card_generation` and `ai`. `rate_limit.login` is unread too: sign-in uses its own built-in limit. Each unread row is enforced with its endpoint or removed.
18. **Search without Redis.** Done (see above).
19. **Observability (Epic E).** Metrics, tracing, Sentry and dashboards. Dead-letter alerting waits for this (ADR-053).
20. **Delivery.** Docker images, deployment, backups and restore tests.
21. **Security.** External review of sign-in, public-site security headers, and secret and dependency scanning.
22. **`SITE_TRUST_PROXY` config location.** Done (see above).

## Committed scope after launch

23. **Advertising (Epic G).** Needs item 4.
24. **Newsletter with double opt-in.** Needs item 6.
25. **Analytics consent and GA4.** Needs item 4.
26. **Newsroom screens.** Calendar (still a placeholder), revision comparison, configuration screen.
27. **Media variants in the worker.** Still generated in the request.
28. **Public features.** Topic pages, computed trending terms, Bangla review of new strings.

## Later

29. **AI Gateway and classification.** Needs the rewrite-threshold policy (Q11).
30. **More ingestion connectors.** Needs the source policy (Q4).
31. **Social distribution.** Needs the channel decision (Q8).
32. **Phase 7** (entities, claims, OpenSearch). Needs measured demand.

## Suggested order

- **Next:** decisions 1, 2 and 6, and verification items 7 and 8.
- **Then:** item 9 and item 12, once their decisions are made. Item 12 unblocks migration.
- **Then:** the architecture review's open items (the poll lock, the proxy and logout tests, the 503 tests), and the rest of the migration and launch items, in the order above.
