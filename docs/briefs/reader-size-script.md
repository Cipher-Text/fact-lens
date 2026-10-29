# reader-size-script (task)

## Goal

Stop the console error "Encountered a script tag while rendering React component." Issue: none (a console error tajmin reported, 30 Oct 2026).

Cause: `ReaderPage` renders `readerSizeScript` as an inline `<script>` in the page body. React 19.2 logs this error each time the client creates an executable `<script>`, which happens on every in-app link to an article (homepage → story). On the client the script does not run; `ReaderRoot` (`useLayoutEffect`) already sets the size. On a full page load there is no error, because the script is hydrated and not created. The JSON-LD script is a data block, so React does not warn about it.

Steps to see it (tajmin, 30 Oct 2026): open `localhost:3000` (Bangla), click the lead story; the Next.js devtools indicator shows 1 issue, and its details show the error.

## Where

- Article page `/story/<slug>-<id>` and `/en/story/<slug>-<id>`, reached by a client link
- `src/components/reader/ReaderPage.tsx`: remove the inline `<script>`
- `src/app/[lang]/layout.tsx`: run the reader size script in `<head>`, next to the theme script. The root layout renders once, so React never creates the script on the client
- `src/lib/reader-size.ts` (`readerSizeScript`): set the size only when the path is an article (`/story/`), because `[data-reader-size]` in `typography.css` is global

## Rules

TYP-15 (stored text size on the first paint, no re-flow), DR-281 (the theme script pattern in the layout). No token, component or spec change.

## Checkpoints

1. Move the reader size script to the layout `<head>` with the article path check; add the e2e test; run the article tests. Final checkpoint (`/checkpoint`).

## Test files

- `tests/e2e/article.spec.ts`: keep "a stored text size is set before hydration (TYP-15)"; add "clicking the lead story on the Bangla homepage logs no script tag error" (tajmin's steps) and "the stored size is not set on the homepage"
- `src/lib/reader-size.test.ts`: the path check
