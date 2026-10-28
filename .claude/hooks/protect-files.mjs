// PreToolUse (Edit|Write|Bash): blocks edits to the specs (except on a page/ branch), secrets and the lock file.
// For Bash it blocks a command that writes into a protected path:
// a redirect, tee, sed -i, perl -pi, or cp / mv with a protected target.
// Exit code 2 blocks the tool call and sends the message to Claude.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readInput } from "./_input.mjs";

const { rel, root, command } = readInput();

// Specs change only on a page branch, in the page pull request (AGENTS.md Section 9).
// On dev, main and every other branch they stay locked, so they never change after a merge.
let branch = "";
try {
  branch = readFileSync(join(root, ".git", "HEAD"), "utf8").trim().replace(/^ref: refs\/heads\//, "");
} catch {
  branch = "";
}
const onPageBranch = branch.startsWith("page/") || branch.startsWith("task/");

const PROTECTED = [
  { test: (p) => !onPageBranch && p.startsWith("docs/design-system/"), why: "the specs change only on a page/ branch, at the final checkpoint" },
  { test: (p) => /(^|\/)\.env(\.|$)/.test(p), why: "env files can hold secrets" },
  { test: (p) => p === "pnpm-lock.yaml", why: "pnpm writes the lock file; use pnpm add or pnpm install" },
];

const clean = (p) =>
  p.replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(root.replace(/\\/g, "/") + "/", "").replace(/^\.\//, "");

// Paths that a Bash command writes to.
function bashTargets(cmd) {
  const out = [];
  for (const part of cmd.split(/&&|\|\||[;|\n]/)) {
    for (const m of part.matchAll(/>>?\s*(\S+)/g)) out.push(m[1]);
    const words = part.trim().split(/\s+/);
    const tool = words[0];
    const args = words.slice(1).filter((w) => !w.startsWith("-"));
    if (tool === "tee") out.push(...args);
    if ((tool === "sed" && /\s-i/.test(part)) || (tool === "perl" && /\s-p?i/.test(part))) out.push(...args.slice(1));
    if ((tool === "cp" || tool === "mv") && args.length >= 2) out.push(args[args.length - 1]);
  }
  return out.map(clean);
}

const targets = rel ? [rel] : command ? bashTargets(command) : [];
let hit, target;
for (const t of targets) {
  hit = PROTECTED.find((r) => r.test(t) || (t.endsWith("/") && r.test(t + "x")));
  if (hit) { target = t; break; }
}
if (hit) {
  console.error(
    `Blocked: ${target} is protected because ${hit.why}. ` +
      `Do not edit it another way. If a spec is wrong or a value is missing, ` +
      `report it as a DOC- issue in docs/ISSUES.md.`
  );
  process.exit(2);
}
process.exit(0);
