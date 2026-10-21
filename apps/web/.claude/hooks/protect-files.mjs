// PreToolUse (Edit|Write|Bash): blocks edits to the specs, secrets and the lock file.
// For Bash it blocks a command that writes into a protected path:
// a redirect, tee, sed -i, perl -pi, or cp / mv with a protected target.
// Exit code 2 blocks the tool call and sends the message to Claude.
import { readInput } from "./_input.mjs";

const { rel, root, command } = readInput();

const PROTECTED = [
  { test: (p) => p.startsWith("docs/design-system/"), why: "the design-system specs come from the blueprint project" },
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
      `stop and report it as a DOC- issue in your summary.`
  );
  process.exit(2);
}
process.exit(0);
