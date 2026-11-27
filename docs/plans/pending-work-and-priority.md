# Pending work and implementation priority

Status as of commit `928c684` (pushed to `origin/main`). Each item says what is needed and what it depends on. Items keep their numbers across revisions; done items stay listed so the numbers do not move.

## Done since the previous revision

- The canonical public article address is `/story/<slug>-<id>` (ADR-027). Bare and old slugs redirect to it. Open question 14 is decided in part: the locale and prefix policy is still open.
- Imported cipher-press articles without a picture show on the public site with no hero image (ADR-051).
- An old `/news/<slug>` address redirects to `/story/<slug>` (301, same language).
- Item 11: the full legacy URL inventory is committed (`docs/plans/legacy-url-inventory.csv`, 2,517 addresses).
- Item 16: the Chromium browser suite runs in CI after `pnpm check` (`96c3918`).
- Item 18: search runs without its per-address limit when Redis is unreachable (ADR-050).
- Item 22: `SITE_TRUST_PROXY` is validated in `packages/config` (`loadWebEnv`).
- Decision 1: a lead image is not required to publish, for any article (26 Nov 2026). The design owner still has to update §7A.5.
- Decision 6: email is sent through Resend, behind a provider-neutral sender in the worker (ADR-063).
- Newsroom quick sign-in for development: one seeded account per role, one click each (`DEV_QUICK_LOGIN`, ADR-064).
- Item 21 (part): dependency and secret scanning run in CI, and the public site sends security headers (ADR-061, ADR-062). Both apps moved to Next.js 16.4.6 after two critical advisories.
- Architecture review (see the section below): all findings are fixed and pushed, from ADR-052 to ADR-060.

## Architecture review: all findings addressed

The review's findings are fixed and pushed (ADR-052 to ADR-060). The 503 refusals and the proxy and logout route now have tests. The health probe's outbox count took 45 to 60 ms on a scratch database with about 1.4 million rows, so it needs no change yet; a partial index on pending rows is the next step if the table grows, and ADR-057's retention keeps it small.

## Decisions needed

1. **Design rule for pictures.** Decided 26 Nov 2026: a lead image is not required to publish, for any article. The placeholder covers one without it (ADR-033, ADR-051). Still open for the design owner: `apps/web/docs/design-system/spacing-layout-system.md` §7A.5 says it is required, and our rules do not let us edit the design system.
2. **Redirect status.** The article page sends a 307, and the spec asks for a 301. The old `/news/<slug>` path therefore goes 301 then 307. Search engines treat 307 as temporary.
3. **Roles and fact-checking (Q1, Q15).** The seeded roles are provisional. `DR-18` forbids a fact-check feature, while docs 02 and 05 list one.
4. **Retention and consent (Q9, Q10, Q16).** The operational retention for the outbox and job keys is decided (ADR-057). Decided (ADR-065): analytics and view tracking run without a consent prompt. Still needed: a privacy notice, and retention for analytics, GA4 and ad events. Revisit ADR-065 before any third-party tag, advertising, or readers in consent-regulated regions.
5. **Section mapping.** About 1,540 imported articles sit under Geopolitics. The mapping was approved but has not been checked on the live site.
6. **Email provider.** Decided: Resend (ADR-063). Still to check before building: its current prices and limits for a large list, and the sending domain.

## Verify

7. **CI on the latest commits.** The browser suite and the RustFS storage job are wired into `.github/workflows/ci.yml`, but a green run on the latest commits has not been confirmed here. `gh` is not installed locally.
8. **Imported articles in a browser.** One no-picture article was checked at desktop and 375px. The rest have only typecheck and unit tests.

## Known gaps

9. **Re-publishing imported articles.** An imported article has no desk, so a revision of it cannot be published until an editor assigns one (the review rule "Assign a desk"). A lead image plays no part: the API does not require one.
10. **Lead-image rule.** Closed: a lead image is not required (decision 1), so there is nothing to enforce.

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
20. **Delivery.** D1 to D7 are built (images, CI image job, environment guard, health probes, release step, staging stack, backups; see [deployment.md](./deployment.md)). Open: a staging host and domains, the first real run of the smoke runbook, real R2 and its lifecycle rule, the nightly cron on a host, and a production host.
21. **Security.** Dependency and secret scanning are in CI (ADR-061), and the public site sends security headers (ADR-062). Still open: a nonce-based script policy for the public site (it needs the proxy and the browser suite), and an external review of sign-in.
22. **`SITE_TRUST_PROXY` config location.** Done (see above).

## Committed scope after launch

23. **Advertising (Epic G).** Needs item 4.
24. **Newsletter with double opt-in.** Needs the email sender (item 33) and the consent decision (item 4).
25. **Analytics consent and GA4.** Needs item 4.
26. **Newsroom screens.** Calendar (still a placeholder), revision comparison, configuration screen.
27. **Media variants in the worker.** Still generated in the request.
28. **Public features.** Topic pages, computed trending terms, Bangla review of new strings.
33. **Email sender.** A provider-neutral sender in the worker, with Resend as the first adapter (ADR-063), bounce and complaint webhooks and a suppression list. The newsletter (24) and email for account invitations and password resets need it.

## Later

29. **AI Gateway and classification.** Needs the rewrite-threshold policy (Q11).
30. **More ingestion connectors.** Needs the source policy (Q4).
31. **Social distribution.** Needs the channel decision (Q8).
32. **Phase 7** (entities, claims, OpenSearch). Needs measured demand.

## Suggested order

- **Next:** decision 2, and verification items 7 and 8.
- **Then:** item 9 and item 12, once their decisions are made. Item 12 unblocks migration.
- **Then:** the rest of the migration and launch items, in the order above.
