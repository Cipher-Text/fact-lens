import { afterEach, describe, expect, it } from "vitest";

import {
  applyReaderSize,
  isArticlePath,
  parseReaderSize,
  readerSizeScript,
} from "./reader-size";

const root = () => document.documentElement;

afterEach(() => {
  root().removeAttribute("data-reader-size");
  window.localStorage.clear();
  window.history.replaceState(null, "", "/");
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

describe("isArticlePath", () => {
  it("is true for a story in bn and en", () => {
    expect(isArticlePath("/story/river-data-framework-t3txcff")).toBe(true);
    expect(isArticlePath("/en/story/river-data-framework-t3txcff")).toBe(true);
  });

  it("is false for other pages", () => {
    for (const path of [
      "/",
      "/en",
      "/latest",
      "/en/category/politics",
      "/topic/story",
    ])
      expect(isArticlePath(path), path).toBe(false);
  });
});

describe("readerSizeScript (before the first paint)", () => {
  it("applies the stored size on an article", () => {
    window.history.replaceState(
      null,
      "",
      "/en/story/river-data-framework-t3txcff",
    );
    window.localStorage.setItem("rd-text-size", "2");
    new Function(readerSizeScript)();
    expect(root().getAttribute("data-reader-size")).toBe("xl");
  });

  it("sets nothing for a bad stored value", () => {
    window.history.replaceState(
      null,
      "",
      "/story/river-data-framework-t3txcff",
    );
    window.localStorage.setItem("rd-text-size", "big");
    new Function(readerSizeScript)();
    expect(root().hasAttribute("data-reader-size")).toBe(false);
  });

  it("sets nothing on a page that is not an article", () => {
    window.localStorage.setItem("rd-text-size", "2");
    new Function(readerSizeScript)();
    expect(root().hasAttribute("data-reader-size")).toBe(false);
  });
});
