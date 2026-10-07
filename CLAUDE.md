@AGENTS.md

## Claude Code

The text above comes from `AGENTS.md`. It is the source for every agent. This part is for Claude Code only.

### Start of each session

1. Read `docs/PROGRESS.md` and the board in `docs/SPRINT.md`. They tell you which ticket is current.
2. Read `docs/design-system/agent-contract.md` Sections 1 to 4 before the first code change.
3. Read only the spec sections that the ticket needs. Do not read all three specs at once.

### The sprint is turn-based

- Work on one ticket only. Start a ticket only when tajmin types `/ticket`.
- At the end of a ticket, hand over and stop. tajmin tests it and types `/accept` or reports problems.
- Never start the next ticket on your own, even when the current one went well.

### Skills in this repository

| Command | Use it to |
| --- | --- |
| `/ticket [id]` | Plan, build, test and verify the next ticket, then stop for acceptance |
| `/accept` | Mark the ticket in review as Done, commit and push |
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

- A file in `docs/` or a `.env` file cannot be edited. If a hook blocks you, do not try another way. Report it.
- After each edit in `src/`, a check looks for raw values (hex, `text-[...]`, pixel values, `dark:`, `2xl:`, `vw`, `order-`). If it reports a problem, fix it before you continue.
- Prettier formats each edited file when Prettier is installed.

### Permissions

The session starts in "accept edits" mode: file edits run without a question. Commands outside the allow list in `.claude/settings.json` ask tajmin first. When you ask, say in one line why the command is needed.

### Context

- One ticket per conversation. tajmin runs `/clear` after `/accept`.
