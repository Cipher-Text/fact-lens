// SessionStart: puts the "Now" part of docs/PROGRESS.md into Claude's context,
// so each new session knows what is done and what is next.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const file = join(root, "docs", "PROGRESS.md");
if (!existsSync(file)) process.exit(0);

const text = readFileSync(file, "utf8");
const m = text.match(/## Now[\s\S]*?(?=\n## |$)/);
if (m) {
  console.log("Fact Lens progress (from docs/PROGRESS.md):\n" + m[0].trim());
}
process.exit(0);
