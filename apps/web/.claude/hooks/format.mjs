// PostToolUse (Edit|Write): formats the edited file with the repo's Prettier.
// Does nothing when Prettier is not installed yet or the file type is not supported.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readInput } from "./_input.mjs";

const { root, abs, rel } = readInput();
const bin = join(root, "node_modules", ".bin", process.platform === "win32" ? "prettier.cmd" : "prettier");
const supported = /\.(tsx?|jsx?|mjs|css|json|md|ya?ml)$/.test(rel);

if (abs && supported && !rel.startsWith("docs/") && existsSync(bin)) {
  spawnSync(bin, ["--write", "--log-level", "warn", abs], { stdio: "ignore" });
}
process.exit(0);
