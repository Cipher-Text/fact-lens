---
name: verify
description: Run every Fact Lens check (lint, typecheck, unit tests, build, Playwright with axe) and a visual check of the page under work at the validation widths in both languages and themes. Use before saying a task is done.
disable-model-invocation: true
---

# Verify

Run each step. Do not stop at the first failure: collect every result, then fix what your work broke.

## 1. Code checks

1. `pnpm check`
2. Chromium e2e, the gate (`AGENTS.md` §11): `pnpm exec playwright test --project=chromium` with the "Test files" in the brief (`docs/briefs/<name>.md`) and every test file the work added or changed. Run the full `pnpm test:e2e:chromium` when the work changed the token CSS (`src/styles/`), the layout parts (`src/components/layout/`) or the string tables (`src/i18n/`), and on `dev` after each merge. WebKit is a separate report (`docs/webkit-failures.md`).

## 2. Visual check

1. Make sure `pnpm dev` runs. If it does not, start it in the background.
2. Ask the `visual-qa` subagent to check the page under work in both languages (for example `/story/<slug>` and `/en/story/<slug>`), and `/` and `/en` when shared parts changed.
3. If the Playwright MCP server is not connected, tell the user and skip this step. Do not say the visual check passed.

## 3. Report

Give a table: check, result, and the failures with `file:line` or a screenshot name. Then list what you fixed and what remains.
