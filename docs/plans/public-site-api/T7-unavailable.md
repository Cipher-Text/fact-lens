# T7: what readers see when the API is unavailable

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Needs T1 to T6 (merged). Reads: `apps/web/AGENTS.md`, `apps/web/src/i18n/en.ts` and `bn.ts` (the message dictionary), `apps/web/src/lib/api/client.ts` (`ApiUnavailable`), `apps/web/src/app/[lang]/layout.tsx`, the page files changed in T3 to T5.

## Goal

With `FACTLENS_API_URL` set, a page whose data cannot be loaded from the API shows a clear, localized "service unavailable" page. It never shows mock content. Mock mode (`FACTLENS_API_URL` unset) is unchanged. The header, the social links and the poll keep their quiet fallbacks, as they do now.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/app/[lang]/error.tsx`: a client component, rendered by Next when a page throws. It shows the localized title and body from the dictionary, a link to the language's home page, and a button that calls `reset()`. It uses the site's existing components and classes only; no new design tokens and no hard-coded colours.
- Edit `apps/web/src/i18n/en.ts` and `bn.ts`: add `unavailable.title` and `unavailable.body` (English: "News is not available right now" and "Please try again in a few minutes."; Bangla: the same meaning, written by a native speaker before merge, mark the Bangla text with a `TODO-REVIEW` comment for the reviewer to replace if needed).
- Create `apps/web/src/app/[lang]/error.test.tsx` (vitest + testing-library, the site's existing setup): renders the title, body and link in English and in Bangla.
- Do not change pages. A page that cannot load its data throws (`ApiUnavailable`, `ApiBadResponse`), and `error.tsx` takes over. `ApiNotFound` already gives `notFound()` (T4).

## Decision recorded for the lead

Decision 3 (plan) asked for an HTTP 503. App Router cannot set a status from a page; a thrown error is answered as 500. This task does not add a per-request health check to the middleware. The page content is what readers see; the status code is left as an open decision (see the report). Do not add a health check here.

## Do NOT touch

Components, the content seam, `src/content/**`, the API client, the header, the social links, the poll, the ads, Playwright tests, `apps/api/**`, `packages/**`.

## Acceptance

1. With `FACTLENS_API_URL` set and a page's data call failing, the page shows the unavailable view in the page's language, and no mock story appears.
2. With `FACTLENS_API_URL` unset, every page renders as before, and the existing tests pass unchanged.
3. The Bangla and English texts both render (tested).
4. The view uses only existing classes and tokens (no hard-coded colours).

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Also run the mock-mode Playwright suite if it runs in this environment: `pnpm --filter fact-lens-web test:e2e:chromium`. Report whether it ran and its result; if it cannot run here, say so.

Report the output. Do not start dev servers, do not run `./run.sh`, do not commit.
