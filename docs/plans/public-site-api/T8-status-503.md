# T8: serve 503 when the API is down

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Decision: [open question 30](../../19-open-questions.md), decided 17 November 2026 as a cached health check in the middleware. Reads: `apps/web/AGENTS.md`, `apps/web/src/proxy.ts` (the middleware; it is synchronous today), `apps/web/src/i18n/config.ts` (language helpers), `apps/web/src/i18n/en.ts` and `bn.ts` (`unavailable.title` and `unavailable.body`), `apps/api/src/health.controller.ts` (`GET /health/ready`).

## Goal

With `FACTLENS_API_URL` set, a page request (a browser document request) is answered with HTTP 503 and the localized unavailable page while the API is down. The check runs at most once every 10 seconds per server process. Mock mode (`FACTLENS_API_URL` unset) is unchanged.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/lib/api/health.ts`:
  - `createApiHealth({ base, fetchImpl = fetch, now = Date.now, ttlMs = 10_000, timeoutMs = 1_000 })` returning `{ isUp(): Promise<boolean> }`.
  - `isUp` calls `GET <base>/health/ready` with `AbortSignal.timeout(timeoutMs)`. A 2xx answer is up. A network error, a timeout, or a non-2xx answer is down.
  - The result is cached for `ttlMs`. While a check is in flight, concurrent calls share that one request.
- Create `apps/web/src/lib/api/unavailable-page.ts`: `unavailableHtml(lang)` returns a complete HTML document in that language (`<html lang>`), with the dictionary's `unavailable.title` as `<h1>` and `unavailable.body` as a paragraph, and a link to the language's home page. Escape the text. Use inline minimal styling only (no hard-coded brand colours; a `font-family: system-ui` and `max-width` are enough).
- Edit `apps/web/src/proxy.ts`:
  - `proxy` becomes `async`. The existing redirect and language logic is unchanged.
  - Before that logic, when `process.env.FACTLENS_API_URL` is set and the request is a document request (method `GET`, and the `accept` header contains `text/html`), call the health check. If the API is down, return `new Response(unavailableHtml(lang), { status: 503, headers: { "content-type": "text/html; charset=utf-8", "retry-after": "30", "cache-control": "no-store" } })`. `lang` comes from the path's first segment, falling back to the default language.
  - The health check object is created once per process from `FACTLENS_API_URL`.
  - `config.matcher` is unchanged (`/api/`, `/_next/` and `public/media/` stay excluded).
- Create `apps/web/src/lib/api/health.test.ts`: up answers are cached for the TTL; a network error, a timeout (use a fetch that never resolves and a 1 ms timeout) and a 500 are all down; concurrent calls make one request; after the TTL the check runs again.
- Create `apps/web/src/lib/api/unavailable-page.test.ts`: the English and Bangla documents contain their own title and escape `<` in text.
- Create or extend `apps/web/src/proxy.test.ts` (keep the existing tests passing unchanged): with the API set and a down check, a document request gets 503 with `retry-after` and the localized body in both languages; a request with `accept: application/json` passes through; with the API unset there is no health call.

## Do NOT touch

The API, `packages/**`, the page files, the components, `src/content/**`, the poll and social calls, the ads, the Playwright tests (they run in mock mode, where nothing changes).

## Acceptance

1. Mock mode: no health call, every page and the existing proxy tests behave as before.
2. API mode, API up: pages pass through unchanged.
3. API mode, API down: document requests get 503, `retry-after: 30`, `cache-control: no-store`, and the localized page in the language of the path.
4. The health check runs at most once per 10 seconds, and concurrent requests share it.
5. Non-document requests (for example JSON) and the excluded paths are not affected.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output. Do not start dev servers, do not run `./run.sh`, do not commit. (Claude checks a real 503 by hand after the commit, with the API stopped.)
