// SessionStart: puts the "Now" part of docs/STATUS.md into Claude's context,
// so each new session knows what is done and what is next.
// On a page/ or task/ branch it also puts the "Now" part and the last log entry
// of the progress file docs/progress/<name>.md, so the work goes on after a clear.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const file = join(root, "docs", "STATUS.md");

if (existsSync(file)) {
  const text = readFileSync(file, "utf8");
  const m = text.match(/## Now[\s\S]*?(?=\n## |$)/);
  if (m) {
    console.log("Fact Lens status (from docs/STATUS.md):\n" + m[0].trim());
  }
}

// Ask git for the branch: in a worktree `.git` is a file, not a folder.
// On a detached HEAD git prints "HEAD", so the hook shows no progress file.
let branch = "";
try {
  branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  branch = "";
}
const work = branch.match(/^(page|task)\/(.+)$/);
if (work) {
  const name = work[2];
  const progress = join(root, "docs", "progress", `${name}.md`);
  console.log(`\nBranch ${branch}. Brief: docs/briefs/${name}.md.`);
  if (existsSync(progress)) {
    const text = readFileSync(progress, "utf8");
    const now = text.match(/## Now[\s\S]*?(?=\n## |$)/);
    // Log entries are the ### blocks under "## Log", not the template placeholder.
    const log = text.match(/\n## Log\n([\s\S]*?)(?=\n## |$)/);
    const entries = log ? log[1].split(/\n(?=### )/).filter((e) => e.startsWith("### ") && !e.includes("<title>")) : [];
    const last = entries.length ? entries[entries.length - 1] : "";
    console.log(`Progress (from docs/progress/${name}.md; read the whole file before you change code):`);
    if (now) console.log(now[0].trim());
    if (last) console.log("\nLast log entry:\n" + last.trim());
  } else {
    console.log(`No progress file yet: make docs/progress/${name}.md from docs/progress/TEMPLATE.md.`);
  }
}
process.exit(0);
