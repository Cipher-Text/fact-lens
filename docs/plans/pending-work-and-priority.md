# Pending work and implementation priority

Status as of commit `48092a5` (pushed to `origin/main`). Each item says what is needed and what it depends on.

## Done since the previous revision

- The canonical public article address is `/story/<slug>-<id>` (ADR-027). Bare and old slugs redirect to it. Open question 14 is decided in part: the locale and prefix policy is still open.
- Imported cipher-press articles without a picture show on the public site with no hero image (ADR-051).
- An old `/news/<slug>` address redirects to `/story/<slug>` (301, same language).

## Decisions needed

1. **Design rule for pictures.** `apps/web/docs/design-system/spacing-layout-system.md` §7A.5 says the lead image is required. The exception for imported articles is recorded in ADR-051 but not in the design system, which the web app's rules do not let us edit. The design owner must record it.
2. **Redirect status.** The article page sends a 307, and the spec asks for a 301. The old `/news/<slug>` path therefore goes 301 then 307. Search engines treat 307 as temporary.
3. **Roles and fact-checking (Q1, Q15).** The seeded roles are provisional. `DR-18` forbids a fact-check feature, while docs 02 and 05 list one.
4. **Retention and consent (Q9, Q10, Q16).** Needed before analytics, GA4 and ad events.
5. **Section mapping.** About 1,540 imported articles sit under Geopolitics. The mapping was approved but has not been checked on the live site.
6. **Email provider.** Needed for the newsletter. Not yet in the open questions.

## Verify

7. **CI on the latest commits.** The RustFS storage job and the legacy import and redirect tests have not run in CI. `gh` is not installed locally.
8. **Imported articles in a browser.** The no-picture article page was checked with typecheck and unit tests only.

## Known gaps

9. **Re-publishing imported articles.** The API still requires a lead image to publish, so an editor who re-publishes one is stopped until a picture is added.
10. **Lead-image rule in the newsroom.** Only the API enforces it, not the editor's interface.

## Migration (Phases 0 and 3)

11. **Full URL inventory.** Every old cipher-press address, not only `/news/<slug>`.
12. **Redirect registry.** Maps old addresses to new ones. Depends on item 11.
13. **Media copy.** Pictures from the old site, with rights checks.
14. **Dual-read comparison, delta import and rehearsal.**
15. **Cutover plan.** Editorial freeze or dual-write, rollback switch, monitoring.

## Before launch

16. **Browser tests in CI.** The newsroom and public site are hand-checked only, and Playwright is not in `pnpm check`.
17. **Rate limits.** Upload and ad-redirect limits are not enforced. Seven seeded rows are unused.
18. **Search without Redis.** Done: when Redis is unreachable, search runs without its per-address limit and logs the outage (ADR-050).
19. **Observability (Epic E).** Metrics, tracing, Sentry and dashboards.
20. **Delivery.** Docker images, deployment, backups and restore tests.
21. **Security.** External review of sign-in, public-site security headers, and secret and dependency scanning.
22. **`SITE_TRUST_PROXY` config location.** Done: the setting is validated in `packages/config` (`loadWebEnv`), and `apps/web` reads it through that loader.

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
- **Then:** items 9, 11 and 16, which unblock migration and launch testing.
- **Then:** the rest of the migration and launch items, in the order above.
