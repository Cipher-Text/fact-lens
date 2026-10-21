// Shared helper: reads the hook input from stdin and returns
// the edited file path relative to the project root ("" if none)
// and, for Bash, the command ("" if none).
import { readFileSync } from "node:fs";
import { relative, isAbsolute } from "node:path";

export function readInput() {
  let data = {};
  try {
    data = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    data = {};
  }
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const raw = data?.tool_input?.file_path || "";
  const abs = raw.replace(/\\/g, "/");
  const rel = isAbsolute(abs) ? relative(root, abs).replace(/\\/g, "/") : abs;
  const command = data?.tool_input?.command || "";
  return { data, root, abs, rel, command };
}
