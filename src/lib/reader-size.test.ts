import { afterEach, describe, expect, it } from "vitest";

import {
  applyReaderSize,
  parseReaderSize,
  readerSizeScript,
} from "./reader-size";

const root = () => document.documentElement;

afterEach(() => {
  root().removeAttribute("data-reader-size");
  window.localStorage.clear();
});

describe("parseReaderSize (TYP-15)", () => {
  it("reads the three steps", () => {
    expect(parseReaderSize("0")).toBe(0);
    expect(parseReaderSize("1")).toBe(1);
    expect(parseReaderSize("2")).toBe(2);
  });

  it("reads anything else as no stored size", () => {
    for (const value of [null, "", "3", "-1", "1.5", "lg"])
      expect(parseReaderSize(value), String(value)).toBeNull();
  });
});

describe("applyReaderSize", () => {
  it("sets lg and xl on <html> and clears the default step", () => {
    applyReaderSize(1);
    expect(root().getAttribute("data-reader-size")).toBe("lg");
    applyReaderSize(2);
    expect(root().getAttribute("data-reader-size")).toBe("xl");
    applyReaderSize(0);
    expect(root().hasAttribute("data-reader-size")).toBe(false);
    applyReaderSize(2);
    applyReaderSize(null);
    expect(root().hasAttribute("data-reader-size")).toBe(false);
  });
});

describe("readerSizeScript (before the first paint)", () => {
  it("applies the stored size", () => {
    window.localStorage.setItem("rd-text-size", "2");
    new Function(readerSizeScript)();
    expect(root().getAttribute("data-reader-size")).toBe("xl");
  });

  it("sets nothing for a bad stored value", () => {
    window.localStorage.setItem("rd-text-size", "big");
    new Function(readerSizeScript)();
    expect(root().hasAttribute("data-reader-size")).toBe(false);
  });
});
