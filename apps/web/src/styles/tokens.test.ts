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

// R5-01: one slide duration token (DR-357) and the typography ink tokens (DR-355).
// A hit without its line number, so an edit above the token does not fail the test.
const definition = (hit: string) => hit.replace(/:\d+:/, ":");

describe("motion duration token (DR-357)", () => {
  it("450 occurs in src/ only in the --duration-slide definition", () => {
    expect(matches(/450/).map(definition)).toEqual([
      "styles/layout.css: --duration-slide: 450ms;",
    ]);
  });

  it("no transition sets a time of its own: only the token, the 200ms default or 0", () => {
    const time = /\b(\d*\.?\d+)m?s\b|duration-(\d+)\b/g;
    const own = matches(/transition|duration/).filter((hit) =>
      [...hit.split(": ").slice(1).join(": ").matchAll(time)].some(
        ([value, , utility]) =>
          !["0s", "0ms", "200ms"].includes(value) && utility !== "200",
      ),
    );
    expect(own.map(definition)).toEqual([
      "styles/layout.css: --duration-slide: 450ms;",
    ]);
  });
});

describe("ink inset tokens (DR-355)", () => {
  it.each(["--ink-title-sm-start", "--ink-title-sm-end", "--ink-metadata-end"])(
    "%s does not occur in src/",
    (name) => {
      expect(matches(new RegExp(name.replace(/[-]/g, "\\-")))).toEqual([]);
    },
  );

  it("typography.css defines the three §3.1 tokens for English and Bangla", () => {
    const css = files.find((f) => f.name === "styles/typography.css")!.text;
    for (const token of [
      "--type-story-title-sm-ink-start",
      "--type-story-title-sm-ink-end",
      "--type-metadata-ink-end",
    ]) {
      expect(css.split(`${token}:`).length - 1, token).toBe(2);
    }
  });
});
