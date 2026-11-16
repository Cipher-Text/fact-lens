# T1: shared API client for the public site

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Reads: `apps/web/AGENTS.md` (the site's own rules; this task is library code, not UI), `docs/plans/public-site-api.md` decisions 1 and 3.

## Goal

One client for every call from the public site to the API. It parses responses with the shared contracts, times out, and reports "API unavailable" in one way. Nothing visible changes.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Edit `apps/web/package.json`: add `"@fact-lens/contracts": "workspace:*"` in the same form the newsroom uses. Then run `pnpm install --config.strict-dep-builds=false` at the repo root.
- Create `apps/web/src/lib/api/client.ts`:
  - `apiBase(): string | null` reads `process.env.FACTLENS_API_URL`, trims whitespace and trailing slashes, and returns null when unset.
  - `class ApiUnavailable extends Error` for network errors, timeouts (4 seconds), and 5xx answers.
  - `class ApiNotFound extends Error` for 404.
  - `class ApiBadResponse extends Error` when the body does not match the schema.
  - `apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T>` builds the URL from `apiBase()`, sends `accept: application/json`, uses `AbortSignal.timeout(4000)`, and parses with the schema.
- Edit `apps/web/src/lib/navigation.ts` and `apps/web/src/lib/poll-api.ts`: call `apiGet` with the contracts schemas for the navigation and poll responses. Keep their current behaviour exactly: a failure falls back quietly to the static menu or no poll. Keep their exported function names and signatures.
- Create `apps/web/src/lib/api/client.test.ts` (vitest, mocked `fetch`): success parses; 404 gives `ApiNotFound`; 500 and network error give `ApiUnavailable`; a timeout gives `ApiUnavailable`; a body that does not match gives `ApiBadResponse`; an unset base gives `null` from `apiBase()`.

## Do NOT touch

Pages, components, `src/content/**`, Playwright tests, design-system files, `apps/web/docs/**`, anything in `apps/api` or `packages/**`.

## Acceptance

1. `apiGet` is the only place in `apps/web/src/lib` that calls `fetch` for the API.
2. Navigation and poll behave exactly as before, including their fallbacks (their existing tests pass unchanged).
3. The new client tests pass.
4. No hand-written type for a response that has a contracts schema remains in those two files.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output of all four. Do not start dev servers, do not run `./run.sh`, do not commit.
