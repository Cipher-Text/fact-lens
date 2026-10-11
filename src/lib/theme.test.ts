import { beforeEach, describe, expect, it } from "vitest";

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
    delete document.documentElement.dataset.theme;
  });

  it("starts light when nothing is stored", () => {
    expect(readThemeChoice()).toBe("light");
    applyTheme(null);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("dark is applied only when chosen", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("treats an unknown or old stored value as light", () => {
    localStorage.setItem("fl-theme", "purple");
    expect(readThemeChoice()).toBe("light");
    localStorage.setItem("fl-theme", "system");
    expect(readThemeChoice()).toBe("light");
    applyTheme("system");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("stores the choice", () => {
    setThemeChoice("dark");
    expect(readThemeChoice()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
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
