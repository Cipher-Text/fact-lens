import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

// R4-01: the ThemeToggle tokens and the lang-bn variant are gone (DR-346, DR-349), and no
// corner is rounded anywhere, with no exception (CPT-05, DR-349).

const SRC = join(__dirname, "..");
const SELF = relative(SRC, __filename);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(css|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

const files = sourceFiles(SRC)
  .map((path) => ({
    name: relative(SRC, path),
    text: readFileSync(path, "utf8"),
  }))
  .filter((file) => file.name !== SELF);

function matches(pattern: RegExp) {
  return files.flatMap(({ name, text }) =>
    text
      .split("\n")
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => pattern.test(line))
      .map(({ line, index }) => `${name}:${index + 1}: ${line.trim()}`),
  );
}

describe("removed tokens (DR-346, DR-349)", () => {
  it.each([
    "--color-theme-icon",
    "--color-theme-control",
    "--switch-radius",
    "--switch-thumb-inset",
    "lang-bn",
    "--icon-button-size-bar",
  ])("%s does not occur in src/", (name) => {
    expect(matches(new RegExp(name.replace(/[-]/g, "\\-")))).toEqual([]);
  });
});

describe("no rounded corners (CPT-05)", () => {
  it("no rounded-* class", () => {
    expect(matches(/\brounded-[a-z0-9(]|["'`\s]rounded["'`]/)).toEqual([]);
  });

  it("no border-radius other than 0", () => {
    expect(matches(/border-radius\s*:\s*(?!0(px|rem)?\s*[;}!])/)).toEqual([]);
  });

  it("no radius token in use", () => {
    expect(matches(/var\(--radius|--radius-(?!\*)/)).toEqual([]);
  });
});
