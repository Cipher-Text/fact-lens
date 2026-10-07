import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyTheme,
  nextThemeChoice,
  readThemeChoice,
  setThemeChoice,
} from "./theme";

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the system theme when the choice is system", () => {
    mockSystemDark(true);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");

    mockSystemDark(false);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("an explicit choice overrides the system theme", () => {
    mockSystemDark(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    mockSystemDark(false);
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("treats an unknown stored value as system", () => {
    mockSystemDark(false);
    localStorage.setItem("fl-theme", "purple");
    expect(readThemeChoice()).toBe("system");
    applyTheme("purple");
    expect(document.documentElement.dataset.themeChoice).toBe("system");
  });

  it("stores the choice", () => {
    mockSystemDark(false);
    setThemeChoice("dark");
    expect(readThemeChoice()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("the toggle cycles system, light, dark, then system", () => {
    expect(nextThemeChoice("system")).toBe("light");
    expect(nextThemeChoice("light")).toBe("dark");
    expect(nextThemeChoice("dark")).toBe("system");
  });
});
