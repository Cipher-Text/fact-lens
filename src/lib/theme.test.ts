import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  nextThemeChoice,
  readThemeChoice,
  setThemeChoice,
  themeScript,
} from "./theme";

// Two states: light and dark. Light is first on every device, and the system setting is
// not used (spacing-layout-system.md Section 6, DR-201).
describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("starts light when nothing is stored", () => {
    expect(readThemeChoice()).toBe("light");
    applyTheme(null);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("dark is applied only when chosen", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("treats an unknown or old stored value as light", () => {
    localStorage.setItem("fl-theme", "purple");
    expect(readThemeChoice()).toBe("light");
    localStorage.setItem("fl-theme", "system");
    expect(readThemeChoice()).toBe("light");
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("stores the choice", () => {
    setThemeChoice("dark");
    expect(readThemeChoice()).toBe("dark");
  });

  it("sets no data-theme attribute (DR-281)", () => {
    applyTheme("dark");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("keeps the choice for this page when storage is blocked (DR-340)", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    setThemeChoice("dark");
    expect(readThemeChoice()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    setThemeChoice("light");
    expect(readThemeChoice()).toBe("light");
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("the switch moves between light and dark", () => {
    expect(nextThemeChoice("light")).toBe("dark");
    expect(nextThemeChoice("dark")).toBe("light");
  });

  it("the inline script does not read the system setting", () => {
    expect(themeScript).not.toContain("matchMedia");
    expect(themeScript).not.toContain("prefers-color-scheme");
  });
});
