import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatStoryTime, storyTimeScript, storyTimeText } from "./story-time";

const NOW = "2026-10-16T12:00:00+06:00";
const JUST_NOW = { bn: "এইমাত্র", en: "Just in" };
const AGO = { bn: "{hours} ঘণ্টা আগে", en: "{hours} hours ago" };
const ONE = { bn: "{hours} ঘণ্টা আগে", en: "{hours} hour ago" };

function text(iso: string, lang: "bn" | "en", relative = true) {
  return storyTimeText(
    iso,
    lang,
    relative,
    "Asia/Dhaka",
    JUST_NOW[lang],
    ONE[lang],
    AGO[lang],
  );
}

describe("story time (TYP-17, DR-274)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => vi.useRealTimers());

  it("says just in under 1 hour", () => {
    expect(text("2026-10-16T11:30:00+06:00", "en")).toBe("Just in");
    expect(text("2026-10-16T11:30:00+06:00", "bn")).toBe("এইমাত্র");
  });

  it("rounds hours down, in the page language digits", () => {
    expect(text("2026-10-16T10:50:00+06:00", "en")).toBe("1 hour ago");
    expect(text("2026-10-16T08:00:00+06:00", "bn")).toBe("৪ ঘণ্টা আগে");
    expect(text("2026-10-16T09:10:00+06:00", "en")).toBe("2 hours ago");
    expect(text("2026-10-15T12:30:00+06:00", "en")).toBe("23 hours ago");
  });

  it("shows the date and 24-hour time from 24 hours", () => {
    expect(text("2026-10-15T12:00:00+06:00", "en")).toBe("15 Oct, 12:00");
    expect(text("2026-10-12T14:30:00+06:00", "bn")).toBe("১২ অক্টোবর, ১৪:৩০");
  });

  it("adds the year only for an earlier year", () => {
    expect(text("2025-12-31T09:05:00+06:00", "en")).toBe("31 Dec 2025, 09:05");
  });

  it("renders the Dhaka date and time on the server, never a relative time", () => {
    expect(formatStoryTime("2026-10-16T11:59:00+06:00", "en")).toBe(
      "16 Oct, 11:59",
    );
    expect(formatStoryTime("2026-10-07T09:15:00+06:00", "bn")).toBe(
      "৭ অক্টোবর, ০৯:১৫",
    );
  });

  it("builds an inline script of 1.5 KB or less that has no outside reference", () => {
    // Bytes, not characters: the Bangla strings take 3 bytes a letter in UTF-8 (DR-348).
    for (const lang of ["bn", "en"] as const) {
      const script = storyTimeScript(
        lang,
        JUST_NOW[lang],
        ONE[lang],
        AGO[lang],
      );
      expect(new TextEncoder().encode(script).length).toBeLessThanOrEqual(1536);
      expect(script).toContain("time[data-story-time]");
      // Load more calls it at once through refreshStoryTimes.
      expect(script).toContain("window.flStoryTime = run;");
    }
  });
});
