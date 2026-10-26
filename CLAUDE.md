@AGENTS.md

## Claude Code

The text above comes from `AGENTS.md`. It is the source for every agent. This part is for Claude Code only.

### Start of each session

1. The session-start hook shows the "Now" part of `docs/STATUS.md`. For page work, read the page brief `docs/briefs/<page>.md` and its spec log `docs/spec-log/<page>.md`.
2. Read `docs/design-system/agent-contract.md` Sections 1 to 4 before the first code change.
3. Read only the spec sections that the brief needs. Do not read all four specs at once.
4. Before you build a component, read its sheet in `docs/design-system/component-system.md` Section 7 and the names in Section 3.
5. If the code and the spec do not agree, the spec wins. Change the code; report a spec problem as a `DOC-` issue.

### The flow (no sprints or tickets)

- tajmin starts a page with `/page <name>`. Ask, draft the brief, then wait for tajmin's yes.
- At each checkpoint: stop, post what you built and any new token or component, apply tajmin's tweaks, and wait for "next" (`AGENTS.md` Section 9, step 2).
- Run `/checkpoint` at the final checkpoint or when tajmin asks. Commit only when tajmin says so (`AGENTS.md` Section 9).

### Skills in this repository

| Command | Use it to |
| --- | --- |
| `/page <name>` | Make the page branch, ask the questions, draft the brief and the spec log |
| `/checkpoint` | Checks, spec log, reviewer, specs, `docs/STATUS.md`, `docs/ISSUES.md` and a report; commit after tajmin's yes |
| `/verify` | Run `pnpm check`, the browser tests and the visual check |
| `/check-rules [path]` | Review files against the rule IDs (runs in the `design-reviewer` subagent) |

The `mock-content` skill loads by itself when you create or change mock data.

### Subagents

- `design-reviewer`: read-only review of a diff against the rule IDs. Use it before each commit.
- `visual-qa`: opens the running page in a browser at the test widths and reports layout faults. It needs the Playwright MCP server and `pnpm dev`.

### MCP servers

`.mcp.json` sets two servers. Use them; do not guess.

- `next-devtools`: Next.js 16 documentation for the installed version, and the build and runtime errors of the running dev server. Use it before you write Next.js code that you are not sure about.
- `playwright`: a real browser. Use it to look at the page at each test width.

### Hooks

The hooks in `.claude/settings.json` run by themselves:

- A `.env` file or `pnpm-lock.yaml` cannot be edited. A file in `docs/design-system/` can be edited only on a `page/` branch (`AGENTS.md` Section 10). If a hook blocks you, do not try another way. Report it.
- After each edit in `src/`, a check looks for raw values (hex, `text-[...]`, pixel values, `dark:`, `2xl:`, `vw`, `order-`). If it reports a problem, fix it before you continue.
- Prettier formats each edited file when Prettier is installed.

### Permissions

The session starts in "accept edits" mode: file edits run without a question. Commands outside the allow list in `.claude/settings.json` ask tajmin first. When you ask, say in one line why the command is needed.

### Context

- One page per conversation, if the context allows. tajmin runs `/clear` between pages.

### Preview

The live preview is at https://fact-lens-web-ashy.vercel.app/ (Vercel). Use it only to compare with the local build. Do not deploy, and do not change Vercel settings, unless tajmin asks.
