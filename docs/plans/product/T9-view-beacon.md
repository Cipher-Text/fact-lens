# T9: the view beacon from the public site

Owner: Codex (normal execution). Plan: product backlog item 1 (see [../../public-site-api.md](../public-site-api.md) for the site). Reads: `docs/25-most-read-and-performance.md` section 2 (how a view is counted) and section 8 (the site sends views), `packages/contracts/src/analytics.ts` (`viewBeaconSchema`), `apps/web/src/app/api/poll/[id]/vote/route.ts` (the pattern for a site route that forwards to the API), `apps/web/src/app/[lang]/story/[slug]/page.tsx`, `apps/web/AGENTS.md`.

## Goal

After an article page is shown, the browser sends one view to the API, so the most-read lists have data. The site does not count views itself: the API decides (flag, bots, prefetch, rate limit, uniqueness per 24 hours).

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/app/api/views/route.ts`: a `POST` handler.
  - Reads the JSON body and checks it with `viewBeaconSchema` from `@fact-lens/contracts`. A malformed body gets `400`.
  - Replaces the referrer with its **domain only** (or removes it), as doc 25 section 2 requires.
  - Forwards to `${FACTLENS_API_URL}/public/views` with the same body, and with `x-forwarded-for` set to the client address from the incoming request (so the API's rate limit sees the reader, not the site).
  - Always answers `204`, whatever the API answers, and whether or not `FACTLENS_API_URL` is set. Failures are logged, not shown to the reader.
  - Sends no caching headers that could store a view.
- Create `apps/web/src/components/reader/ViewBeacon.tsx`: a client component with props `{ shortId: string; locale: string }`. On mount it posts once to `/api/views` with `{ shortId, locale, sessionId, referrer: document.referrer }` using `fetch` with `keepalive: true`. It renders nothing.
  - `sessionId` is a random string of 32 characters from `crypto.getRandomValues`, stored in `sessionStorage` under `fl-session` so one browser session gives one id. If storage is unavailable, a new random id is used for that page.
  - It does nothing when `FACTLENS_API_URL` is unset. It is rendered only when the article comes from the API (`storyFromNews` path), so mock articles never send views.
- Edit `apps/web/src/app/[lang]/story/[slug]/page.tsx`: render `<ViewBeacon shortId={article.story.id} locale={lang} />` in API mode only. Do not change anything else on the page.
- Create `apps/web/src/app/api/views/route.test.ts`: forwards a valid body with the client address; answers 204 when the API is down; answers 400 for a body that fails the schema; keeps only the referrer's domain.
- Create `apps/web/src/components/reader/ViewBeacon.test.tsx`: posts once per mount; sends no request when the API is unset; reuses the stored session id.

## Do NOT touch

The API, `packages/**`, the most-read and list pages (they already read the API), the ads, the poll route, Playwright tests (mock mode sends no views).

## Acceptance

1. Mock mode: no request is sent, and the existing tests pass unchanged.
2. API mode: an article page sends exactly one beacon per mount, with the short id, locale, session id and referrer domain only.
3. The route answers `204` in every case except a malformed body (`400`), and forwards the client address.
4. No page other than the article sends a view.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output. Do not start dev servers, do not run `./run.sh`, do not commit. (The API needs `TRUST_PROXY=true` for the forwarded address to count in a real deployment; that is set at deployment, not here.)
