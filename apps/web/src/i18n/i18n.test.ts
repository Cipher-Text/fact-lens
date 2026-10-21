import { describe, expect, it } from "vitest";

import { bn } from "./bn";
import { en } from "./en";
import { isLang, localizedPath, otherLang, stripLang } from "./config";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function leaves(value: unknown): unknown[] {
  if (typeof value !== "object" || value === null) return [value];
  return Object.values(value).flatMap(leaves);
}

describe("string tables", () => {
  it("bn and en have the same keys", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(bn).sort());
  });

  it("every string is filled in", () => {
    for (const value of [...leaves(bn), ...leaves(en)]) {
      expect(typeof value).toBe("string");
      expect((value as string).trim()).not.toBe("");
    }
  });

  it("has no fact-check wording (DR-18)", () => {
    const text = JSON.stringify([bn, en]);
    expect(text).not.toMatch(/ফ্যাক্টচেক|fact[\s-]?check/i);
  });

  it("the language switch names the other language in that language (DR-78)", () => {
    expect(bn.language.other).toBe("English");
    expect(en.language.other).toBe("বাংলা");
    // Phones show the short name (spacing-layout-system.md Section 6).
    expect(bn.language.otherShort).toBe("En");
    expect(en.language.otherShort).toBe("বাংলা");
  });
});

describe("language paths (DR-17)", () => {
  it("recognises only bn and en", () => {
    expect(isLang("bn")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(null)).toBe(false);
  });

  it("puts Bangla at the root and English under /en", () => {
    expect(localizedPath("bn")).toBe("/");
    expect(localizedPath("en")).toBe("/en");
    expect(localizedPath("bn", "/latest")).toBe("/latest");
    expect(localizedPath("en", "/latest")).toBe("/en/latest");
  });

  it("swaps the language of a prefixed path", () => {
    expect(localizedPath("bn", "/en/latest")).toBe("/latest");
    expect(localizedPath("en", "/en")).toBe("/en");
    expect(stripLang("/bn")).toBe("/");
    expect(stripLang("/english")).toBe("/english");
    expect(otherLang("bn")).toBe("en");
  });
});
