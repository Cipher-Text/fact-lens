# T6: same-origin media for the public site

Owner: Codex (normal execution). Plan: [../public-site-api.md](../public-site-api.md). Needs T2 to T5 (merged). Reads: `apps/web/AGENTS.md`, `apps/web/next.config.ts`, `apps/web/src/proxy.ts` (the `config.matcher` at its end), `apps/web/src/lib/api/adapters.ts` (`imageFromMedia`), `apps/api/src/news/news.service.ts` (the `urls` it builds: `/public/media/<id>/<variant>`, relative).

## Goal

The API's media URLs are relative (`/public/media/<id>/card`). With `FACTLENS_API_URL` set, the site serves them from its own origin by rewriting them to the API, so the site never depends on a second origin for images (decision 4). Without it, nothing changes.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Create `apps/web/src/lib/api/media-rewrite.ts`: a pure function `mediaRewrites(apiBase: string | null)` returning the rewrite list for `next.config`. When the base is null it returns no rules. When set, it returns `beforeFiles: [{ source: "/public/media/:path*", destination: "<base>/public/media/:path*" }]`. The base has its trailing slash removed.
  - `beforeFiles` is required. A plain `afterFiles` rewrite would run after the `[lang]` routes, which would match `public` as a language and answer 404 first.
- Edit `apps/web/next.config.ts`: add `async rewrites()` that returns `mediaRewrites(process.env.FACTLENS_API_URL?.trim() || null)`. Keep the existing `agentRules: false` setting.
- Edit `apps/web/src/proxy.ts`: change the `config.matcher` so it does not match `public/media/`. The matcher is currently `"/((?!api/|_next/).*)"`; the new one also excludes `public/media/`. Nothing else in the proxy changes. Without this, the proxy would redirect media requests to a language prefix.
- Create `apps/web/src/lib/api/media-rewrite.test.ts`:
  - with no base, no rules;
  - with a base that has a trailing slash, one `beforeFiles` rule with the slash removed in the destination;
  - the proxy matcher regex does not match `/public/media/<id>/card`, and still matches `/en/category/economy` (test the matcher string directly, importing `config` from `src/proxy.ts`).
- `adapters.ts` is not changed: its `src` stays the relative `urls.card`, which the rewrite now serves.

## Do NOT touch

Components, the content seam, the API, `packages/**`, the poll and social calls, Playwright tests.

## Acceptance

1. With `FACTLENS_API_URL` unset, `next.config` has no rewrites and the proxy behaves as before (existing proxy tests pass unchanged).
2. With it set, `/public/media/...` is a `beforeFiles` rewrite to the API.
3. The proxy matcher excludes `public/media/` and nothing else.
4. The new tests pass.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output of all four. Do not start dev servers, do not run `./run.sh`, do not commit. (A manual check of an image in the browser is done by Claude after the commit.)
