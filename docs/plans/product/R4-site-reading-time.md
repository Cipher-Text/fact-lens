# R4: the site shows the API's reading time

Owner: Codex (normal execution). Reading time steps 1 to 3 are merged (`6db7f4a`, `b3f0b2d`, `c909812`); the public `readingMinutes` is now required in `packages/contracts` (news detail and list items). Reads: `apps/web/AGENTS.md`, `apps/web/src/lib/api/article.ts` (the site's own calculation: `readingMinutesFrom`, its rate constants and its word counting), `apps/web/src/lib/api/adapters.ts` (`storyFromListItem`), `apps/web/src/content/types.ts` (`Story.readingMinutes`), `docs/24-reading-time.md` sections 5 and 7.

## Goal

The site shows the reading time the API sends. The site stops calculating it. The mock content and mock mode are unchanged.

## Workspace

`fact-lens-web` (`apps/web`).

## Files

- Edit `apps/web/src/lib/api/article.ts`: delete `readingMinutesFrom`, its rate constants and its word counting (the code that uses `Intl.Segmenter` for the reading time). The article's `readingMinutes` is `item.readingMinutes` from the API.
- Edit `apps/web/src/lib/api/adapters.ts`: `storyFromListItem` and `storyFromNews` set `readingMinutes: item.readingMinutes` on the `Story`.
- Update every test fixture that builds a public news item or a list item, so it includes `readingMinutes` (for example `adapters.test.ts`, `article.test.ts`, `pages.test.ts`, `home.test.ts`). Use the value the fixture's body would give; a plain fixture can use `2`.
- Delete the tests of the deleted calculation (in `article.test.ts`), and add tests that: the article's reading time is the API value (including when the API value is 1); the story card gets the list item's value.

## Do NOT touch

`src/content/**` (the mock keeps its own reading times), `src/components/**`, the mock-mode code paths, `apps/api/**`, `packages/**`, the Playwright tests.

## Acceptance

1. No reading-time calculation remains in `apps/web/src/lib/api/` (search for `Segmenter` and the rate constants in that folder: none).
2. An API-backed article and its story cards show the API's value.
3. Mock mode is unchanged.
4. All web fixtures pass the contracts schemas with `readingMinutes` present.

## Verification

```bash
pnpm --filter fact-lens-web typecheck
pnpm --filter fact-lens-web lint
pnpm --filter fact-lens-web test
pnpm --filter fact-lens-web build
```

Report the output of all four. Do not start dev servers, do not run `./run.sh`, do not commit.
