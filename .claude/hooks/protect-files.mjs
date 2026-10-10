// PreToolUse (Edit|Write): blocks edits to the specs, secrets and the lock file.
// Exit code 2 blocks the tool call and sends the message to Claude.
import { readInput } from "./_input.mjs";

const { rel } = readInput();

const PROTECTED = [
  { test: (p) => p.startsWith("docs/design-system/"), why: "the design-system specs come from the blueprint project" },
  { test: (p) => /(^|\/)\.env(\.|$)/.test(p), why: "env files can hold secrets" },
  { test: (p) => p === "pnpm-lock.yaml", why: "pnpm writes the lock file; use pnpm add or pnpm install" },
];

const hit = PROTECTED.find((r) => rel && r.test(rel));
if (hit) {
  console.error(
    `Blocked: ${rel} is protected because ${hit.why}. ` +
      `Do not edit it another way. If a spec is wrong or a value is missing, ` +
      `stop and report it as a DOC- issue in your summary.`
  );
  process.exit(2);
}
process.exit(0);
